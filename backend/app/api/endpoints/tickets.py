from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import text, exc
from sqlalchemy.orm import Session
from geoalchemy2.functions import ST_GeomFromText
from geoalchemy2.shape import to_shape
from shapely.geometry import Point
from typing import Any, List
import traceback
from app.core.database import engine_mysql, engine_pg, get_db
from app.models.incidente import Incidente
from app.models.Departamento import Departamento
from app.models.TipoIncidente import TipoIncidente
from app.models.Municipio import Municipio
from app.models.SubtipoIncidente import SubtipoIncidente
from app.models.usuario import Usuario  # Importar Usuario
from app.api.utils import registrar_log


router = APIRouter()

@router.get("/buscar-externo/{ticket_id}")
async def buscar_ticket_externo(ticket_id: str):
    """
    Busca un incidente en MySQL uniendo las tablas de catálogos.
    """
    query = text("""
        SELECT 
            i.IdIncidentes as ticket,
            i.barrio_o_colonia as registro,
            i.fechaHecho, 
            i.descripcionIncidente as descripcion,
            d.IdDepartamento as departamento_id,
            d.departamento as departamento_nombre,
            m.IdMunicipio as municipio_id,
            m.municipio as municipio_nombre,
            t.IdTipoIncidente as tipo_incidente_id,
            t.tipoIncidente as tipologia,
            s.subtipoIncidente as subtipologia,
            g.Latitud as latitud,
            g.Longitud as longitud,
            dr.Despacho as despacho
        FROM incidentes i
        LEFT JOIN geolocalizacion_incidente g ON i.IdIncidentes = g.IdIncidente
        LEFT JOIN subtipos_incidentes s ON i.subtipos_incidentes_IdSubtipoIncidente = s.IdSubtipoIncidente
        LEFT JOIN tipos_incidentes t ON s.tipos_incidentes_IdTipoIncidente = t.IdTipoIncidente
        LEFT JOIN municipios m ON i.municipios_IdMunicipio = m.IdMunicipio
        LEFT JOIN departamentos d ON m.departamentos_IdDepartamento = d.IdDepartamento
        LEFT JOIN incidentes_despachos_encargados ide ON i.IdIncidentes = ide.incidentes_IdIncidentes
        LEFT JOIN despachos_roles dr ON ide.roles_IdRol = dr.IdDespachoRol
        WHERE i.IdIncidentes = :tid
        LIMIT 1
    """)
    
    try:
        with engine_mysql.connect() as conn:
            result = conn.execute(query, {"tid": ticket_id}).mappings().first()
            
            if not result:
                raise HTTPException(
                    status_code=404, 
                    detail=f"El ticket '{ticket_id}' no existe."
                )
            
            datos_ticket = dict(result)
            
            fh = datos_ticket.get("fechaHecho")
            if fh:
                datos_ticket["fecha"] = fh.strftime("%Y-%m-%d")
                datos_ticket["hora"] = fh.strftime("%H:%M")
            else:
                datos_ticket["fecha"] = ""
                datos_ticket["hora"] = ""

            lat = datos_ticket.get("latitud")
            lng = datos_ticket.get("longitud")
            datos_ticket["coordenada"] = f"{lat}, {lng}" if lat and lng else ""

            return datos_ticket

    except exc.OperationalError as e:
        raise HTTPException(status_code=503, detail=f"ERROR DE CONEXIÓN: {str(e.orig)}")
    except exc.ProgrammingError as e:
        # Intentar obtener el listado de tablas y columnas para diagnóstico
        try:
            with engine_mysql.connect() as conn:
                tables_res = conn.execute(text("SHOW TABLES"))
                actual_tables = [r[0] for r in tables_res]
                
                columns_info = {}
                for t in ['incidentes', 'subtipos_incidentes', 'tipos_incidentes']:
                    if t in actual_tables:
                        col_res = conn.execute(text(f"DESCRIBE {t}"))
                        columns_info[t] = [r[0] for r in col_res]
                
                detail = f"ERROR DE ESTRUCTURA: {str(e.orig)}. TABLAS: {actual_tables}. COLUMNAS: {columns_info}"
        except Exception as inner_e:
            detail = f"ERROR DE ESTRUCTURA: {str(e.orig)}. DIAG_FAIL: {str(inner_e)}"
        raise HTTPException(status_code=400, detail=detail)
    except HTTPException:
        raise
    except Exception as e:
        print(f"--- ERROR CRÍTICO ---\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(e)}")


