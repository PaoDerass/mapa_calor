from sqlalchemy import text
from app.core.database import engine_pg

def run_migration():
    print("🚀 Iniciando migración de base de datos...")
    query = text("ALTER TABLE usuarios ALTER COLUMN email DROP NOT NULL;")
    
    try:
        with engine_pg.connect() as conn:
            conn.execute(query)
            conn.commit()
            print("✅ Columna 'email' ahora permite valores nulos.")
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    run_migration()
