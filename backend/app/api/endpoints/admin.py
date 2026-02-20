from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.models.usuario import Usuario
from app.models.Rol import Rol
from app.models.Regional import Regional
from app.models.SystemLog import SystemLog
from app.core.security import obtener_password_hash

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Esquemas Pydantic
class UsuarioCreate(BaseModel):
    nombre_usuario: str
    email: EmailStr
    password: str
    rol_id: Optional[int] = None
    regional_id: Optional[int] = None
    es_admin: bool = False

@router.post("/usuarios")
def crear_usuario(user_in: UsuarioCreate, db: Session = Depends(get_db)):
    # 1. Validar si ya existe
    if db.query(Usuario).filter(Usuario.nombre_usuario == user_in.nombre_usuario).first():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado")
    if db.query(Usuario).filter(Usuario.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # 2. Crear usuario con hash
    nuevo_usuario = Usuario(
        nombre_usuario=user_in.nombre_usuario,
        email=user_in.email,
        password_hash=obtener_password_hash(user_in.password),
        # rol_id=user_in.rol_id,  <-- Temporalmente comentado
        es_admin=user_in.es_admin
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    # 3. Registrar log
    log = SystemLog(
        accion="CREAR_USUARIO",
        detalles=f"Usuario creado: {nuevo_usuario.nombre_usuario} (ID: {nuevo_usuario.id})"
    )
    db.add(log)
    db.commit()
    
    return {"message": "Usuario creado exitosamente", "id": nuevo_usuario.id}

@router.get("/usuarios")
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios = db.query(Usuario).all()
    return [
        {
            "id": u.id,
            "nombre_usuario": u.nombre_usuario,
            "email": u.email,
            "es_admin": u.es_admin,
            "rol": u.rol.nombre if u.rol else "Sin Rol",
            "regional": u.regional.nombre if u.regional else "Sin Regional"
        } for u in usuarios
    ]

@router.get("/regionales")
def listar_regionales(db: Session = Depends(get_db)):
    return db.query(Regional).all()

@router.get("/roles")
def listar_roles(db: Session = Depends(get_db)):
    return db.query(Rol).all()

@router.get("/logs")
def listar_logs(db: Session = Depends(get_db)):
    logs = db.query(SystemLog).order_by(SystemLog.fecha.desc()).limit(100).all()
    resultado = []
    for log in logs:
        usuario_nombre = "Sistema"
        if log.usuario_id:
            u = db.query(Usuario).filter(Usuario.id == log.usuario_id).first()
            if u: usuario_nombre = u.nombre_usuario
        
        resultado.append({
            "id": log.id,
            "usuario": usuario_nombre,
            "accion": log.accion,
            "detalles": log.detalles,
            "fecha": log.fecha.strftime("%Y-%m-%d %H:%M:%S") if log.fecha else "S/F"
        })
    return resultado
