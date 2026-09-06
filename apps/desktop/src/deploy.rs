use crate::backend;
use crate::cloudflare;
use crate::config::validate_hostname;
use crate::tunnel;

pub struct DeployResult {
    pub public_url: String,
    pub child: tokio::process::Child,
}

pub async fn deploy(
    backend_url: &str,
    hostname: &str,
    tunnel_name: &str,
) -> Result<DeployResult, String> {
    if !cloudflare::is_logged_in() {
        return Err("not logged in — run `cloudflared tunnel login`".to_string());
    }
    validate_hostname(hostname).map_err(|e| format!("invalid hostname: {e}"))?;

    backend::check(backend_url).await.map_err(|e| format!("backend check failed: {e}"))?;

    let bin = tunnel::ensure_binary().await?;

    tunnel::ensure(&bin, tunnel_name).await.map_err(|e| format!("tunnel: {e}"))?;
    tunnel::route_dns(&bin, tunnel_name, hostname)
        .await
        .map_err(|e| format!("route dns: {e}"))?;
    let child = tunnel::spawn_run(&bin, tunnel_name, backend_url)
        .await
        .map_err(|e| format!("run: {e}"))?;

    Ok(DeployResult {
        public_url: format!("https://{hostname}"),
        child,
    })
}
