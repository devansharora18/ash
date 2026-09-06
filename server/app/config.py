from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ASH_")

    host: str = "0.0.0.0"
    port: int = 8000
    room_ttl_seconds: int = 3600
    max_room_size: int = 16
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:4173"]


settings = Settings()
