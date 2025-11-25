"""Rutas de FastAPI para operaciones sobre productos."""

from typing import List, Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..config import get_settings
from ..database import get_db

router = APIRouter(prefix="/products", tags=["products"])


def _resolve_imagen_url(value: Optional[str]) -> Optional[str]:
    """Devuelve URLs absolutas usando la configuracion publica."""

    if not value:
        return value

    normalized = value.strip()
    if normalized.lower().startswith(("http://", "https://")):
        return normalized

    settings = get_settings()
    base_url = settings.static_base_url.rstrip("/")
    path = normalized.replace("\\", "/").lstrip("/")
    encoded_path = quote(path, safe="/:@%+-_.~")
    return f"{base_url}/{encoded_path}"


def _serialize_product(product) -> schemas.Product:
    data = schemas.Product.from_orm(product)
    data.imagen_url = _resolve_imagen_url(data.imagen_url)
    return data


@router.get("", response_model=List[schemas.Product])
def list_products(
    categoria: Optional[str] = Query(None, description="Filtra por categoria exacta"),
    deporte: Optional[str] = Query(None, description="Filtra por deporte exacto"),
    marca: Optional[str] = Query(None, description="Filtra por marca exacta"),
    precio_min: Optional[float] = Query(None, ge=0),
    precio_max: Optional[float] = Query(None, ge=0),
    disponible: Optional[bool] = Query(None),
    search: Optional[str] = Query(
        None, description="Cadena para buscar en nombre o descripcion"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> List[schemas.Product]:
    """Lista productos con paginacion y filtros."""

    products = crud.list_products(
        db,
        categoria=categoria,
        deporte=deporte,
        marca=marca,
        precio_min=precio_min,
        precio_max=precio_max,
        disponible=disponible,
        search=search,
        skip=skip,
        limit=limit,
    )
    return [_serialize_product(product) for product in products]


@router.get("/{product_id}", response_model=schemas.Product)
def retrieve_product(product_id: int, db: Session = Depends(get_db)) -> schemas.Product:
    """Devuelve un producto concreto."""

    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado"
        )
    return _serialize_product(product)


@router.post(
    "",
    response_model=schemas.Product,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
) -> schemas.Product:
    """Crea un producto (deberia ser accesible solo para administradores)."""

    product = crud.create_product(db, product_in)
    return _serialize_product(product)


@router.put("/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    updates: schemas.ProductUpdate,
    db: Session = Depends(get_db),
) -> schemas.Product:
    """Actualiza todos los campos enviados."""

    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado"
        )
    updated = crud.update_product(db, product, updates)
    return _serialize_product(updated)


@router.delete("/{product_id}", response_model=schemas.Product)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> schemas.Product:
    """Marca el producto como no disponible en lugar de borrarlo fisicamente."""

    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado"
        )
    deleted = crud.soft_delete_product(db, product)
    return _serialize_product(deleted)


@router.patch("/{product_id}/stock", response_model=schemas.Product)
def update_stock(
    product_id: int,
    payload: schemas.StockUpdate,
    db: Session = Depends(get_db),
) -> schemas.Product:
    """Actualiza solo el stock de un producto."""

    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado"
        )
    updated = crud.update_stock(db, product, payload.stock)
    return _serialize_product(updated)
