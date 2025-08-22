from pydantic_settings import BaseSettings
from typing import List, Union
import os


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./fitness_pal.db"

    # Security
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # File Storage
    upload_dir: str = "./uploads"
    max_file_size: int = 10485760  # 10MB

    # CORS
    allowed_origins: Union[str, List[str]] = "http://localhost:8888,http://localhost:5173,http://localhost:3000"

    # AI Services
    GEMINI_API_KEY: str = ""

    # Development
    debug: bool = True

    class Config:
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Convert comma-separated string to list
        if isinstance(self.allowed_origins, str):
            self.allowed_origins = [origin.strip() for origin in self.allowed_origins.split(",")]


settings = Settings()

# Ensure upload directories exist
os.makedirs(os.path.join(settings.upload_dir, "meals"), exist_ok=True)
os.makedirs(os.path.join(settings.upload_dir, "chat"), exist_ok=True)
