from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Regional(Base):
    __tablename__ = "regionales"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
