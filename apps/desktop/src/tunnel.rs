use std::ffi::OsStr;
use std::path::{Path, PathBuf};

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

pub async fn create(bin: &Path, name: &str) -> Result<String, String> {
    let output = tokio::process::Command::new(bin)
        .args(["tunnel", "create", name])
        .output()
        .await
        .map_err(|e| format!("failed to run cloudflared: {e}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("tunnel create failed: {}", stderr.trim()));
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
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
}
