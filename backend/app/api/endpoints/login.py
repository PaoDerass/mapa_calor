from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any
from pydantic import BaseModel

# Importaciones de tu estructura
from app.core.database import get_db
from app.models.usuario import Usuario
from app.core.security import verificar_password, crear_token_acceso

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # 1. Buscar al usuario por 'nombre_usuario'
    user = db.query(Usuario).filter(Usuario.nombre_usuario == form_data.username).first()
    
    # 2. Validar existencia y contraseña usando 'password_hash'
    # Usamos str() para que Pylance no se queje del tipo Column
    if not user or not verificar_password(form_data.password, str(user.password_hash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Crear el token JWT
    access_token_expires = timedelta(minutes=60)
    access_token = crear_token_acceso(
        data={"sub": str(user.nombre_usuario)},
        expires_delta=access_token_expires
    )
    
    # 4. Respuesta para el Frontend
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.nombre_usuario
    }

class ChangePasswordRequest(BaseModel):
    user_id: int
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db)
):
    # 1. Buscar al usuario
    user = db.query(Usuario).filter(Usuario.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # 2. Verificar contraseña actual
    if not verificar_password(request.current_password, str(user.password_hash)):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    
    # 3. Actualizar contraseña
    user.password_hash = obtener_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}