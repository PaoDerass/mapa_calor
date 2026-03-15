"""
seed_camaras.py - Inserta datos de ejemplo de cámaras de vigilancia en PostgreSQL.
Ejecutar desde la carpeta /backend con:
    python seed_camaras.py
"""
from app.core.database import engine_pg
from app.models.Camara import Camara
from sqlalchemy.orm import Session

CAMARAS_EJEMPLO = [
    {"nombre": "CAM-001 - Plaza Central",     "tipo": "PTZ",   "lat": 14.0818, "lng": -87.2068, "direccion": "Frente al Parque Central, Tegucigalpa"},
    {"nombre": "CAM-002 - Mercado Zonal",      "tipo": "Fija",  "lat": 14.0850, "lng": -87.2100, "direccion": "Entrada Norte Mercado, Comayagüela"},
    {"nombre": "CAM-003 - Terminal de Buses",  "tipo": "Domo",  "lat": 14.0790, "lng": -87.2150, "direccion": "Terminal Sur, Comayagüela"},
    {"nombre": "CAM-004 - Parque La Leona",    "tipo": "Fija",  "lat": 14.0872, "lng": -87.2030, "direccion": "Colonia La Leona, Tegucigalpa"},
    {"nombre": "CAM-005 - Boulevard Morazán", "tipo": "PTZ",   "lat": 14.0920, "lng": -87.1980, "direccion": "Blvd. Morazán frente a BBVA"},
    {"nombre": "CAM-006 - Salida Carretera Norte", "tipo": "Fija", "lat": 14.1050, "lng": -87.2050, "direccion": "Km 3 Carretera Norte"},
    {"nombre": "CAM-007 - Colonia Palmira",   "tipo": "Domo",  "lat": 14.0960, "lng": -87.1950, "direccion": "Entrada Colonia Palmira"},
    {"nombre": "CAM-008 - Hospital Escuela",  "tipo": "PTZ",   "lat": 14.0835, "lng": -87.2080, "direccion": "Frente a Hospital Escuela"},
]

def seed():
    with Session(engine_pg) as session:
        existentes = session.query(Camara).count()
        if existentes > 0:
            print(f"ℹ️  Ya existen {existentes} cámaras en la BD. Se omite el seed.")
            return

        for data in CAMARAS_EJEMPLO:
            cam = Camara(
                nombre=data["nombre"],
                tipo=data["tipo"],
                lat=data["lat"],
                lng=data["lng"],
                direccion=data["direccion"],
                activa=True
            )
            session.add(cam)

        session.commit()
        print(f"✅ {len(CAMARAS_EJEMPLO)} cámaras de ejemplo insertadas correctamente.")

if __name__ == "__main__":
    seed()
