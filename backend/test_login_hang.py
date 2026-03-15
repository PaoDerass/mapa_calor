import sys
import time

print("Starting checks")

# 1. Check Passlib Bcrypt
print("1. Testing Passlib CryptContext")
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash_str = pwd_context.hash("admin123")
print("Hash generated:", hash_str)
print("Verify:", pwd_context.verify("admin123", hash_str))

# 2. Check DB
print("2. Testing DB Connection")
from app.core.database import SessionLocalPostgres
from app.models.usuario import Usuario
from sqlalchemy.orm import joinedload

db = SessionLocalPostgres()
print("Session created")
try:
    print("Executing query...")
    user = db.query(Usuario).options(joinedload(Usuario.rol)).filter(Usuario.nombre_usuario == "admin").first()
    if user:
        print("Found User:", user.nombre_usuario)
        print("Role:", user.rol.nombre if user.rol else "None")
        print("Permissions:", [p.nombre for p in user.rol.permisos] if getattr(user.rol, 'permisos', None) else [])
    else:
        print("User not found via 'admin', trying 'Administrador'")
        user = db.query(Usuario).filter(Usuario.nombre_usuario == "Administrador").first()
        print("Found User:", user.nombre_usuario if user else "Not Found")
except Exception as e:
    print("DB Error:", type(e), str(e))
finally:
    db.close()
    print("Done")
