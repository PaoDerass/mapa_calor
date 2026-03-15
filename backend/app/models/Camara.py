from sqlalchemy import Column, Integer, String, Boolean, Float
from app.core.database import Base

class Camara(Base):
    __tablename__ = "camaras"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    tipo = Column(String(50), nullable=True, default="Fija")  # PTZ, Fija, Domo, etc.
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    direccion = Column(String(255), nullable=True)
    activa = Column(Boolean, default=True)

    def __repr__(self):
        return f"<Camara(id={self.id}, nombre={self.nombre}, tipo={self.tipo})>"
