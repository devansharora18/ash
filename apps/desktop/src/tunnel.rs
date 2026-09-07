use std::ffi::OsStr;
use std::path::{Path, PathBuf};

use serde::Deserialize;

pub fn release_name(os: &str, arch: &str) -> &'static str {
    match (os, arch) {
        ("linux", "x86_64") => "cloudflared-linux-amd64",
        ("linux", "aarch64") => "cloudflared-linux-arm64",
        ("macos", "x86_64") => "cloudflared-darwin-amd64",
        ("macos", "aarch64") => "cloudflared-darwin-arm64",
        ("windows", "x86_64") => "cloudflared-windows-amd64.exe",
        ("windows", "aarch64") => "cloudflared-windows-arm64.exe",
        _ => "cloudflared-linux-amd64",
    }
}

fn release_url() -> String {
    format!(
        "https://github.com/cloudflare/cloudflared/releases/latest/download/{}",
        release_name(std::env::consts::OS, std::env::consts::ARCH)
    )
}

fn binary_file_name() -> &'static str {
    if cfg!(windows) {
        "cloudflared.exe"
    } else {
        "cloudflared"
    }
}

fn search_path_in(path_var: &OsStr, bin: &str) -> Option<PathBuf> {
    for dir in std::env::split_paths(path_var) {
        let candidate = dir.join(bin);
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

fn search_path(bin: &str) -> Option<PathBuf> {
    search_path_in(&std::env::var_os("PATH")?, bin)
}

fn locate() -> Option<PathBuf> {
    if let Some(bin) = search_path(binary_file_name()) {
        return Some(bin);
    }
    let home_bin = dirs::home_dir()?.join(".local").join("bin").join(binary_file_name());
    if home_bin.is_file() {
        return Some(home_bin);
    }
    None
}

fn download_dir() -> PathBuf {
    let base = dirs::data_local_dir()
        .or_else(dirs::home_dir)
        .unwrap_or_else(|| PathBuf::from("."));
    base.join("ash-desktop").join("bin").join(binary_file_name())
}

async fn download(dest: &Path) -> Result<(), String> {
    let resp = reqwest::get(release_url()).await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("download failed: {}", resp.status()));
    }
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(dest, &bytes).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(dest, std::fs::Permissions::from_mode(0o755))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub async fn ensure_binary() -> Result<PathBuf, String> {
    if let Some(bin) = locate() {
        return Ok(bin);
    }
    let dest = download_dir();
    download(&dest).await?;
    Ok(dest)
}

async fn run_cloudflared(bin: &Path, args: &[&str]) -> Result<String, String> {
    const ATTEMPTS: u32 = 3;
    let mut last_err = String::new();
    for attempt in 1..=ATTEMPTS {
        let output = tokio::process::Command::new(bin)
            .args(args)
            .output()
            .await
            .map_err(|e| format!("failed to run cloudflared: {e}"))?;
        if output.status.success() {
            return Ok(String::from_utf8_lossy(&output.stdout).trim().to_string());
        }
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        last_err = stderr.clone();
        let transient = [
            "connection reset",
            "connection refused",
            "tcp",
            "timeout",
            "i/o timeout",
            "eof",
        ]
        .iter()
        .any(|s| stderr.to_ascii_lowercase().contains(s));
        if !transient || attempt == ATTEMPTS {
            break;
        }
        tokio::time::sleep(std::time::Duration::from_millis(800 * attempt as u64)).await;
    }
    Err(last_err)
}

pub async fn create(bin: &Path, name: &str) -> Result<String, String> {
    run_cloudflared(bin, &["tunnel", "create", name])
        .await
        .map_err(|e| format!("tunnel create failed: {e}"))
}

#[derive(Debug, Deserialize)]
pub struct Tunnel {
    pub name: String,
}

pub async fn list(bin: &Path) -> Result<Vec<Tunnel>, String> {
    let out = run_cloudflared(bin, &["tunnel", "list", "--output", "json"])
        .await
        .map_err(|e| format!("tunnel list failed: {e}"))?;
    // cloudflared prints JSON `null` (not `[]`) when there are no tunnels.
    match serde_json::from_str::<Option<Vec<Tunnel>>>(&out)
        .map_err(|e| format!("parse tunnel list: {e}"))?
    {
        Some(tunnels) => Ok(tunnels),
        None => Ok(Vec::new()),
    }
}

pub async fn ensure(bin: &Path, name: &str) -> Result<String, String> {
    let tunnels = list(bin).await?;
    if tunnels.iter().any(|t| t.name == name) {
        return Ok(format!("tunnel `{name}` already exists"));
    }
    create(bin, name).await
}

pub async fn route_dns(bin: &Path, name: &str, hostname: &str) -> Result<String, String> {
    match run_cloudflared(bin, &["tunnel", "route", "dns", name, hostname]).await {
        Ok(out) => Ok(out),
        Err(e) => {
            if e.to_ascii_lowercase()
                .contains("record with that host already exists")
            {
                // A record exists but may point somewhere stale. Overwrite it
                // with the CNAME for this tunnel so the hostname actually routes.
                run_cloudflared(
                    bin,
                    &["tunnel", "route", "dns", "--overwrite-dns", name, hostname],
                )
                .await
                .map_err(|e| format!("route dns failed: {e}"))
            } else {
                Err(format!("route dns failed: {e}"))
            }
        }
    }
}

pub async fn delete(bin: &Path, name: &str) -> Result<String, String> {
    run_cloudflared(bin, &["tunnel", "delete", "-f", name])
        .await
        .map_err(|e| format!("tunnel delete failed: {e}"))
}

pub async fn spawn_run(
    bin: &Path,
    name: &str,
    url: &str,
) -> Result<tokio::process::Child, String> {
    tokio::process::Command::new(bin)
        .args(["tunnel", "run", "--url", url, name])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("failed to start tunnel: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::OsString;

    #[test]
    fn release_names_map_correctly() {
        assert_eq!(release_name("linux", "x86_64"), "cloudflared-linux-amd64");
        assert_eq!(release_name("linux", "aarch64"), "cloudflared-linux-arm64");
        assert_eq!(release_name("macos", "x86_64"), "cloudflared-darwin-amd64");
        assert_eq!(release_name("macos", "aarch64"), "cloudflared-darwin-arm64");
        assert_eq!(release_name("windows", "x86_64"), "cloudflared-windows-amd64.exe");
    }

    #[test]
    fn search_path_in_finds_binary() {
        let dir = std::env::temp_dir().join("ash-bin-test");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("cloudflared"), b"x").unwrap();

        let path_var = OsString::from(dir.to_str().unwrap());
        assert_eq!(search_path_in(&path_var, "cloudflared"), Some(dir.join("cloudflared")));
        assert_eq!(search_path_in(&path_var, "missing"), None);

        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn parses_tunnel_list_json() {
        let json = r#"[{"id":"35dcac26-43cb-4ee7-8d1e-c1ad208411ce","name":"ash","created_at":"2026-09-06T19:35:19Z","deleted_at":"0001-01-01T00:00:00Z","connections":[]}]"#;
        let tunnels: Vec<Tunnel> = serde_json::from_str(json).unwrap();
        assert_eq!(tunnels.len(), 1);
        assert_eq!(tunnels[0].name, "ash");
    }

    #[test]
    fn parses_null_tunnel_list_as_empty() {
        let tunnels: Option<Vec<Tunnel>> = serde_json::from_str("null").unwrap();
        assert!(tunnels.is_none());
    }
}
