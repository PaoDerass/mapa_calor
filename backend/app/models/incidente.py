from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
import uuid
from sqlalchemy.orm import relationship

from app.core.database import Base
# No es estrictamente necesario importar todos aquí si ya los tienes en Base, 
# pero ayuda a SQLAlchemy a conocer las relaciones.

class Incidente(Base):
    __tablename__ = "incidentes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id_original = Column(String(20), unique=True, nullable=False, index=True)
    
    tipo_incidente_id = Column(Integer, ForeignKey("tipos_incidente.id"))
    descripcion_original = Column(Text)
    descripcion_adicional = Column(Text)
    
    ubicacion = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    
    departamento_id = Column(Integer, ForeignKey("departamentos.id"))
    municipio_id = Column(Integer, ForeignKey("municipios.id"))
    barrio_colonia = Column(String(255))
    punto_referencia = Column(Text)
    
    subtipo_incidente_id = Column(Integer, ForeignKey("subtipos_incidente.id"))
    despacho = Column(String(100))
    mando = Column(String(100))
    unidad = Column(String(50))
    
    fecha_reporte_original = Column(DateTime)
    fecha_registro_sistema = Column(DateTime, server_default=func.now())
    
    # Asegúrate de que el ForeignKey apunte a la tabla 'usuarios' y el tipo coincida
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    # La relación debe apuntar a la clase 'Usuario'
    creado_por = relationship("Usuario")

    def __repr__(self):
        return f"<Incidente(ticket={self.ticket_id_original}, tipo={self.tipo_incidente_id})>"