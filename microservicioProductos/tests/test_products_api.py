import os
from pathlib import Path

TEST_ROOT = Path(__file__).resolve().parents[1] / ".tmp" / "pytest-products"
TEST_ROOT.mkdir(parents=True, exist_ok=True)
os.environ["PRODUCTS_DATABASE_URL"] = "sqlite:///:memory:"
os.environ["PRODUCTS_STATIC_DIR"] = str(TEST_ROOT / "static")
os.environ["PRODUCTS_STATIC_BASE_URL"] = "http://testserver/static"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def product_payload(**overrides):
    payload = {
        "nombre": "Balon Training",
        "categoria": "balones",
        "deporte": "futbol",
        "color": "blanco",
        "marca": "SportData",
        "precio": "29.99",
        "stock": 12,
        "descripcion": "Balon para entrenamientos intensivos",
        "imagen_url": "products/balon.jpg",
        "disponible": True,
    }
    payload.update(overrides)
    return payload


def create_product(**overrides):
    response = client.post("/products", json=product_payload(**overrides))
    assert response.status_code == 201
    return response.json()


def test_healthcheck_root():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "products"}


def test_list_products_with_filters():
    create_product(nombre="Balon Training", categoria="balones", deporte="futbol")
    create_product(nombre="Raqueta Pro", categoria="raquetas", deporte="tenis")

    response = client.get("/products", params={"categoria": "balones", "search": "balon"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["nombre"] == "Balon Training"
    assert data[0]["imagen_url"] == "http://testserver/static/products/balon.jpg"


def test_retrieve_existing_product():
    product = create_product()

    response = client.get(f"/products/{product['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == product["id"]


def test_retrieve_missing_product_returns_404():
    response = client.get("/products/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Producto no encontrado"


def test_create_product():
    response = client.post("/products", json=product_payload(nombre="Zapatillas Trail"))

    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["nombre"] == "Zapatillas Trail"
    assert data["disponible"] is True


def test_update_product():
    product = create_product()

    response = client.put(
        f"/products/{product['id']}",
        json={"precio": "34.50", "stock": 6, "descripcion": "Actualizado"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["stock"] == 6
    assert data["descripcion"] == "Actualizado"
    assert float(data["precio"]) == 34.5


def test_update_stock():
    product = create_product(stock=3)

    response = client.patch(f"/products/{product['id']}/stock", json={"stock": 20})

    assert response.status_code == 200
    assert response.json()["stock"] == 20


def test_delete_product():
    product = create_product()

    delete_response = client.delete(f"/products/{product['id']}")
    assert delete_response.status_code == 200
    assert delete_response.json()["id"] == product["id"]

    get_response = client.get(f"/products/{product['id']}")
    assert get_response.status_code == 404
