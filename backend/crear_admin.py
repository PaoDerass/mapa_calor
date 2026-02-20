from app.core.database import SessionLocalPostgres 
from app.models.usuario import Usuario
from app.core.security import obtener_password_hash

def crear_usuario_inicial():
    db = SessionLocalPostgres() 
    try:
        existe = db.query(Usuario).filter(Usuario.nombre_usuario == "admin").first()
        if not existe:
            admin = Usuario(
                nombre_usuario="admin",
                email="admin@atlas.com",
                password_hash=obtener_password_hash("admin123")
            )
            db.add(admin)
            db.commit()
            print("Usuario admin creado")
        else:
            print("El usuario admin ya existe.")
    except Exception as e:
        print(f"Error al crear usuario: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    crear_usuario_inicial()