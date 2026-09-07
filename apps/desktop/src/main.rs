mod backend;
mod cloudflare;
mod config;
mod deploy;
mod tunnel;

use std::sync::{Arc, Mutex};
use std::time::Duration;

use config::{validate_hostname, Config};
use dioxus::desktop::tao::window::Theme;
use dioxus::desktop::{Config as DesktopConfig, LogicalSize, WindowBuilder};
use dioxus::prelude::*;
use tokio::io::{AsyncBufRead, AsyncBufReadExt, BufReader};

const CSS: &str = r#"
:root {
  --bg: #0a0a0a;
  --surface: #141414;
  --surface-2: #1a1a1a;
  --surface-3: #212121;
  --border: #262626;
  --border-strong: #353535;
  --text: #ededed;
  --text-muted: #8f8f8f;
  --text-faint: #5c5c5c;
  --accent: #fafafa;
  --accent-text: #0a0a0a;
  --radius: 10px;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
  --font-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  overscroll-behavior: none;
}
::-webkit-scrollbar { display: none; }

.app { min-height: 100vh; }

.header {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  height: 52px; padding: 0 24px;
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.brand { font-family: var(--font-mono); font-weight: 600; font-size: 15px; letter-spacing: -0.02em; }
.status-pill { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-faint); }
.status-dot.on { background: var(--text); box-shadow: 0 0 0 3px rgba(255,255,255,0.12); }

.main { max-width: 720px; margin: 0 auto; padding: 44px 24px 120px; }

.hero { margin-bottom: 36px; }
.hero h1 { font-size: 30px; font-weight: 650; letter-spacing: -0.03em; line-height: 1.1; margin: 0 0 10px; }
.hero p { color: var(--text-muted); font-size: 15px; line-height: 1.55; margin: 0; max-width: 56ch; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 12px;
}
.card-title { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; margin: 0; display: flex; align-items: center; justify-content: space-between; }
.card-desc { font-size: 13px; color: var(--text-muted); margin: 4px 0 16px; }

