from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Permiso(Base):
    __tablename__ = "permisos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False) # Ej: "crear_ticket"
    descripcion = Column(String(255), nullable=True)