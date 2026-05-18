"""Conexion a la base de datos PostgreSQL y sesion de SQLAlchemy."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

from .config import get_settings

settings = get_settings()

engine_options = {
    "echo": False,
    "future": True,
}
if settings.database_url.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
    if settings.database_url in {"sqlite:///:memory:", "sqlite+pysqlite:///:memory:"}:
        engine_options["poolclass"] = StaticPool

engine = create_engine(settings.database_url, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Devuelve una sesion nueva para cada peticion HTTP."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
