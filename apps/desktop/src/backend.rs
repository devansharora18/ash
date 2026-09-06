#[derive(Debug, Clone)]
pub struct BackendStatus {
    pub room_id: Option<String>,
}

pub async fn check(base_url: &str) -> Result<BackendStatus, String> {
    let base = base_url.trim_end_matches('/');
    let base = base.to_string();

    let health = reqwest::get(format!("{base}/health"))
        .await
        .map_err(|e| format!("connect failed: {e}"))?;
    if !health.status().is_success() {
        return Err(format!("health returned {}", health.status()));
    }

    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{base}/rooms"))
        .send()
        .await
        .map_err(|e| format!("create room failed: {e}"))?;
    if !resp.status().is_success() {
        return Err(format!("create room returned {}", resp.status()));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let room_id = json.get("room_id").and_then(|v| v.as_str()).map(String::from);

    Ok(BackendStatus { room_id })
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::TcpListener;

    async fn mock_server() -> String {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        tokio::spawn(async move {
            loop {
                let (mut sock, _) = listener.accept().await.unwrap();
                tokio::spawn(async move {
                    let mut buf = [0u8; 1024];
                    let n = sock.read(&mut buf).await.unwrap();
                    let req = String::from_utf8_lossy(&buf[..n]);
                    let first_line = req.lines().next().unwrap_or("");
                    let response = if first_line.starts_with("GET /health") {
                        "HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n".to_string()
                    } else if first_line.starts_with("POST /rooms") {
                        let body = r#"{"room_id":"abc123"}"#;
                        format!(
                            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n{}",
                            body.len(),
                            body
                        )
                    } else {
                        "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n".to_string()
                    };
                    sock.write_all(response.as_bytes()).await.unwrap();
                });
            }
        });
        format!("http://{addr}")
    }

    #[tokio::test]
    async fn check_returns_room_id() {
        let status = check(&mock_server().await).await.unwrap();
        assert_eq!(status.room_id.as_deref(), Some("abc123"));
    }

    #[tokio::test]
    async fn check_reports_error_on_unreachable() {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        drop(listener);
        let result = check(&format!("http://{addr}")).await;
        assert!(result.is_err());
    }
}
