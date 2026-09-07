from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ASH_")

    host: str = "0.0.0.0"
    port: int = 8000
    room_ttl_seconds: int = 3600
    cleanup_interval_seconds: int = 180
    max_room_size: int = 5
    max_message_bytes: int = 65536
    max_peer_id_length: int = 64
    allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "https://hello.devansharora.in",
        "https://ash-hello.vercel.app",
        "https://ash.vercel.app",
    ]
    allowed_origin_regex: str = r"https://.*\.vercel\.app"
    rooms_per_minute: int = 30


settings = Settings()
