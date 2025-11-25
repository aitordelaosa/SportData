"""Modelos de base de datos."""

from sqlalchemy import Boolean, Column, Integer, Numeric, String, Text

from .database import Base


class Product(Base):
    """Representa un producto deportivo en la tabla 'producto'."""

    __tablename__ = "producto"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    categoria = Column(String(100), nullable=True)
    deporte = Column(String(100), nullable=True)
    color = Column(String(60), nullable=True)
    marca = Column(String(120), nullable=True)
    precio = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    descripcion = Column(Text, nullable=True)
    imagen_url = Column(Text, nullable=True)
    disponible = Column(Boolean, default=True, nullable=False)

