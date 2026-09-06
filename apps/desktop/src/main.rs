mod config;

use config::Config;
use dioxus::prelude::*;

fn main() {
    dioxus::launch(App);
}

#[allow(non_snake_case)]
fn App() -> Element {
    let config = use_signal(Config::load);

    rsx! {
        main { style: "padding: 24px; font-family: system-ui",
            h1 { "Ash Deploy" }
            p { "One-click signaling server hosting." }
            p { "Backend: {config.read().backend_url}" }
        }
    }
}
