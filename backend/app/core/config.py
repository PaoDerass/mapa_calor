from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field, Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

    # Postgres - Usamos Field(default=...) para calmar a Pylance
    POSTGRES_USER: str = Field(default=...)
    POSTGRES_PASSWORD: str = Field(default=...)
    POSTGRES_SERVER: str = Field(default=...)
    POSTGRES_PORT: int = Field(default=...)
    POSTGRES_DB: str = Field(default=...)

    @computed_field
    @property
    def SYNC_DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # MySQL
    MYSQL_USER: str = Field(default=...)
    MYSQL_PASSWORD: str = Field(default=...)
    MYSQL_SERVER: str = Field(default=...)
    MYSQL_PORT: int = Field(default=...)
    MYSQL_DB: str = Field(default=...)

    @computed_field
    @property
    def MYSQL_DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_SERVER}:{self.MYSQL_PORT}/{self.MYSQL_DB}"

# Ahora Pylance no mostrará errores aquí
settings = Settings()