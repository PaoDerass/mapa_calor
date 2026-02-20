from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre_usuario = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False) # ¡Nunca guardes texto plano!
    es_admin = Column(Boolean, default=False)
    
    # Relaciones
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    regional_id = Column(Integer, ForeignKey("regionales.id"), nullable=True)
    
    rol = relationship("Rol")
    regional = relationship("Regional")