.field-label { display: block; font-size: 12px; font-weight: 500; color: var(--text-muted); margin-bottom: 6px; }
.field {
  width: 100%; height: 38px; padding: 0 12px; border-radius: 6px;
  background: var(--bg); border: 1px solid var(--border); color: var(--text);
  font-size: 14px; font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field::placeholder { color: var(--text-faint); }
.field:focus { outline: none; border-color: var(--text-muted); box-shadow: 0 0 0 3px rgba(255,255,255,0.06); }
.field-mono { font-family: var(--font-mono); font-size: 13px; }

.actions { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 34px; padding: 0 14px; border-radius: 6px;
  font-size: 13px; font-weight: 500; font-family: inherit;
  cursor: pointer; border: 1px solid transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s, opacity 0.15s;
}
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary { background: var(--accent); color: var(--accent-text); }
.btn-primary:hover:not(:disabled) { background: #d4d4d4; }
.btn-secondary { background: transparent; color: var(--text); border-color: var(--border-strong); }
.btn-secondary:hover:not(:disabled) { border-color: var(--text-faint); background: var(--surface-2); }
.btn-danger { background: transparent; color: var(--text-muted); border-color: var(--border-strong); }
.btn-danger:hover:not(:disabled) { color: var(--text); border-color: var(--text-muted); }

.msg { margin: 14px 0 0; font-size: 13px; color: var(--text-muted); }
.msg-ok { color: var(--text); }
.msg-err { color: var(--text); }
.badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
.badge-ok { color: var(--text); }
.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.terminal {
  background: var(--bg); border: 1px solid var(--border); border-radius: 6px;
  padding: 12px; margin-top: 14px;
  font-family: var(--font-mono); font-size: 12px; line-height: 1.65;
  color: var(--text-muted); max-height: 220px; overflow: auto;
  white-space: pre-wrap; word-break: break-all;
}
.code { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
"#;

fn main() {
    let config = DesktopConfig::new()
        .with_window(
            WindowBuilder::new()
                .with_title("Ash Deploy")
                .with_theme(Some(Theme::Dark))
                .with_min_inner_size(LogicalSize::new(480.0, 640.0)),
        )
        .with_menu(None)
        .with_background_color((10, 10, 10, 255));

    dioxus::LaunchBuilder::desktop()
        .with_cfg(config)
        .launch(App);
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
                    status.set(format!("Reachable — test room `{room}` created."));
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
        style { dangerous_inner_html: CSS }

        div { class: "app",
            header { class: "header",
                span { class: "brand", "ash" }
                div { class: "status-pill",
                    span { class: if running() { "status-dot on" } else { "status-dot" } }
                    if running() { "Tunnel running" } else { "Idle" }
                }
            }

            main { class: "main",
                section { class: "hero",
                    h1 { "Deploy your signaling server" }
                    p { "Point a Cloudflare hostname at your local Ash server in one click. Messages stay end-to-end encrypted — the tunnel only forwards opaque bytes." }
                }

                section { class: "card",
                    h2 { class: "card-title", "Signaling server" }
                    p { class: "card-desc", "Health-check the backend and confirm it can mint rooms." }
                    label { class: "field-label", "Server URL" }
                    input {
                        class: "field field-mono",
                        value: "{config.read().backend_url}",
                        oninput: move |e: FormEvent| config.write().backend_url = e.value(),
                        placeholder: "http://localhost:8000",
                    }
                    div { class: "actions",
                        button {
                            class: "btn btn-primary",
                            onclick: run_check,
                            disabled: testing(),
                            if testing() { "Testing…" } else { "Test connection" }
                        }
                        button { class: "btn btn-secondary", onclick: save, "Save" }
                    }
                    p { class: "msg",
                        "{status}"
                    }
                }

                section { class: "card",
                    h2 { class: "card-title", "Cloudflare" }
                    p { class: "card-desc", "Authenticated with a `cloudflared tunnel login` certificate." }
                    if logged_in() {
                        div { class: "badge badge-ok",
                            span { class: "dot" }
                            "Authenticated"
                        }
                        button { class: "btn btn-secondary", onclick: move |_| logged_in.set(cloudflare::is_logged_in()), style: "margin-top: 14px", "Re-check" }
                    } else {
                        div { class: "badge",
                            span { class: "dot" }
                            "Not authenticated"
                        }
                        pre { class: "terminal",
                            "$ cloudflared tunnel login"
                        }
                        button { class: "btn btn-secondary", onclick: move |_| logged_in.set(cloudflare::is_logged_in()), "Re-check" }
                    }
                }

                section { class: "card",
                    h2 { class: "card-title", "Hostname" }
                    p { class: "card-desc", "The public subdomain that will point at your server." }
                    label { class: "field-label", "Public hostname" }
                    input {
                        class: "field field-mono",
                        value: "{config.read().hostname}",
                        oninput: move |e: FormEvent| config.write().hostname = e.value(),
                        placeholder: "ash.example.com",
                    }
                    {
                        match validate_hostname(&config.read().hostname) {
                            Ok(()) => rsx! { div { class: "badge badge-ok", style: "margin-top: 12px", span { class: "dot" } "Valid hostname" } },
                            Err(e) => rsx! { p { class: "msg", style: "margin-top: 12px", "{e}" } },
                        }
                    }
                }

                section { class: "card",
                    h2 { class: "card-title", "Deploy" }
                    p { class: "card-desc", "Create the tunnel, route the hostname, and bring it up." }
                    div { class: "actions",
                        button { class: "btn btn-primary", onclick: run_deploy, "Deploy" }
                        button { class: "btn btn-secondary", onclick: stop, disabled: !running(), "Stop" }
                        button { class: "btn btn-danger", onclick: teardown, "Teardown" }
                    }
                    p { class: "msg msg-ok",
                        "{deploy_status}"
                    }
                }

                if !log_lines.read().is_empty() {
                    section { class: "card",
                        h2 { class: "card-title", "Tunnel log" }
                        div { class: "terminal",
                            "{log_lines.read().join(\"\n\")}"
                        }
                    }
                }
            }
        }
    }
}
