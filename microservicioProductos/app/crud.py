"""Operaciones de acceso a datos para productos."""

from decimal import Decimal
from typing import List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from . import models, schemas


def list_products(
    db: Session,
    *,
    categoria: Optional[str] = None,
    deporte: Optional[str] = None,
    marca: Optional[str] = None,
    precio_min: Optional[Decimal] = None,
    precio_max: Optional[Decimal] = None,
    disponible: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> List[models.Product]:
    """Devuelve productos aplicando filtros dinamicos."""

    query = select(models.Product)

    if categoria:
        query = query.where(models.Product.categoria == categoria)
    if deporte:
        query = query.where(models.Product.deporte == deporte)
    if marca:
        query = query.where(models.Product.marca == marca)
    if precio_min is not None:
        query = query.where(models.Product.precio >= precio_min)
    if precio_max is not None:
        query = query.where(models.Product.precio <= precio_max)
    if disponible is not None:
        query = query.where(models.Product.disponible == disponible)
    if search:
        pattern = f"%{search.lower()}%"
        query = query.where(
            or_(
                models.Product.nombre.ilike(pattern),
                models.Product.descripcion.ilike(pattern),
            )
        )

    query = query.offset(skip).limit(limit)
    return list(db.execute(query).scalars())


def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    """Busca un producto por identificador."""

    return db.get(models.Product, product_id)


def create_product(db: Session, product_in: schemas.ProductCreate) -> models.Product:
    """Inserta un nuevo producto."""

    product = models.Product(**product_in.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(
    db: Session, product: models.Product, updates: schemas.ProductUpdate
) -> models.Product:
    """Actualiza los campos enviados sin tocar el resto."""

    for field, value in updates.dict(exclude_unset=True).items():
        setattr(product, field, value)

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def soft_delete_product(db: Session, product: models.Product) -> models.Product:
    """Marca el producto como no disponible."""

    product.disponible = False
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_stock(
    db: Session, product: models.Product, stock: int
) -> models.Product:
    """Actualiza exclusivamente el stock."""

    product.stock = stock
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

