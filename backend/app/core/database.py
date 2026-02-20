from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# --- 1. CONFIGURACIÓN POSTGRESQL (Sistema Nuevo) ---
# Usamos la URL calculada en config.py
engine_pg = create_engine(
    settings.SYNC_DATABASE_URL,
    pool_pre_ping=True  # Verifica si la conexión está viva antes de usarla
)
SessionLocalPostgres = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine_pg
)

# --- 2. CONFIGURACIÓN MYSQL (Sistema de Tickets Externo) ---
# Importante: Usamos pymysql como driver para conectar con MariaDB/MySQL
engine_mysql = create_engine(
    settings.MYSQL_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600  # Evita errores de "MySQL server has gone away"
)
SessionLocalMySQL = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine_mysql
)

# Base para los modelos de SQLAlchemy de tu sistema nuevo
Base = declarative_base()

# --- 3. DEPENDENCIAS (Para usar en los endpoints de FastAPI) ---

# Dependencia para la DB de Postgres (Escritura y consulta local)
def get_db():
    db = SessionLocalPostgres()
    try:
        yield db
    finally:
        db.close()

# Dependencia para la DB de MySQL (Solo lectura de tickets)
def get_external_db():
    db = SessionLocalMySQL()
    try:
        yield db
    finally:
        db.close()