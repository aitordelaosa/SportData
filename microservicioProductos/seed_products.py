"""Script para insertar datos de ejemplo en la base de datos."""

from decimal import Decimal

from app.database import SessionLocal, Base, engine
from app.models import Product


def seed():
    """Inserta un lote de productos variados."""

    Base.metadata.create_all(bind=engine)
    session = SessionLocal()

    sample_products = [
        {
            "nombre": "Zapatillas Trail Falcon",
            "categoria": "zapatillas",
            "deporte": "montana",
            "color": "negro",
            "marca": "AeroTrail",
            "precio": Decimal("129.99"),
            "stock": 25,
            "descripcion": "Suela con agarre agresivo para terrenos humedos.",
            "imagen_url": "products/Zapatillas Trail Falcon.jpg",
            "disponible": True,
        },
        {
            "nombre": "Zapatillas Running Vector",
            "categoria": "zapatillas",
            "deporte": "running",
            "color": "gris",
            "marca": "Sport4Data",
            "precio": Decimal("119.90"),
            "stock": 40,
            "descripcion": "Espuma reactiva y upper transpirable para asfalto.",
            "imagen_url": "products/Zapatillas Running Vector.jpg",
            "disponible": True,
        },
        {
            "nombre": "Zapatillas Running AeroLite",
            "categoria": "zapatillas",
            "deporte": "running",
            "color": "azul",
            "marca": "AeroTrail",
            "precio": Decimal("139.00"),
            "stock": 28,
            "descripcion": "Modelo mixto para entrenos rapidos y competicion.",
            "imagen_url": "products/Zapatillas Running AeroLite.jpg",
            "disponible": True,
        },
        {
            "nombre": "Camiseta Respirant Pro",
            "categoria": "ropa",
            "deporte": "running",
            "color": "azul",
            "marca": "Sport4Data",
            "precio": Decimal("29.90"),
            "stock": 80,
            "descripcion": "Tejido ligero y costuras planas.",
            "imagen_url": "products/Camiseta Respirant Pro.jpg",
            "disponible": True,
        },
        {
            "nombre": "Balon Pro Indoor",
            "categoria": "accesorios",
            "deporte": "baloncesto",
            "color": "naranja",
            "marca": "JumpMaster",
            "precio": Decimal("45.50"),
            "stock": 40,
            "descripcion": "Balon de alto agarre para pistas cubiertas.",
            "imagen_url": "products/Balon Pro Indoor.jpg",
            "disponible": True,
        },
        {
            "nombre": "Casco MTB Shield",
            "categoria": "accesorios",
            "deporte": "ciclismo",
            "color": "rojo",
            "marca": "NorthPeak",
            "precio": Decimal("79.95"),
            "stock": 33,
            "descripcion": "Casco con proteccion ampliada y visera desmontable.",
            "imagen_url": "products/Casco MTB Shield.jpg",
            "disponible": True,
        },
        {
            "nombre": "Chaqueta Running Storm",
            "categoria": "ropa",
            "deporte": "running",
            "color": "verde",
            "marca": "StormBeat",
            "precio": Decimal("99.00"),
            "stock": 15,
            "descripcion": "Chaqueta impermeable plegable.",
            "imagen_url": "products/Chaqueta Running Storm.jpg",
            "disponible": False,
        },
        {
            "nombre": "Botas Futbol Elite FG",
            "categoria": "zapatillas",
            "deporte": "futbol",
            "color": "blanco",
            "marca": "GoalZone",
            "precio": Decimal("149.99"),
            "stock": 22,
            "descripcion": "Placa rigida para campos secos.",
            "imagen_url": "products/Botas Futbol Elite FG.jpg",
            "disponible": True,
        },
        {
            "nombre": "Rodillera Reforce",
            "categoria": "accesorios",
            "deporte": "crossfit",
            "color": "negro",
            "marca": "CorePlus",
            "precio": Decimal("34.90"),
            "stock": 60,
            "descripcion": "Soporte firme para entrenamientos de fuerza.",
            "imagen_url": "products/Rodillera Reforce.jpg",
            "disponible": True,
        },
        {
            "nombre": "Cinturon Hidratacion RunFlow",
            "categoria": "accesorios",
            "deporte": "running",
            "color": "negro",
            "marca": "CorePlus",
            "precio": Decimal("32.50"),
            "stock": 65,
            "descripcion": "Incluye bidones suaves y bolsillo impermeable.",
            "imagen_url": "products/Cinturon Hidratacion RunFlow.jpg",
            "disponible": True,
        },
        {
            "nombre": "Gorra Running Ultralight",
            "categoria": "accesorios",
            "deporte": "running",
            "color": "blanco",
            "marca": "Sport4Data",
            "precio": Decimal("19.90"),
            "stock": 85,
            "descripcion": "Tejido microperforado con proteccion UV.",
            "imagen_url": "products/Gorra Running Ultralight.jpg",
            "disponible": True,
        },
        {
            "nombre": "Mallas Termicas BaseLayer",
            "categoria": "ropa",
            "deporte": "montana",
            "color": "gris",
            "marca": "HighAltitude",
            "precio": Decimal("59.90"),
            "stock": 35,
            "descripcion": "Compresion ligera y calor constante.",
            "imagen_url": "products/Mallas Termicas BaseLayer.jpg",
            "disponible": True,
        },
        {
            "nombre": "Guantes Grip Bike",
            "categoria": "accesorios",
            "deporte": "ciclismo",
            "color": "negro",
            "marca": "NorthPeak",
            "precio": Decimal("25.00"),
            "stock": 50,
            "descripcion": "Palma reforzada con gel.",
            "imagen_url": "products/Guantes Grip Bike.jpg",
            "disponible": True,
        },
        {
            "nombre": "Raqueta Tenis AeroSpin",
            "categoria": "accesorios",
            "deporte": "tenis",
            "color": "azul",
            "marca": "AeroTrail",
            "precio": Decimal("179.99"),
            "stock": 12,
            "descripcion": "Marco de carbono con patron 16x19.",
            "imagen_url": "products/Raqueta Tenis AeroSpin.jpg",
            "disponible": True,
        },
        {
            "nombre": "Pantalon Corto DryFlex",
            "categoria": "ropa",
            "deporte": "running",
            "color": "negro",
            "marca": "Sport4Data",
            "precio": Decimal("39.95"),
            "stock": 70,
            "descripcion": "Bolsillos laterales con cremallera y tejido de secado rapido.",
            "imagen_url": "products/Pantalon Corto DryFlex.jpg",
            "disponible": True,
        },
        {
            "nombre": "Mochila Trail 12L",
            "categoria": "accesorios",
            "deporte": "montana",
            "color": "naranja",
            "marca": "HighAltitude",
            "precio": Decimal("89.50"),
            "stock": 18,
            "descripcion": "Incluye bolsa de hidratacion y ajuste pectoral.",
            "imagen_url": "products/Mochila Trail 12L.jpg",
            "disponible": True,
        },
        {
            "nombre": "Gafas Natacion Wave",
            "categoria": "accesorios",
            "deporte": "natacion",
            "color": "transparente",
            "marca": "OceanX",
            "precio": Decimal("27.99"),
            "stock": 55,
            "descripcion": "Lentes antivaho y proteccion UV.",
            "imagen_url": "products/Gafas Natacion Wave.jpg",
            "disponible": False,
        },
        {
            "nombre": "Short Basket AirFlow",
            "categoria": "ropa",
            "deporte": "baloncesto",
            "color": "blanco",
            "marca": "JumpMaster",
            "precio": Decimal("44.90"),
            "stock": 30,
            "descripcion": "Paneles perforados para ventilacion maxima.",
            "imagen_url": "products/Short Basket AirFlow.jpg",
            "disponible": True,
        },
        {
            "nombre": "Cuerda Saltos Speed",
            "categoria": "accesorios",
            "deporte": "crossfit",
            "color": "verde",
            "marca": "CorePlus",
            "precio": Decimal("21.50"),
            "stock": 75,
            "descripcion": "Cable ajustable con rodamientos metalicos.",
            "imagen_url": "products/Cuerda Saltos Speed.jpg",
            "disponible": True,
        },
        {
            "nombre": "Chaqueta Ciclista Reflect",
            "categoria": "ropa",
            "deporte": "ciclismo",
            "color": "amarillo",
            "marca": "NorthPeak",
            "precio": Decimal("120.00"),
            "stock": 14,
            "descripcion": "Paneles reflectantes 360 y proteccion contra viento.",
            "imagen_url": "products/Chaqueta Ciclista Reflect.jpg",
            "disponible": True,
        },
    ]

    try:
        for data in sample_products:
            exists = (
                session.query(Product)
                .filter_by(nombre=data["nombre"], marca=data["marca"])
                .first()
            )
            if exists:
                for field, value in data.items():
                    setattr(exists, field, value)
                continue
            session.add(Product(**data))

        session.commit()
        print("Datos de ejemplo insertados correctamente.")
    except Exception as exc:  # pragma: no cover - script manual
        session.rollback()
        print(f"Error al insertar datos: {exc}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    # Ejecutar: python seed_products.py
    seed()
