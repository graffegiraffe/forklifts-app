from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://forklifts:forklifts_pass@localhost:5432/forklifts_db"

    model_config = {"env_file": ".env"}


settings = Settings()
