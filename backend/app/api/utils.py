from functools import wraps
from sqlalchemy.orm import Session
from app.models.SystemLog import SystemLog

def registrar_log(accion: str, detalles_func=None):
    """
    Decorador para registrar acciones en SystemLog.
    Busca un argumento 'db' de tipo Session en la función decorada.
    detalles_func: Función opcional que recibe el resultado y los argumentos para generar un string de detalles.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Ejecutar la función original
            result = func(*args, **kwargs)
            
            # Buscar la sesión de base de datos en los argumentos
            db = kwargs.get('db')
            if not db:
                for arg in args:
                    if isinstance(arg, Session):
                        db = arg
                        break
            
            if db:
                try:
                    # Generar detalles
                    detalles = ""
                    if detalles_func:
                        detalles = detalles_func(result, *args, **kwargs)
                    elif isinstance(result, dict) and "message" in result:
                        detalles = result["message"]
                    
                    # Crear el log
                    log = SystemLog(
                        accion=accion,
                        detalles=detalles
                        # usuario_id se podría extraer si tuviéramos current_user en kwargs
                    )
                    db.add(log)
                    db.commit()
                except Exception as e:
                    print(f"Error al registrar log: {e}")
                    # No relanzamos para no romper la respuesta principal
            
            return result
        return wrapper
    return decorator
