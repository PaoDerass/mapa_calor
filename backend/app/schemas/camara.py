from pydantic import BaseModel
from typing import Optional

class CamaraBase(BaseModel):
    nombre: str
    tipo: Optional[str] = "Fija"
    lat: float
    lng: float
    direccion: Optional[str] = None
    activa: Optional[bool] = True

class CamaraCreate(CamaraBase):
    pass

class CamaraOut(CamaraBase):
    id: int

    class Config:
        from_attributes = True
