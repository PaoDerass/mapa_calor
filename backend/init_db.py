from app.core.database import engine_pg, Base

# IMPORTANTE: Importar cada modelo desde su propio archivo
# Esto registra los modelos en 'Base' para que SQLAlchemy sepa qué tablas crear
try:
    from app.models.incidente import Incidente
    from app.models.TipoIncidente import TipoIncidente
    from app.models.Departamento import Departamento
    from app.models.Municipio import Municipio
    from app.models.SubtipoIncidente import SubtipoIncidente
    from app.models.Regional import Regional
    from app.models.Rol import Rol
    from app.models.usuario import Usuario
    print("✅ Modelos cargados correctamente.")
except ImportError as e:
    print(f"❌ Error de importación: {e}")
    print("Asegúrate de que los nombres de los archivos en app/models coincidan exactamente.")

def create_tables():
    print("🚀 Iniciando creación de tablas en PostgreSQL...")
    try:
        # Esto crea todas las tablas vinculadas a Base
        Base.metadata.create_all(bind=engine_pg)
        print("🎉 Tablas creadas con éxito en la base de datos.")
    except Exception as e:
        print(f"🔥 Error al crear las tablas: {e}")

if __name__ == "__main__":
    create_tables()