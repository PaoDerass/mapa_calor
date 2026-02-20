from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine_pg, Base

# Importación de Modelos
from app.models.Departamento import Departamento
from app.models.usuario import Usuario
from app.models.Rol import Rol
from app.models.Regional import Regional
from app.models.SystemLog import SystemLog
from app.models.incidente import Incidente
from app.models.SubtipoIncidente import SubtipoIncidente
from app.models.usuario import Usuario # Asegúrate de que el modelo Usuario esté aquí

# Importación de Routers
from app.api.endpoints import tickets
from app.api.endpoints import dashboard
from app.api.endpoints import login  # <--- NUEVA IMPORTACIÓN PARA EL LOGIN
from app.api.endpoints import admin

# Crear tablas en Postgres
print("🚀 Creando tablas en PostgreSQL...")
Base.metadata.create_all(bind=engine_pg)

app = FastAPI(title="Sistema de Incidentes Atlas")

# --- 1. CONFIGURACIÓN DE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cambiado de ["*"] a especificar orígenes si fuera necesario, pero por ahora quitamos allow_credentials si preferimos *
    allow_credentials=False, # Si usamos *, no podemos usar Credentials=True
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. INCLUIR LAS RUTAS DEL BACKEND ---

# Ruta de Autenticación (Esta es la que te faltaba)
# La URL final será: http://127.0.0.1:8000/api/auth/login
app.include_router(login.router) 
app.include_router(admin.router)

# Rutas de Tickets y Dashboard
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(dashboard.router, prefix="/api/tickets", tags=["Dashboard"])

@app.get("/")
def read_root():
    return {
        "status": "Sistema de Incidentes Activo", 
        "documentacion": "/docs",
        "modulo_seguridad": "Conectado"
    }