"""Esquemas Pydantic para validar solicitudes y respuestas."""

from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, condecimal


class ProductBase(BaseModel):
    """Campos comunes reutilizados entre esquemas."""

    nombre: str = Field(..., example="Zapatillas Running Pro")
    categoria: Optional[str] = Field(None, example="zapatillas")
    deporte: Optional[str] = Field(None, example="running")
    color: Optional[str] = Field(None, example="azul")
    marca: Optional[str] = Field(None, example="Sport4Data")
    precio: condecimal(max_digits=10, decimal_places=2) = Field(
        ..., example=Decimal("129.99")
    )
    stock: int = Field(..., ge=0, example=15)
    descripcion: Optional[str] = Field(None, example="Zapatillas ligeras para trail")
    imagen_url: Optional[str] = Field(
        None, example="https://cdn.sport4data.com/img/zapatillas-pro.png"
    )
    disponible: bool = Field(True, description="Indica si el producto se puede vender")


class ProductCreate(ProductBase):
    """Datos requeridos para crear un producto."""

    pass


class ProductUpdate(BaseModel):
    """Todos los campos opcionales para actualizacion parcial."""

    nombre: Optional[str] = None
    categoria: Optional[str] = None
    deporte: Optional[str] = None
    color: Optional[str] = None
    marca: Optional[str] = None
    precio: Optional[condecimal(max_digits=10, decimal_places=2)] = None
    stock: Optional[int] = Field(None, ge=0)
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    disponible: Optional[bool] = None


class Product(ProductBase):
    """Representacion completa enviada al cliente."""

    id: int

    class Config:
        orm_mode = True


class StockUpdate(BaseModel):
    """Cuerpo minimo para actualizar el stock."""

    stock: int = Field(..., ge=0, example=25)
