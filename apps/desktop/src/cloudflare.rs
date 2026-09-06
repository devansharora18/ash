use std::path::{Path, PathBuf};

pub fn default_home() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("."))
}

pub fn cert_path(home: &Path) -> PathBuf {
    home.join(".cloudflared").join("cert.pem")
}

pub fn is_logged_in_at(home: &Path) -> bool {
    cert_path(home).is_file()
}

pub fn is_logged_in() -> bool {
    is_logged_in_at(&default_home())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cert_path_joins_dot_cloudflared() {
        let home = Path::new("/tmp/ash-test-home");
        assert_eq!(
            cert_path(home),
            PathBuf::from("/tmp/ash-test-home/.cloudflared/cert.pem")
        );
    }

    #[test]
    fn is_logged_in_at_detects_cert() {
        let dir = std::env::temp_dir().join("ash-cert-test");
        std::fs::create_dir_all(dir.join(".cloudflared")).unwrap();
        std::fs::write(cert_path(&dir), b"pem").unwrap();
        assert!(is_logged_in_at(&dir));
        std::fs::remove_dir_all(&dir).unwrap();
    }
}
