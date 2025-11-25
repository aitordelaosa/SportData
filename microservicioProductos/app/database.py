"""Conexion a la base de datos PostgreSQL y sesion de SQLAlchemy."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import get_settings

settings = get_settings()

engine = create_engine(settings.database_url, echo=False, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Devuelve una sesion nueva para cada peticion HTTP."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

