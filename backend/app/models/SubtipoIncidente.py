from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class SubtipoIncidente(Base):
    __tablename__ = "subtipos_incidente"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    tipo_incidente_id = Column(Integer, ForeignKey("tipos_incidente.id"), nullable=False)

    # Relación con el padre (TipoIncidente)
    tipo_incidente = relationship("TipoIncidente", back_populates="subtipos")