@router.post("/guardar-ficha-completa")
@registrar_log("CREAR_INCIDENTE", detalles_func=lambda r, **kw: f"Incidente registrado: {kw['payload'].get('ticket_id')}")
async def guardar_ficha_completa(payload: dict, db: Session = Depends(get_db)):
    """ 
    Guarda el objeto Incidente completo en Postgres.
    """
    print(f"DEBUG: Payload recibido para guardar: {payload}")
    try:
        lat = payload.get("latitud")
        lng = payload.get("longitud")
        punto_geom = f"POINT({lng} {lat})" if lat and lng else None

        nuevo_incidente = Incidente(
            ticket_id_original=payload.get("ticket_id"),
            descripcion_original=payload.get("descripcion_original"),
            descripcion_adicional=payload.get("nota_respaldo"),
            ubicacion=ST_GeomFromText(punto_geom, srid=4326) if punto_geom else None,
            barrio_colonia=payload.get("barrio_colonia"),
            fecha_reporte_original=payload.get("fecha_reporte"),
            tipo_incidente_id=payload.get("tipo_incidente_id"),
            subtipo_incidente_id=payload.get("subtipo_incidente_id"),
            departamento_id=payload.get("departamento_id"),
            municipio_id=payload.get("municipio_id"),
            despacho=payload.get("despacho"),
            mando=payload.get("mando"),
            unidad=payload.get("unidad"),
            usuario_id=payload.get("usuario_id") # Nuevo campo: quién creó
        )

        db.add(nuevo_incidente)
        db.commit()
        return {"status": "success", "message": "Incidente registrado en PostgreSQL"}

    except exc.IntegrityError:
        raise HTTPException(status_code=400, detail="Este ticket ya existe en el sistema.")
    except Exception as e:
        print(f"--- ERROR CRÍTICO EN POSTGRES ---\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/listar-recientes")
async def listar_recientes():
    """
    Obtiene todos los incidentes registrados en PostgreSQL.
    Se usa List[Any] para que Pylance no proteste por los tipos de SQLAlchemy.
    """
    try:
        with Session(engine_pg) as session:
            # Realizamos un JOIN para obtener los nombres de catálogos en una sola consulta
            query = (
                session.query(
                    Incidente,
                    Departamento.nombre.label("depto_nombre"),
                    Municipio.nombre.label("muni_nombre"),
                    TipoIncidente.nombre.label("tipo_nombre"),
                    SubtipoIncidente.nombre.label("sub_nombre"),
                    Usuario.nombre_usuario.label("creador_nombre") # Traer nombre del creador
                )
                .outerjoin(Departamento, Incidente.departamento_id == Departamento.id)
                .outerjoin(Municipio, Incidente.municipio_id == Municipio.id)
                .outerjoin(TipoIncidente, Incidente.tipo_incidente_id == TipoIncidente.id)
                .outerjoin(SubtipoIncidente, Incidente.subtipo_incidente_id == SubtipoIncidente.id)
                .outerjoin(Usuario, Incidente.usuario_id == Usuario.id) # Join con usuario
                .order_by(Incidente.fecha_registro_sistema.desc())
            )
            
            incidentes = query.all()
            
            resultado = []
            for inc, depto_nombre, muni_nombre, tipo_nombre, sub_nombre, creador_nombre in incidentes:
                # Procesamiento de fecha
                fecha_str = "S/F"
                if inc.fecha_reporte_original is not None:
                    fecha_str = inc.fecha_reporte_original.strftime("%Y-%m-%d %H:%M")

                # Procesamiento de ubicación (Geometry)
                lat, lng = None, None
                if inc.ubicacion is not None:
                    try:
                        shape_obj = to_shape(inc.ubicacion)
                        if isinstance(shape_obj, Point):
                            lat, lng = shape_obj.y, shape_obj.x
                    except Exception:
                        pass

                resultado.append({
                    "id": str(inc.id),
                    "ticket_id": inc.ticket_id_original,
                    "descripcion": inc.descripcion_original,
                    "fecha": fecha_str,
                    "fecha_sistema": inc.fecha_registro_sistema.strftime("%Y-%m-%d %H:%M") if inc.fecha_registro_sistema else "S/F",
                    "barrio": inc.barrio_colonia,
                    "departamento": depto_nombre,
                    "municipio": muni_nombre,
                    "tipo_incidente": tipo_nombre,
                    "subtipo_incidente": sub_nombre,
                    "despacho": inc.despacho,
                    "creado_por": creador_nombre or "S/A",
                    "lat": lat,
                    "lng": lng
                })
            return resultado
    except Exception as e:
        print(f"--- ERROR AL LEER DE POSTGRES ---\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalogos")
async def obtener_catalogos():
    """
    Devuelve las listas de catálogos (departamentos, tipos de incidente, municipios)
    necesarias para el formulario manual de tickets.
    """
    try:
        with Session(engine_pg) as session:
            departamentos = session.query(Departamento).order_by(Departamento.nombre).all()
            tipos = session.query(TipoIncidente).order_by(TipoIncidente.nombre).all()
            subtipos = session.query(SubtipoIncidente).order_by(SubtipoIncidente.nombre).all()
            municipios = session.query(Municipio).order_by(Municipio.nombre).all()

            return {
                "departamentos": [{"id": d.id, "nombre": d.nombre} for d in departamentos],
                "tipos_incidente": [{"id": t.id, "nombre": t.nombre} for t in tipos],
                "subtipos_incidente": [{"id": s.id, "nombre": s.nombre, "tipo_incidente_id": s.tipo_incidente_id} for s in subtipos],
                "municipios": [{"id": m.id, "nombre": m.nombre, "departamento_id": m.departamento_id} for m in municipios],
            }
    except Exception as e:
        print(f"--- ERROR AL LEER CATÁLOGOS ---\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))