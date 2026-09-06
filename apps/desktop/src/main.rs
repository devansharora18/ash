mod backend;
mod cloudflare;
mod config;
mod deploy;
mod tunnel;

use std::sync::{Arc, Mutex};

use config::{validate_hostname, Config};
use dioxus::prelude::*;

fn main() {
    dioxus::launch(App);
}

#[allow(non_snake_case)]
fn App() -> Element {
    let mut config = use_signal(Config::load);
    let mut status = use_signal(|| "Not tested".to_string());
    let mut testing = use_signal(|| false);
    let mut logged_in = use_signal(cloudflare::is_logged_in);
    let mut tunnel_status = use_signal(|| "Not created".to_string());
    let mut deploy_status = use_signal(|| "Not deployed".to_string());
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

    let create_tunnel = move |_| {
        let name = config.read().tunnel_name.clone();
        tunnel_status.set("Preparing cloudflared…".to_string());
        spawn(async move {
            match tunnel::ensure_binary().await {
                Err(e) => tunnel_status.set(format!("Download failed: {e}")),
                Ok(bin) => match tunnel::ensure(&bin, &name).await {
                    Ok(msg) => tunnel_status.set(msg.trim().to_string()),
                    Err(e) => tunnel_status.set(format!("Create failed: {e}")),
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
                    *tunnel_child.write() = Some(Arc::new(Mutex::new(res.child)));
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

            h2 { "Tunnel" }
            button { onclick: create_tunnel, "Create Tunnel" }
            p { style: "color: #666",
                "{tunnel_status}"
            }

            h2 { "Deploy" }
            button { onclick: run_deploy, "Deploy" }
            p { style: "color: #666",
                "{deploy_status}"
            }
        }
    }
}
