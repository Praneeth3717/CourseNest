from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GROQ_API_KEY: str
    DATABASE_URL: str
    SECRET_KEY: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    STUDENT_DAILY_TOKEN_QUOTA: int = 100_000

    ENV: str = (
        "development"  # if ENV field is not provided in .env the default value will be development
    )
    ALGORITHM: str = "HS256"

    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    # Mail Settings
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_FROM_NAME: str

    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False

    FRONTEND_URL: str
    BACKEND_URL: str

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=True
    )  # This tells Pydantic to load values from a file named .env


settings = Settings()  # creates an object and loads everything immediately
