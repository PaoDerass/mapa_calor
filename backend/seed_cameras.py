# -*- coding: utf-8 -*-
import random
from sqlalchemy.orm import Session
from app.core.database import engine_pg
from app.models.Camara import Camara

# Coordenadas aproximadas para los departamentos de Honduras
DEPT_COORDS = {
    1: (14.08, -87.20),  # Francisco Morazan (Tegucigalpa)
    2: (13.95, -86.35),  # El Paraiso
    3: (13.34, -87.18),  # Choluteca
    4: (13.52, -87.65),  # Valle
    5: (14.45, -87.63),  # Comayagua
    6: (15.50, -88.03),  # Cortes (San Pedro Sula)
    7: (15.78, -86.79),  # Atlantida (La Ceiba)
    8: (15.91, -85.95),  # Colon
    9: (14.77, -88.78),  # Copan
    10: (15.25, -84.40), # Gracias a Dios
    11: (14.31, -88.16), # Intibuca
    12: (16.33, -86.53), # Islas de la Bahia
    13: (14.32, -87.68), # La Paz
    14: (14.59, -88.58), # Lempira
    15: (14.43, -89.18), # Ocotepeque
    16: (14.67, -86.22), # Olancho
    17: (14.92, -88.23), # Santa Barbara
    18: (15.13, -87.45), # Yoro
}

TIPOS = ["Fija", "PTZ", "Domo", "LPR"]
DIRECCIONES = [
    "Intersección Calle Principal",
    "Frente a Centro Comercial",
    "Entrada Norte Ciudad",
    "Poste de Alumbrado #124",
    "Zona Residencial Central",
    "Avenida de los Próceres",
    "Salida hacia la autopista",
    "Esquina Punto Estratégico",
    "Parque Central",
    "Boulevard Principal"
]

def seed_cameras(count=500):
    try:
        with Session(engine_pg) as session:
            print(f"--- Iniciando Generación de {count} Cámaras ---")
            
            for i in range(count):
                depto_id = random.randint(1, 18)
                base_lat, base_lng = DEPT_COORDS.get(depto_id, (14.5, -86.5))
                
                # Añadir un jitter moderado
                lat = base_lat + random.uniform(-0.12, 0.12)
                lng = base_lng + random.uniform(-0.12, 0.12)
                
                tipo = random.choice(TIPOS)
                direccion = random.choice(DIRECCIONES)
                nombre = f"CAM-{tipo[:3].upper()}-{random.randint(1000, 9999)}"
                
                nueva_camara = Camara(
                    nombre=nombre,
                    tipo=tipo,
                    lat=lat,
                    lng=lng,
                    direccion=f"{direccion}, Depto {depto_id}",
                    activa=True
                )
                
                session.add(nueva_camara)
                if (i + 1) % 100 == 0:
                    print(f"🎥 {i + 1} cámaras generadas...")
            
            session.commit()
            print("--- ✅ PROCESO COMPLETADO ---")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    seed_cameras(500)
