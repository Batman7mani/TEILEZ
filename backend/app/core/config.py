from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://forge_user:forge_pass@localhost:5432/forge_db"

    JWT_SECRET_KEY: str = "change_this_to_a_long_random_secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    RAZORPAY_KEY_ID: str = "rzp_test_T89lEU1UpQlopw"
    RAZORPAY_KEY_SECRET: str = "REPLACE_WITH_YOUR_RAZORPAY_TEST_SECRET"
    RAZORPAY_WEBHOOK_SECRET: str = "REPLACE_WITH_YOUR_WEBHOOK_SECRET"

    GOOGLE_CLIENT_ID: str = ""

    FRONTEND_ORIGIN: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
