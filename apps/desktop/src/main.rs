use dioxus::prelude::*;

fn main() {
    dioxus::launch(App);
}

#[allow(non_snake_case)]
fn App() -> Element {
    rsx! {
        main { style: "padding: 24px; font-family: system-ui",
            h1 { "Ash Deploy" }
            p { "One-click signaling server hosting." }
        }
    }
}
