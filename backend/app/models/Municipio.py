from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Municipio(Base):
    __tablename__ = "municipios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    departamento_id = Column(Integer, ForeignKey("departamentos.id"), nullable=False)

    # Relación con el padre
    departamento = relationship("Departamento", back_populates="municipios")