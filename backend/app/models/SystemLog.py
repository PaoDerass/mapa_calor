from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    accion = Column(String(100), nullable=False)
    detalles = Column(Text, nullable=True)
    fecha = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<SystemLog(accion={self.accion}, fecha={self.fecha})>"
