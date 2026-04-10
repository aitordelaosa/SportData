"""Script para insertar datos de ejemplo en la base de datos."""

import json
from decimal import Decimal
from pathlib import Path

from app.database import SessionLocal, Base, engine
from app.models import Product
from app.config import get_settings


SEED_DELETIONS_FILENAME = ".seed_deleted_products.json"


def _normalize_seed_key(nombre: str, marca: str) -> str:
    return f"{(nombre or '').strip().lower()}||{(marca or '').strip().lower()}"


def _load_seed_deletions() -> set[str]:
    settings = get_settings()
    state_path = Path(settings.static_dir).resolve() / SEED_DELETIONS_FILENAME
    if not state_path.exists():
        return set()

    try:
        payload = json.loads(state_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return set()

    if not isinstance(payload, list):
        return set()
    return {str(item).strip() for item in payload if str(item).strip()}


def seed():
    """Sincroniza la tabla de productos con el lote definido en este archivo."""

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
        {
            "nombre": "Zapatillas Running Nimbus X",
            "categoria": "zapatillas",
            "deporte": "running",
            "color": "blanco",
            "marca": "VelocityLab",
            "precio": Decimal("134.90"),
            "stock": 32,
            "descripcion": "Amortiguacion blanda y estable para tiradas largas en asfalto.",
            "imagen_url": "products/Zapatillas Running Vector.jpg",
            "disponible": True,
        },
        {
            "nombre": "Camiseta Running BreezeFit",
            "categoria": "ropa",
            "deporte": "running",
            "color": "turquesa",
            "marca": "VelocityLab",
            "precio": Decimal("31.90"),
            "stock": 58,
            "descripcion": "Tejido ligero de secado rapido con panel de ventilacion trasero.",
            "imagen_url": "products/Camiseta Respirant Pro.jpg",
            "disponible": True,
        },
        
        {
            "nombre": "Raqueta Tenis Control Pro 305",
            "categoria": "accesorios",
            "deporte": "tenis",
            "color": "negro",
            "marca": "MatchPoint",
            "precio": Decimal("189.00"),
            "stock": 16,
            "descripcion": "Marco de grafito orientado a control y efectos en golpeo liftado.",
            "imagen_url": "products/Raqueta Tenis AeroSpin.jpg",
            "disponible": True,
        },
        
        {
            "nombre": "Balon Basket Street Grip",
            "categoria": "accesorios",
            "deporte": "baloncesto",
            "color": "marron",
            "marca": "JumpMaster",
            "precio": Decimal("39.90"),
            "stock": 47,
            "descripcion": "Superficie rugosa para mejor control en pista exterior.",
            "imagen_url": "https://images.unsplash.com/photo-1627627256672-027a4613d028?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Botas Futbol Control AG",
            "categoria": "zapatillas",
            "deporte": "futbol",
            "color": "azul",
            "marca": "GoalZone",
            "precio": Decimal("139.50"),
            "stock": 26,
            "descripcion": "Tacos AG para cesped artificial con gran traccion lateral.",
            "imagen_url": "https://images.unsplash.com/photo-1597274747316-808c6786c165?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Camiseta Training AeroDry",
            "categoria": "ropa",
            "deporte": "fitness",
            "color": "negro",
            "marca": "Sport4Data",
            "precio": Decimal("27.50"),
            "stock": 76,
            "descripcion": "Ajuste regular y tejido transpirable para sesiones intensas.",
            "imagen_url": "https://images.unsplash.com/photo-1718731236356-3b984904ac7d?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Casco Urbano Commuter X",
            "categoria": "accesorios",
            "deporte": "ciclismo",
            "color": "gris",
            "marca": "NorthPeak",
            "precio": Decimal("69.90"),
            "stock": 39,
            "descripcion": "Diseno compacto con ventilacion frontal para recorridos urbanos.",
            "imagen_url": "https://images.unsplash.com/photo-1681295692423-cf2e112aa48c?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Gafas Piscina ClearView",
            "categoria": "accesorios",
            "deporte": "natacion",
            "color": "azul",
            "marca": "OceanX",
            "precio": Decimal("26.90"),
            "stock": 49,
            "descripcion": "Sellado comodo con lentes antivaho para entrenamientos largos.",
            "imagen_url": "https://images.unsplash.com/photo-1533060629428-48484ce98a74?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Guantes Ciclismo AeroGel",
            "categoria": "accesorios",
            "deporte": "ciclismo",
            "color": "gris",
            "marca": "NorthPeak",
            "precio": Decimal("28.90"),
            "stock": 44,
            "descripcion": "Acolchado de gel en palma para reducir vibraciones.",
            "imagen_url": "https://images.unsplash.com/photo-1605271925036-a4ed1ea88ddd?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Mochila Senderismo Ridge 20L",
            "categoria": "accesorios",
            "deporte": "montana",
            "color": "verde",
            "marca": "HighAltitude",
            "precio": Decimal("98.00"),
            "stock": 22,
            "descripcion": "Compartimentos multiples y respaldo transpirable.",
            "imagen_url": "https://images.unsplash.com/photo-1622260614927-208cfe3f5cfd?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Raqueta Tenis SpinDrive 300",
            "categoria": "accesorios",
            "deporte": "tenis",
            "color": "rojo",
            "marca": "MatchPoint",
            "precio": Decimal("171.50"),
            "stock": 14,
            "descripcion": "Patron abierto para generar efecto con facilidad.",
            "imagen_url": "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Zapatillas Running Marathon Pro",
            "categoria": "zapatillas",
            "deporte": "running",
            "color": "naranja",
            "marca": "Sport4Data",
            "precio": Decimal("149.00"),
            "stock": 27,
            "descripcion": "Amortiguacion de larga distancia con excelente retorno.",
            "imagen_url": "https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        
        {
            "nombre": "Botas Futbol RedStrike AG",
            "categoria": "zapatillas",
            "deporte": "futbol",
            "color": "rojo",
            "marca": "GoalZone",
            "precio": Decimal("145.00"),
            "stock": 24,
            "descripcion": "Tacos AG de perfil bajo para cambios rapidos en cesped artificial.",
            "imagen_url": "https://images.unsplash.com/photo-1661098856647-70bd27bb5c50?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Casco Ruta BlueStream",
            "categoria": "accesorios",
            "deporte": "ciclismo",
            "color": "azul",
            "marca": "NorthPeak",
            "precio": Decimal("74.90"),
            "stock": 31,
            "descripcion": "Carcasa ventilada y ajuste occipital para rodadas largas en carretera.",
            "imagen_url": "https://images.unsplash.com/photo-1562620691-46579c7b5294?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Mochila Trek Granite 22L",
            "categoria": "accesorios",
            "deporte": "montana",
            "color": "gris",
            "marca": "SummitFlow",
            "precio": Decimal("102.50"),
            "stock": 20,
            "descripcion": "Espalda ergonomica con compartimento para hidratacion y carga estable.",
            "imagen_url": "https://images.unsplash.com/photo-1591138945944-8e043a5020c2?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Guantes Fitness BlackHold",
            "categoria": "accesorios",
            "deporte": "fitness",
            "color": "negro",
            "marca": "CorePlus",
            "precio": Decimal("22.90"),
            "stock": 63,
            "descripcion": "Palma antideslizante para halterofilia y sesiones intensas de gimnasio.",
            "imagen_url": "https://images.unsplash.com/photo-1672589008772-4f22acf38f6f?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        
        {
            "nombre": "Raqueta Tenis WhiteControl 100",
            "categoria": "accesorios",
            "deporte": "tenis",
            "color": "blanco",
            "marca": "MatchPoint",
            "precio": Decimal("194.00"),
            "stock": 11,
            "descripcion": "Marco equilibrado para control preciso y estabilidad en golpes planos.",
            "imagen_url": "https://images.unsplash.com/photo-1591100464007-37ec1ccc6224?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Chaqueta Trail SandShell",
            "categoria": "ropa",
            "deporte": "montana",
            "color": "beige",
            "marca": "HighAltitude",
            "precio": Decimal("118.90"),
            "stock": 16,
            "descripcion": "Softshell cortaviento con capucha ajustable para clima variable.",
            "imagen_url": "https://images.unsplash.com/photo-1604944561786-644466086053?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Short Basket OrangeDrive",
            "categoria": "ropa",
            "deporte": "baloncesto",
            "color": "naranja",
            "marca": "JumpMaster",
            "precio": Decimal("43.50"),
            "stock": 35,
            "descripcion": "Corte amplio y tejido ligero para salto y cambio de ritmo explosivo.",
            "imagen_url": "https://images.unsplash.com/photo-1548214658-f91e98ceb39a?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Zapatillas Running NightEdge",
            "categoria": "zapatillas",
            "deporte": "running",
            "color": "negro",
            "marca": "VelocityLab",
            "precio": Decimal("142.00"),
            "stock": 29,
            "descripcion": "Amortiguacion reactiva y upper oscuro para entrenos nocturnos urbanos.",
            "imagen_url": "https://images.unsplash.com/photo-1582898967731-b5834427fd66?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Bicicleta MTB RedPeak 29",
            "categoria": "bicicletas",
            "deporte": "ciclismo",
            "color": "rojo",
            "marca": "NorthPeak",
            "precio": Decimal("799.00"),
            "stock": 8,
            "descripcion": "Bicicleta de montana con ruedas de 29 pulgadas y cuadro robusto para trail.",
            "imagen_url": "https://images.unsplash.com/photo-1549493914-9214d5df4a74?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Bicicleta Ruta BlueAero 700",
            "categoria": "bicicletas",
            "deporte": "ciclismo",
            "color": "azul",
            "marca": "AeroTrail",
            "precio": Decimal("1249.00"),
            "stock": 6,
            "descripcion": "Bicicleta de carretera ligera orientada a velocidad y eficiencia en asfalto.",
            "imagen_url": "https://images.unsplash.com/photo-1628506227866-0de3fb9df053?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Zapatillas Monte BlackRidge GTX",
            "categoria": "zapatillas",
            "deporte": "montana",
            "color": "negro",
            "marca": "HighAltitude",
            "precio": Decimal("159.90"),
            "stock": 20,
            "descripcion": "Suela de alto agarre y proteccion impermeable para rutas tecnicas de montana.",
            "imagen_url": "https://images.unsplash.com/photo-1582898967731-b5834427fd66?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Zapatillas Monte Granite Hike",
            "categoria": "zapatillas",
            "deporte": "montana",
            "color": "gris",
            "marca": "HighAltitude",
            "precio": Decimal("149.50"),
            "stock": 23,
            "descripcion": "Calzado de senderismo estable con refuerzo frontal para terrenos pedregosos.",
            "imagen_url": "https://images.unsplash.com/photo-1626361980336-e3eb181ef08d?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
       
        
        {
            "nombre": "Medias Futbol Match Socks",
            "categoria": "ropa",
            "deporte": "futbol",
            "color": "blanco",
            "marca": "GoalZone",
            "precio": Decimal("14.90"),
            "stock": 70,
            "descripcion": "Medias largas de futbol con compresion suave para sujecion durante el juego.",
            "imagen_url": "https://images.unsplash.com/photo-1603567119308-649b6e66e478?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Camiseta Baloncesto Court Jersey",
            "categoria": "ropa",
            "deporte": "baloncesto",
            "color": "negro",
            "marca": "JumpMaster",
            "precio": Decimal("49.90"),
            "stock": 33,
            "descripcion": "Camiseta de baloncesto sin mangas con tejido transpirable para pista.",
            "imagen_url": "https://images.unsplash.com/photo-1580089595767-98745d7025c5?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Zapatillas Baloncesto RedDunk",
            "categoria": "zapatillas",
            "deporte": "baloncesto",
            "color": "rojo",
            "marca": "JumpMaster",
            "precio": Decimal("139.90"),
            "stock": 19,
            "descripcion": "Zapatillas de baloncesto con buena amortiguacion y soporte lateral en cambios bruscos.",
            "imagen_url": "https://images.unsplash.com/photo-1543678854-db854c02a894?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Bicicleta MTB ForestRide 27.5",
            "categoria": "bicicletas",
            "deporte": "ciclismo",
            "color": "verde",
            "marca": "NorthPeak",
            "precio": Decimal("879.00"),
            "stock": 9,
            "descripcion": "Cuadro resistente y suspension delantera para rutas de montana.",
            "imagen_url": "https://images.unsplash.com/photo-1550097644-ff3a51007805?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Zapatillas Trail StoneGrip",
            "categoria": "zapatillas",
            "deporte": "montana",
            "color": "gris",
            "marca": "HighAltitude",
            "precio": Decimal("154.90"),
            "stock": 18,
            "descripcion": "Agarre reforzado para terrenos rocosos y senderos tecnicos.",
            "imagen_url": "https://images.unsplash.com/photo-1521164375564-eee1fa32ea75?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Zapatillas Trail ShadowRun",
            "categoria": "zapatillas",
            "deporte": "montana",
            "color": "negro",
            "marca": "AeroTrail",
            "precio": Decimal("147.50"),
            "stock": 21,
            "descripcion": "Upper resistente y suela taqueada para bajadas exigentes.",
            "imagen_url": "https://images.unsplash.com/photo-1602775529683-5d75c99b00c2?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Balon Baloncesto MatchPro V5",
            "categoria": "accesorios",
            "deporte": "baloncesto",
            "color": "blanco",
            "marca": "GoalZone",
            "precio": Decimal("39.90"),
            "stock": 44,
            "descripcion": "Balon de competicion con panelado termofusionado y buen toque.",
            "imagen_url": "https://images.unsplash.com/photo-1518407613690-d9fc990e795f?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Medias Futbol Elite Blue",
            "categoria": "ropa",
            "deporte": "futbol",
            "color": "azul",
            "marca": "GoalZone",
            "precio": Decimal("16.50"),
            "stock": 62,
            "descripcion": "Media tecnica con compresion ligera y ajuste antideslizante.",
            "imagen_url": "https://images.unsplash.com/photo-1679928300315-a1c1c6105229?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Camiseta Baloncesto Street Black",
            "categoria": "ropa",
            "deporte": "baloncesto",
            "color": "negro",
            "marca": "JumpMaster",
            "precio": Decimal("46.90"),
            "stock": 28,
            "descripcion": "Camiseta de baloncesto transpirable para juego indoor y outdoor.",
            "imagen_url": "https://images.unsplash.com/photo-1698322830976-4a3fdfb293d5?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
        {
            "nombre": "Zapatillas Baloncesto SkyJump Blue",
            "categoria": "zapatillas",
            "deporte": "baloncesto",
            "color": "azul",
            "marca": "JumpMaster",
            "precio": Decimal("144.00"),
            "stock": 17,
            "descripcion": "Estabilidad lateral y amortiguacion alta para juego explosivo.",
            "imagen_url": "https://images.unsplash.com/photo-1636031855107-ea6f414524f4?auto=format&fit=crop&w=1200&q=80",
            "disponible": True,
        },
    ]

    try:
        deleted_seed_keys = _load_seed_deletions()
        existing_by_key = {}
        for product in session.query(Product).all():
            key = _normalize_seed_key(product.nombre, product.marca)
            existing_by_key.setdefault(key, []).append(product)

        inserted = 0
        deduplicated = 0
        skipped_deleted = 0
        already_present = 0

        for data in sample_products:
            key = _normalize_seed_key(data["nombre"], data["marca"])
            if key in deleted_seed_keys:
                skipped_deleted += 1
                continue

            matches = existing_by_key.get(key, [])
            if matches:
                # No se sobrescriben datos existentes (posibles cambios del admin).
                already_present += 1
                for duplicate in matches[1:]:
                    session.delete(duplicate)
                    deduplicated += 1
                continue

            session.add(Product(**data))
            inserted += 1

        session.commit()
        print(
            "Seed incremental aplicado: "
            f"{inserted} insertados, "
            f"{already_present} ya existentes, "
            f"{deduplicated} duplicados eliminados, "
            f"{skipped_deleted} ignorados por eliminacion previa."
        )
    except Exception as exc:  # pragma: no cover - script manual
        session.rollback()
        print(f"Error al insertar datos: {exc}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    # Ejecutar: python seed_products.py
    seed()
