# -*- coding: utf-8 -*-
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from geoalchemy2.functions import ST_GeomFromText
from app.core.database import engine_pg, get_db
from app.models.incidente import Incidente
from app.models.Departamento import Departamento
from app.models.Municipio import Municipio
from app.models.TipoIncidente import TipoIncidente
from app.models.SubtipoIncidente import SubtipoIncidente

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

DESCRIPCIONES = [
    "Reporte de actividad sospechosa en la zona.",
    "Colisión entre dos vehículos particulares.",
    "Solicitud de asistencia médica de urgencia.",
    "Desprendimiento de rocas bloqueando la vía.",
    "Incendio en terreno baldío con riesgo de propagación.",
    "Fallo en el fluido eléctrico reportado por vecinos.",
    "Inundación leve por obstrucción de alcantarillado.",
    "Accidente de tránsito con heridos leves.",
    "Denuncia por ruido excesivo en horas de la noche.",
    "Asistencia ciudadana por vehículo varado."
]

BARRIOS = ["Centro", "El Prado", "Bella Vista", "Los Pinos", "Colonia Moderna", "Barrio Abajo", "San Jose", "La Granja", "Miraflores", "Nueva Suyapa"]

def seed_random_incidents(count=200):
    try:
        with Session(engine_pg) as session:
            print(f"--- Iniciando Generación de {count} Incidentes ---")
            
            # Cargar catálogos
            municipios = session.query(Municipio).all()
            tipos = session.query(TipoIncidente).all()
            subtipos = session.query(SubtipoIncidente).all()
            
            if not municipios or not tipos:
                print("Error: No hay catálogos cargados. Ejecuta seed.py primero.")
                return

            for i in range(count):
                muni = random.choice(municipios)
                depto_id = muni.departamento_id
                
                # Buscar subtipo compatible
                subtipo_validos = [s for s in subtipos if s.tipo_incidente_id is not None] # Simplificación
                # En un caso ideal, filtraríamos subtipo por el tipo seleccionado
                tipo = random.choice(tipos)
                sub_compatibles = [s for s in subtipos if s.tipo_incidente_id == tipo.id]
                sub = random.choice(sub_compatibles) if sub_compatibles else random.choice(subtipos)

                # Generar coordenadas
                base_lat, base_lng = DEPT_COORDS.get(depto_id, (14.5, -86.5))
                # Añadir un pequeño jitter para que no queden todos en el mismo punto
                lat = base_lat + random.uniform(-0.15, 0.15)
                lng = base_lng + random.uniform(-0.15, 0.15)
                
                punto_geom = f"POINT({lng} {lat})"
                
                # Fecha aleatoria en los últimos 30 días
                dias_atras = random.randint(0, 30)
                horas_atras = random.randint(0, 23)
                fecha = datetime.now() - timedelta(days=dias_atras, hours=horas_atras, minutes=random.randint(0, 59))
                
                # Ticket ID más único (Prefijo + Año + Mes + Día + Hora + Aleatorio grande)
                ticket_id = f"T-{fecha.strftime('%Y%m%d%H')}-{random.randint(100000, 999999)}"
                
                nuevo_incidente = Incidente(
                    ticket_id_original=ticket_id,
                    tipo_incidente_id=tipo.id,
                    subtipo_incidente_id=sub.id,
                    descripcion_original=random.choice(DESCRIPCIONES),
                    descripcion_adicional="Generado automáticamente por script de prueba.",
                    ubicacion=ST_GeomFromText(punto_geom, srid=4326),
                    departamento_id=depto_id,
                    municipio_id=muni.id,
                    barrio_colonia=random.choice(BARRIOS),
                    fecha_reporte_original=fecha,
                    despacho=random.choice(["911", "Policía", "Bomberos", "Copeco"]),
                    mando="Central",
                    unidad=f"UN-{random.randint(1, 100)}",
                    usuario_id=1 # Asumiendo que el admin existe
                )
                
                session.add(nuevo_incidente)
                try:
                    session.flush() # Flush cada registro para atrapar colisiones de inmediato
                except:
                    session.rollback()
                    continue

                if (i + 1) % 50 == 0:
                    print(f"📦 {i + 1} incidentes generados...")
            
            session.commit()
            print("--- ✅ PROCESO COMPLETADO ---")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    seed_random_incidents(500)
