"""Configuracion centralizada del microservicio de productos."""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import BaseSettings, Field

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent


def _detect_static_dirs() -> List[Path]:
    """Devuelve rutas candidatas donde buscar archivos estaticos."""

    return [
        PROJECT_ROOT / "static",
        BASE_DIR / "static",
        Path.cwd() / "static",
    ]


class Settings(BaseSettings):
    """Variables que definen el entorno del servicio."""

    database_url: str = Field(
        "postgresql+psycopg://sport4data:sport4data@localhost:5432/sport4data",
        env="PRODUCTS_DATABASE_URL",
        description="Cadena de conexion a PostgreSQL.",
    )
    static_dir: str = Field(
        default=str(
            next((path for path in _detect_static_dirs() if path.exists()), PROJECT_ROOT / "static")
        ),
        env="PRODUCTS_STATIC_DIR",
        description="Ruta absoluta que contiene los recursos estaticos (imagenes, etc.)",
    )
    static_base_url: str = Field(
        "http://localhost:8010/static",
        env="PRODUCTS_STATIC_BASE_URL",
        description="URL publica desde la que se sirven los recursos estaticos.",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Permite reutilizar la misma instancia configurada."""
    return Settings()
