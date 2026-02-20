from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class TipoIncidente(Base):
    """
    Representa la categoría principal del incidente (ej. Accidentes, Delitos).
    """
    __tablename__ = "tipos_incidente"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)

    # Relación uno a muchos con SubtipoIncidente
    subtipos = relationship("SubtipoIncidente", back_populates="tipo_incidente")

