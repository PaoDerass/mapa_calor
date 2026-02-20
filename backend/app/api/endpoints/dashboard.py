from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db 
from app.models.incidente import Incidente
from app.models.TipoIncidente import TipoIncidente

# Usamos Router, NO app = FastAPI()
router = APIRouter()

@router.get("/dashboard-stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    try:
        total_tickets = db.query(Incidente).count()

        # Usamos outerjoin por si la base está vacía que no devuelva error
        stats_por_tipo = (
            db.query(
                TipoIncidente.nombre, 
                func.count(Incidente.id).label("cantidad")
            )
            .outerjoin(Incidente, Incidente.tipo_incidente_id == TipoIncidente.id)
            .group_by(TipoIncidente.nombre)
            .all()
        )

        recientes = (
            db.query(Incidente)
            .order_by(Incidente.fecha_registro_sistema.desc())
            .limit(5)
            .all()
        )

        return {
            "total": total_tickets,
            "por_tipo": [{"label": s.nombre, "value": s.cantidad} for s in stats_por_tipo],
            "recientes": [
                {
                    "ticket_id": r.ticket_id_original,
                    "hora": r.fecha_registro_sistema.strftime("%H:%M") if r.fecha_registro_sistema is not None else "--:--",
                    "barrio_colonia": r.barrio_colonia or "Sin ubicación"
                } for r in recientes
            ]
        }
    except Exception as e:
        print(f"Error en el dashboard: {e}")
        return {"error": str(e), "total": 0, "por_tipo": [], "recientes": []}