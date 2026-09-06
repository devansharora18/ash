use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Config {
    pub backend_url: String,
    pub hostname: String,
    pub tunnel_name: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            backend_url: "http://localhost:8000".to_string(),
            hostname: String::new(),
            tunnel_name: "ash".to_string(),
        }
    }
}

impl Config {
    fn path() -> PathBuf {
        dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("ash-desktop")
            .join("config.json")
    }

    pub fn load() -> Self {
        fs::read_to_string(Self::path())
            .ok()
            .and_then(|text| serde_json::from_str(&text).ok())
            .unwrap_or_default()
    }

    pub fn save(&self) -> std::io::Result<()> {
        let path = Self::path();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&path, serde_json::to_string_pretty(self)?)
    }
}

pub fn validate_hostname(hostname: &str) -> Result<(), &'static str> {
    let h = hostname.trim().trim_end_matches('.');
    if h.is_empty() {
        return Err("hostname is empty");
    }
    if h.len() > 253 {
        return Err("hostname too long");
    }
    if h.contains("://") || h.contains('/') {
        return Err("enter a bare hostname, no scheme or path");
    }
    let labels: Vec<&str> = h.split('.').collect();
    if labels.len() < 2 {
        return Err("needs a dot (e.g. ash.example.com)");
    }
    for label in &labels {
        if label.is_empty() || label.len() > 63 {
            return Err("invalid label length");
        }
        if label.starts_with('-') || label.ends_with('-') {
            return Err("label cannot start or end with '-'");
        }
        if !label.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
            return Err("labels may only contain letters, digits, and hyphens");
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_round_trips_through_json() {
        let config = Config::default();
        let json = serde_json::to_string(&config).unwrap();
        let decoded: Config = serde_json::from_str(&json).unwrap();
        assert_eq!(config, decoded);
    }

    #[test]
    fn validate_hostname_accepts_subdomain() {
        assert!(validate_hostname("ash.example.com").is_ok());
        assert!(validate_hostname("  ash.example.com  ").is_ok());
    }

    #[test]
    fn validate_hostname_rejects_bad_input() {
        assert!(validate_hostname("").is_err());
        assert!(validate_hostname("nodot").is_err());
        assert!(validate_hostname("https://ash.example.com").is_err());
        assert!(validate_hostname("ash.example.com/path").is_err());
        assert!(validate_hostname("ash..com").is_err());
        assert!(validate_hostname("-ash.example.com").is_err());
    }
}
