from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.models.usuario import Usuario
from app.models.Rol import Rol
from app.models.Regional import Regional
from app.models.SystemLog import SystemLog
from app.models.Permisos import Permiso
from app.core.security import obtener_password_hash
from app.api.utils import registrar_log

from app.api.deps import PermissionChecker, get_current_user

router = APIRouter(
    prefix="/api/admin", 
    tags=["admin"]
)

# Esquemas Pydantic
class UsuarioCreate(BaseModel):
    nombre_usuario: str
    email: Optional[EmailStr] = None
    password: str
    rol_id: Optional[int] = None
    regional_id: Optional[int] = None
    es_admin: bool = False

class UsuarioUpdate(BaseModel):
    nombre_usuario: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    rol_id: Optional[int] = None
    regional_id: Optional[int] = None
    es_admin: Optional[bool] = None

class AsignarPermisos(BaseModel):
    permisos_ids: List[int]

@router.post("/usuarios", dependencies=[Depends(PermissionChecker(["gestionar_usuarios"]))])
@registrar_log("CREAR_USUARIO", detalles_func=lambda r, **kw: f"Usuario creado: {kw['user_in'].nombre_usuario} (ID: {r['id']})")
def crear_usuario(user_in: UsuarioCreate, db: Session = Depends(get_db)):
    # 1. Validar si ya existe el nombre de usuario
    if db.query(Usuario).filter(Usuario.nombre_usuario == user_in.nombre_usuario).first():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado")
    
    # 2. Validar email solo si se proporciona
    if user_in.email:
        if db.query(Usuario).filter(Usuario.email == user_in.email).first():
            raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    try:
        # 3. Crear usuario con hash
        nuevo_usuario = Usuario(
            nombre_usuario=user_in.nombre_usuario,
            email=user_in.email,
            password_hash=obtener_password_hash(user_in.password),
            rol_id=user_in.rol_id,
            regional_id=user_in.regional_id,
            es_admin=user_in.es_admin
        )
        
        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)
        
        return {"message": "Usuario creado exitosamente", "id": nuevo_usuario.id}
    except Exception as e:
        db.rollback()
        print(f"ERROR AL CREAR USUARIO: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.put("/usuarios/{usuario_id}", dependencies=[Depends(PermissionChecker(["gestionar_usuarios"]))])
@registrar_log("ACTUALIZAR_USUARIO", detalles_func=lambda r, **kw: f"Usuario actualizado: {kw['user_in'].nombre_usuario or 'ID '+str(kw['usuario_id'])}")
def actualizar_usuario(usuario_id: int, user_in: UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # 1. Validar nombre de usuario si cambia
    if user_in.nombre_usuario and user_in.nombre_usuario != usuario.nombre_usuario:
        if db.query(Usuario).filter(Usuario.nombre_usuario == user_in.nombre_usuario).first():
            raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado")
        usuario.nombre_usuario = user_in.nombre_usuario
        
    # 2. Validar email si cambia
    if user_in.email and user_in.email != usuario.email:
        if db.query(Usuario).filter(Usuario.email == user_in.email).first():
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        usuario.email = user_in.email
    elif user_in.email is None and user_in.email != usuario.email:
        # Permitir limpiar el email si antes tenía uno
        usuario.email = None

    # 3. Actualizar otros campos
    if user_in.password:
        usuario.password_hash = obtener_password_hash(user_in.password)
    
    if user_in.rol_id is not None:
        usuario.rol_id = user_in.rol_id
    
    if user_in.regional_id is not None:
        usuario.regional_id = user_in.regional_id
        
    if user_in.es_admin is not None:
        usuario.es_admin = user_in.es_admin

    try:
        db.commit()
        db.refresh(usuario)
        
        return {"message": "Usuario actualizado correctamente"}
    except Exception as e:
        db.rollback()
        print(f"ERROR AL ACTUALIZAR USUARIO: {e}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar: {str(e)}")

@router.get("/usuarios", dependencies=[Depends(PermissionChecker(["gestionar_usuarios"]))])
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

@router.get("/regionales", dependencies=[Depends(get_current_user)])
def listar_regionales(db: Session = Depends(get_db)):
    return db.query(Regional).all()

@router.get("/roles", dependencies=[Depends(PermissionChecker(["asignar_permisos"]))])
def listar_roles(db: Session = Depends(get_db)):
    roles = db.query(Rol).all()
    return [
        {
            "id": r.id,
            "nombre": r.nombre,
            "permisos": [{"id": p.id, "nombre": p.nombre, "descripcion": p.descripcion} for p in r.permisos]
        } for r in roles
    ]

@router.get("/permisos", dependencies=[Depends(PermissionChecker(["asignar_permisos"]))])
def listar_permisos(db: Session = Depends(get_db)):
    return db.query(Permiso).all()

@router.put("/roles/{rol_id}/permisos", dependencies=[Depends(PermissionChecker(["asignar_permisos"]))])
@registrar_log("ACTUALIZAR_PERMISOS", detalles_func=lambda r, **kw: f"Permisos actualizados para rol ID {kw['rol_id']}")
def actualizar_permisos_rol(rol_id: int, payload: AsignarPermisos, db: Session = Depends(get_db)):
    rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    permisos = db.query(Permiso).filter(Permiso.id.in_(payload.permisos_ids)).all()
    rol.permisos = permisos
    try:
        db.commit()
        return {"message": "Permisos actualizados correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs", dependencies=[Depends(PermissionChecker(["ver_auditoria"]))])
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
