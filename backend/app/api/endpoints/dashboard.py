from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db 
from app.models.incidente import Incidente
from app.models.TipoIncidente import TipoIncidente
from app.models.Departamento import Departamento
from app.models.Municipio import Municipio
from app.models.SubtipoIncidente import SubtipoIncidente
from app.models.usuario import Usuario

from app.api.deps import PermissionChecker

# Usamos Router, NO app = FastAPI()
router = APIRouter(
    dependencies=[Depends(PermissionChecker(["ver_dashboard"]))]
)

@router.get("/dashboard-stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    try:
        from datetime import datetime, timedelta
        ahora = datetime.utcnow()
        hace_24h = ahora - timedelta(days=1)
        hace_7d = ahora - timedelta(days=7)

        total_tickets = db.query(Incidente).count()
        tickets_24h = db.query(Incidente).filter(Incidente.fecha_registro_sistema >= hace_24h).count()

        # Distribución por tipo
        stats_por_tipo = (
            db.query(
                TipoIncidente.nombre, 
                func.count(Incidente.id).label("cantidad")
            )
            .outerjoin(Incidente, Incidente.tipo_incidente_id == TipoIncidente.id)
            .group_by(TipoIncidente.nombre)
            .all()
        )

        # Tendencia semanal (últimos 7 días)
        tendencia_query = (
            db.query(
                func.date(Incidente.fecha_registro_sistema).label("fecha"),
                func.count(Incidente.id).label("cantidad")
            )
            .filter(Incidente.fecha_registro_sistema >= hace_7d)
            .group_by(func.date(Incidente.fecha_registro_sistema))
            .order_by(func.date(Incidente.fecha_registro_sistema))
            .all()
        )
        
        # Formatear tendencia para completar días sin datos
        dias = [(ahora - timedelta(days=i)).date() for i in range(6, -1, -1)]
        dict_tendencia = {row.fecha: row.cantidad for row in tendencia_query}
        tendencia_formateada = [
            {"fecha": d.strftime("%d/%m"), "cantidad": dict_tendencia.get(d, 0)}
            for d in dias
        ]

        # Top Municipios (usando el campo string barrio_colonia por ahora si no hay relación directa a Municipio en este modelo aún)
        top_ubicaciones = (
            db.query(
                Incidente.barrio_colonia,
                func.count(Incidente.id).label("cantidad")
            )
            .filter(Incidente.barrio_colonia != None)
            .group_by(Incidente.barrio_colonia)
            .order_by(func.count(Incidente.id).desc())
            .limit(5)
            .all()
        )

        # Recientes con datos completos para navegación
        recientes_query = (
            db.query(
                Incidente,
                Departamento.nombre.label("depto_nombre"),
                Municipio.nombre.label("muni_nombre"),
                TipoIncidente.nombre.label("tipo_nombre"),
                SubtipoIncidente.nombre.label("sub_nombre"),
                Usuario.nombre_usuario.label("creador_nombre")
            )
            .outerjoin(Departamento, Incidente.departamento_id == Departamento.id)
            .outerjoin(Municipio, Incidente.municipio_id == Municipio.id)
            .outerjoin(TipoIncidente, Incidente.tipo_incidente_id == TipoIncidente.id)
            .outerjoin(SubtipoIncidente, Incidente.subtipo_incidente_id == SubtipoIncidente.id)
            .outerjoin(Usuario, Incidente.usuario_id == Usuario.id)
            .order_by(Incidente.fecha_registro_sistema.desc())
            .limit(5)
            .all()
        )

        from geoalchemy2.shape import to_shape
        from shapely.geometry import Point

        recientes_formateados = []
        for inc, depto_nombre, muni_nombre, tipo_nombre, sub_nombre, creador_nombre in recientes_query:
            lat, lng = None, None
            if inc.ubicacion is not None:
                try:
                    shape_obj = to_shape(inc.ubicacion)
                    if isinstance(shape_obj, Point):
                        lat, lng = shape_obj.y, shape_obj.x
                except Exception:
                    pass

            recientes_formateados.append({
                "id": str(inc.id),
                "ticket_id": inc.ticket_id_original,
                "descripcion": inc.descripcion_original,
                "fecha": inc.fecha_reporte_original.strftime("%Y-%m-%d %H:%M") if inc.fecha_reporte_original else "S/F",
                "fecha_sistema": inc.fecha_registro_sistema.strftime("%Y-%m-%d %H:%M") if inc.fecha_registro_sistema else "S/F",
                "hora": inc.fecha_registro_sistema.strftime("%H:%M") if inc.fecha_registro_sistema else "--:--",
                "barrio_colonia": inc.barrio_colonia or "Sin ubicación",
                "departamento": depto_nombre,
                "municipio": muni_nombre,
                "tipo_incidente": tipo_nombre,
                "subtipo_incidente": sub_nombre,
                "despacho": inc.despacho,
                "creado_por": creador_nombre or "S/A",
                "lat": lat,
                "lng": lng
            })

        return {
            "total": total_tickets,
            "tickets_24h": tickets_24h,
            "tendencia": tendencia_formateada,
            "por_tipo": [{"label": s.nombre, "value": s.cantidad} for s in stats_por_tipo],
            "top_ubicaciones": [{"label": u.barrio_colonia, "value": u.cantidad} for u in top_ubicaciones],
            "recientes": recientes_formateados
        }
    except Exception as e:
        print(f"Error en el dashboard: {e}")
        return {"error": str(e), "total": 0, "por_tipo": [], "recientes": []}