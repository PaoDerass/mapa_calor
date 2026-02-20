from typing import Optional
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt

# Forzamos a que use el algoritmo bcrypt de forma explícita
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "tu_llave_secreta_para_atlas_2026" 
ALGORITHM = "HS256"

def obtener_password_hash(password: str):
    # Asegúrate de que el password sea un string limpio
    return pwd_context.hash(password)

def verificar_password(password_plano: str, password_hash: str):
    return pwd_context.verify(password_plano, password_hash)

def crear_token_acceso(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Si no mandan nada, por defecto 8 horas
        expire = datetime.utcnow() + timedelta(hours=8)
        
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)