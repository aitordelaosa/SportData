"""Rutas de FastAPI para operaciones sobre productos."""

import base64
import binascii
import json
import re
from pathlib import Path
from typing import List, Optional
from urllib.parse import quote
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..config import get_settings
from ..database import get_db

router = APIRouter(prefix="/products", tags=["products"])
SEED_DELETIONS_FILENAME = ".seed_deleted_products.json"

MIME_TO_EXTENSION = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/avif": ".avif",
    "image/bmp": ".bmp",
    "image/x-ms-bmp": ".bmp",
    "image/tiff": ".tiff",
    "image/svg+xml": ".svg",
    "image/x-icon": ".ico",
}


def _normalize_seed_key(nombre: Optional[str], marca: Optional[str]) -> str:
    return f"{(nombre or '').strip().lower()}||{(marca or '').strip().lower()}"


def _seed_deletions_path() -> Path:
    settings = get_settings()
    static_dir = Path(settings.static_dir).resolve()
    static_dir.mkdir(parents=True, exist_ok=True)
    return static_dir / SEED_DELETIONS_FILENAME


def _load_seed_deletions() -> set[str]:
    path = _seed_deletions_path()
    if not path.exists():
        return set()

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return set()

    if not isinstance(payload, list):
        return set()
    return {str(item).strip() for item in payload if str(item).strip()}


def _save_seed_deletions(values: set[str]) -> None:
    path = _seed_deletions_path()
    ordered = sorted(values)
    path.write_text(
        json.dumps(ordered, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _register_seed_deletion(nombre: Optional[str], marca: Optional[str]) -> None:
    key = _normalize_seed_key(nombre, marca)
    if key == "||":
        return
    deletions = _load_seed_deletions()
    if key in deletions:
        return
    deletions.add(key)
    try:
        _save_seed_deletions(deletions)
    except OSError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo guardar el estado de eliminaciones del seed: {error}",
        )


def _resolve_local_image_path(image_value: Optional[str]) -> Optional[Path]:
    if not image_value:
        return None

    raw_value = image_value.strip()
    if not raw_value:
        return None

    settings = get_settings()
    static_dir = Path(settings.static_dir).resolve()
    base_url = settings.static_base_url.rstrip("/")

    if raw_value.lower().startswith(("http://", "https://")):
        expected_prefix = f"{base_url}/"
        if not raw_value.startswith(expected_prefix):
            return None
        raw_value = raw_value[len(expected_prefix) :]

    relative_path = raw_value.replace("\\", "/").lstrip("/")
    if not relative_path:
        return None

    candidate = (static_dir / relative_path).resolve()
    try:
        candidate.relative_to(static_dir)
    except ValueError:
        return None
    return candidate


def _delete_local_image(image_value: Optional[str]) -> None:
    image_path = _resolve_local_image_path(image_value)
    if not image_path or not image_path.exists() or not image_path.is_file():
        return

    try:
        image_path.unlink()
    except OSError:
        # No bloqueamos la operacion principal por un problema de limpieza.
        return


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


def _parse_base64_payload(raw_value: str) -> tuple[bytes, Optional[str]]:
    value = (raw_value or "").strip()
    if not value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen enviada esta vacia",
        )

    mime_hint = None
    encoded = value
    if value.startswith("data:"):
        header, separator, encoded_payload = value.partition(",")
        if not separator or ";base64" not in header.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de imagen no valido",
            )
        mime_hint = header[5:].split(";")[0].strip().lower() or None
        encoded = encoded_payload.strip()

    try:
        decoded = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen no tiene un base64 valido",
        )

    if not decoded:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen enviada esta vacia",
        )
    return decoded, mime_hint


def _build_image_filename(
    original_name: Optional[str], mime_type: Optional[str]
) -> str:
    source_name = (original_name or "producto").strip()
    suffix = Path(source_name).suffix.lower()
    if not suffix:
        suffix = MIME_TO_EXTENSION.get((mime_type or "").lower(), ".jpg")
    elif not re.fullmatch(r"\.[a-z0-9]{1,10}", suffix):
        suffix = MIME_TO_EXTENSION.get((mime_type or "").lower(), ".jpg")

    stem = Path(source_name).stem.lower()
    safe_stem = re.sub(r"[^a-z0-9]+", "-", stem).strip("-") or "producto"
    return f"{safe_stem}-{uuid4().hex[:10]}{suffix}"


def _store_product_image(
    encoded_image: Optional[str],
    image_name: Optional[str],
    image_mime: Optional[str],
) -> Optional[str]:
    if not encoded_image:
        return None

    image_bytes, mime_hint = _parse_base64_payload(encoded_image)
    mime_type = (image_mime or mime_hint or "").strip().lower() or None
    filename = _build_image_filename(image_name, mime_type)

    settings = get_settings()
    products_dir = Path(settings.static_dir).resolve() / "products"
    try:
        products_dir.mkdir(parents=True, exist_ok=True)
    except OSError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo preparar el directorio de imagenes: {error}",
        )

    target_path = products_dir / filename
    try:
        target_path.write_bytes(image_bytes)
    except OSError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo guardar la imagen del producto: {error}",
        )

    return f"products/{filename}"


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
    product_in: schemas.ProductCreateRequest,
    db: Session = Depends(get_db),
) -> schemas.Product:
    """Crea un producto (deberia ser accesible solo para administradores)."""

    product_data = product_in.dict(
        exclude={"imagen_base64", "imagen_nombre", "imagen_mime"}
    )
    if product_in.imagen_base64:
        product_data["imagen_url"] = _store_product_image(
            product_in.imagen_base64,
            product_in.imagen_nombre,
            product_in.imagen_mime,
        )

    product_payload = schemas.ProductCreate(**product_data)
    product = crud.create_product(db, product_payload)
    return _serialize_product(product)


@router.put("/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    updates: schemas.ProductUpdateRequest,
    db: Session = Depends(get_db),
) -> schemas.Product:
    """Actualiza todos los campos enviados."""

    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado"
        )
    previous_image = product.imagen_url
    update_data = updates.dict(
        exclude_unset=True, exclude={"imagen_base64", "imagen_nombre", "imagen_mime"}
    )
    if updates.imagen_base64:
        update_data["imagen_url"] = _store_product_image(
            updates.imagen_base64,
            updates.imagen_nombre,
            updates.imagen_mime,
        )

    update_payload = schemas.ProductUpdate(**update_data)
    updated = crud.update_product(db, product, update_payload)
    if updates.imagen_base64 and previous_image != updated.imagen_url:
        _delete_local_image(previous_image)
    return _serialize_product(updated)


@router.delete("/{product_id}", response_model=schemas.Product)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> schemas.Product:
    """Elimina un producto de forma permanente."""

    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado"
        )
    original_image = product.imagen_url
    _register_seed_deletion(product.nombre, product.marca)
    deleted_snapshot = _serialize_product(product)
    crud.delete_product(db, product)
    _delete_local_image(original_image)
    return deleted_snapshot


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
