#!/bin/sh
set -e

APP_PORT="${PORT:-8002}"

echo "[entrypoint] Esperando a la base de datos..."
python -c "from app.bootstrap import wait_for_database; wait_for_database()"

echo "[entrypoint] Ejecutando seed de productos..."
python seed_products.py

echo "[entrypoint] Iniciando FastAPI en el puerto ${APP_PORT}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${APP_PORT}"
