from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from uuid import UUID

class IncidenteBase(BaseModel):
    ticket_id_original: str
    tipo_incidente_id: int
    descripcion_adicional: Optional[str] = None
    latitud: float
    longitud: float
    departamento_id: int
    barrio_colonia: Optional[str] = None

class IncidenteCreate(IncidenteBase):
    descripcion_original: str
    fecha_reporte_original: datetime

class IncidenteOut(IncidenteBase):
    id: UUID
    fecha_registro_sistema: datetime

    class Config:
        from_attributes = True