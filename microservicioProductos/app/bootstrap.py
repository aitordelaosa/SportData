"""Utilidades para preparar el microservicio al iniciarse."""

from __future__ import annotations

import time
from typing import Optional

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

from .config import get_settings


def wait_for_database(max_attempts: int = 30, delay_seconds: float = 2.0) -> None:
    """Bloquea la ejecucion hasta que la base de datos este lista."""

    settings = get_settings()
    engine = create_engine(settings.database_url, pool_pre_ping=True)

    last_error: Optional[Exception] = None
    for attempt in range(1, max_attempts + 1):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            print("Base de datos disponible (intento #{})".format(attempt))
            return
        except OperationalError as exc:
            last_error = exc
            print(
                f"Intento {attempt}/{max_attempts}: base de datos no disponible aun. "
                f"Reintentando en {delay_seconds:.1f}s..."
            )
            time.sleep(delay_seconds)

    raise RuntimeError("No se pudo establecer conexion con la base de datos") from last_error


if __name__ == "__main__":
    wait_for_database()
