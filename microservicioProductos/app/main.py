"""Punto de entrada de FastAPI para el microservicio de productos.

Pasos recomendados:
1. Crear la base de datos en PostgreSQL: CREATE DATABASE sport4data;
2. Ajustar la URL en config.py o via variable de entorno PRODUCTS_DATABASE_URL.
3. Ejecutar `uvicorn app.main:app --reload` para iniciar el servidor local.
"""

from logging import getLogger
from pathlib import Path
from typing import Dict

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .database import Base, engine
from .routers import products

# Garantiza que la tabla exista antes de recibir peticiones.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sport4Data - Microservicio de Productos",
    description="API REST para gestionar productos deportivos",
    version="1.0.0",
)

app.include_router(products.router)

logger = getLogger(__name__)
settings = get_settings()
static_dir = Path(settings.static_dir).resolve()
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
else:
    logger.warning(
        "Directorio estatico %s no encontrado. Las imagenes locales no podran servirse.", static_dir
    )


@app.get("/")
def healthcheck() -> Dict[str, str]:
    """Endpoint sencillo para verificar el estado del servicio."""

    return {"status": "ok", "service": "products"}
