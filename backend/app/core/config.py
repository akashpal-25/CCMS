from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "CCMS"
    APP_ENV: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 90

    CORS_ORIGINS: str = "http://localhost:5173"

    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str
    SMTP_USE_TLS: bool = True
    # WhatsApp (OPTIONAL) - khali chhodoge to complaint normal chalegi, bas parent ko message nahi jayega
    WHATSAPP_PROVIDER: str = ""      # baad mein provider ka naam yahan aayega (jaise "twilio" / "meta")
    WHATSAPP_API_KEY: str = ""
    WHATSAPP_SENDER: str = ""
    WHATSAPP_ACCOUNT_SID = ""
    WHATSAPP_API_KEY_SID = ""

    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 5

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()