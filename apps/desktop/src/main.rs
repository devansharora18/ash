mod backend;
mod cloudflare;
mod config;

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
        }
    }
}
