from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.Rol import rol_permiso

class Permiso(Base):
    __tablename__ = "permisos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False) # Ej: "crear_ticket"
    descripcion = Column(String(255), nullable=True)

    roles = relationship("Rol", secondary=rol_permiso, back_populates="permisos")