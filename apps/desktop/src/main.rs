mod backend;
mod cloudflare;
mod config;
mod deploy;
mod tunnel;

use std::sync::{Arc, Mutex};
use std::time::Duration;

use config::{validate_hostname, Config};
use dioxus::prelude::*;
use tokio::io::{AsyncBufRead, AsyncBufReadExt, BufReader};

fn main() {
    dioxus::launch(App);
}

fn stream_reader<R>(mut reader: R, mut log: Signal<Vec<String>>)
where
    R: AsyncBufRead + Unpin + Send + 'static,
{
    spawn(async move {
        let mut line = String::new();
        loop {
            line.clear();
            match reader.read_line(&mut line).await {
                Ok(0) | Err(_) => break,
                Ok(_) => {
                    let trimmed = line.trim_end().to_string();
                    if !trimmed.is_empty() {
                        let mut lines = log.write();
                        lines.push(trimmed);
                        let len = lines.len();
                        if len > 200 {
                            lines.drain(..len - 200);
                        }
                    }
                }
            }
        }
    });
}

#[allow(non_snake_case)]
fn App() -> Element {
    let mut config = use_signal(Config::load);
    let mut status = use_signal(|| "Not tested".to_string());
    let mut testing = use_signal(|| false);
    let mut logged_in = use_signal(cloudflare::is_logged_in);
    let mut deploy_status = use_signal(|| "Not deployed".to_string());
    let mut running = use_signal(|| false);
    let mut log_lines = use_signal(Vec::new);
    let mut tunnel_child: Signal<Option<Arc<Mutex<tokio::process::Child>>>> = use_signal(|| None);

    let run_check = move |_| {
        let url = config.read().backend_url.clone();
        testing.set(true);
        status.set("Testing…".to_string());
        spawn(async move {
            let result = backend::check(&url).await;
            testing.set(false);
            match result {
                Ok(s) => {
                    let room = s.room_id.as_deref().unwrap_or("-");
                    status.set(format!("OK — health up, test room `{room}`"));
                }
                Err(e) => status.set(format!("Failed: {e}")),
            }
        });
    };

    let save = move |_| {
        match config.read().save() {
            Ok(()) => status.set("Saved.".to_string()),
            Err(e) => status.set(format!("Save failed: {e}")),
        }
    };

    let stop = move |_| {
        if let Some(arc) = tunnel_child.read().clone() {
            let mut guard = arc.lock().unwrap();
            let _ = guard.start_kill();
        }
        *tunnel_child.write() = None;
        running.set(false);
        deploy_status.set("Stopped.".to_string());
    };

    let teardown = move |_| {
        if let Some(arc) = tunnel_child.read().clone() {
            let mut guard = arc.lock().unwrap();
            let _ = guard.start_kill();
        }
        *tunnel_child.write() = None;
        running.set(false);
        let name = config.read().tunnel_name.clone();
        deploy_status.set("Tearing down…".to_string());
        spawn(async move {
            match tunnel::ensure_binary().await {
                Err(e) => deploy_status.set(format!("Teardown failed: {e}")),
                Ok(bin) => match tunnel::delete(&bin, &name).await {
                    Ok(msg) => deploy_status.set(format!("Tunnel removed. {}", msg.trim())),
                    Err(e) => deploy_status.set(format!("Teardown failed: {e}")),
                },
            }
        });
    };

    let run_deploy = move |_| {
        let backend_url = config.read().backend_url.clone();
        let hostname = config.read().hostname.clone();
        let tunnel_name = config.read().tunnel_name.clone();
        deploy_status.set("Deploying…".to_string());
        spawn(async move {
            match deploy::deploy(&backend_url, &hostname, &tunnel_name).await {
                Ok(res) => {
                    let url = res.public_url.clone();
                    let mut child = res.child;
                    let stdout = child.stdout.take();
                    let stderr = child.stderr.take();
                    let arc = Arc::new(Mutex::new(child));
                    *tunnel_child.write() = Some(arc.clone());
                    running.set(true);
                    log_lines.set(Vec::new());
                    if let Some(out) = stdout {
                        stream_reader(BufReader::new(out), log_lines);
                    }
                    if let Some(err) = stderr {
                        stream_reader(BufReader::new(err), log_lines);
                    }
                    spawn(async move {
                        loop {
                            tokio::time::sleep(Duration::from_millis(1000)).await;
                            let exited = {
                                let mut guard = arc.lock().unwrap();
                                match guard.try_wait() {
                                    Ok(Some(_)) => true,
                                    Ok(None) => false,
                                    Err(_) => true,
                                }
                            };
                            if exited {
                                running.set(false);
                                break;
                            }
                        }
                    });
                    deploy_status.set(format!("Deployed — {url}"));
                }
                Err(e) => deploy_status.set(format!("Deploy failed: {e}")),
            }
        });
    };

    rsx! {
        main { style: "padding: 24px; font-family: system-ui; max-width: 560px",
            h1 { "Ash Deploy" }
            p { "One-click signaling server hosting." }

            h2 { "Backend" }
            label { "Signaling server URL" }
            input {
                value: "{config.read().backend_url}",
                oninput: move |e: FormEvent| config.write().backend_url = e.value(),
                style: "display: block; width: 100%; margin: 4px 0 8px",
            }

            div { style: "display: flex; gap: 8px",
                button {
                    onclick: run_check,
                    disabled: testing(),
                    "Test Connection"
                }
                button { onclick: save, "Save" }
            }

            p { style: "color: #666",
                "{status}"
            }

            h2 { "Cloudflare" }
            if logged_in() {
                p { style: "color: #18794e",
                    "Authenticated — cert.pem found."
                }
            } else {
                p { style: "color: #b3261e",
                    "Not authenticated. Run this in a terminal, then Re-check:"
                }
                pre { "cloudflared tunnel login" }
            }
            button {
                onclick: move |_| logged_in.set(cloudflare::is_logged_in()),
                "Re-check"
            }

            h2 { "Subdomain" }
            label { "Public hostname" }
            input {
                value: "{config.read().hostname}",
                oninput: move |e: FormEvent| config.write().hostname = e.value(),
                placeholder: "ash.example.com",
                style: "display: block; width: 100%; margin: 4px 0 8px",
            }
            {
                match validate_hostname(&config.read().hostname) {
                    Ok(()) => rsx! { p { style: "color: #18794e", "Valid hostname." } },
                    Err(e) => rsx! { p { style: "color: #b3261e", "{e}" } },
                }
            }

            h2 { "Deploy" }
            button { onclick: run_deploy, "Deploy" }
            button {
                onclick: stop,
                disabled: !running(),
                "Stop"
            }
            button { onclick: teardown, "Teardown" }
            p { style: "color: #666",
                "{deploy_status}"
            }

            if running() {
                p { style: "color: #18794e",
                    "Tunnel running."
                }
            }

            if !log_lines.read().is_empty() {
                h3 { "Tunnel log" }
                pre { style: "background: #f5f5f5; padding: 8px; max-height: 200px; overflow: auto; font-size: 12px; white-space: pre-wrap",
                    "{log_lines.read().join(\"\n\")}"
                }
            }
        }
    }
}
