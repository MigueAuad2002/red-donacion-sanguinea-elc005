from app.classes.postgre import PostgreSQL
from app.config import Config

def crear_hospital(nombre_hospital: str, direccion: str, latitud: float, longitud: float, nro_almacen: int = None):
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            INSERT INTO {Config.SCHEMA}.t_hospital 
            (nombre_hospital, direccion, latitud, longitud, nro_almacen)
            VALUES (%s, %s, %s, %s, %s) RETURNING nro_hospital;
        """
        params = (nombre_hospital, direccion, latitud, longitud, nro_almacen)
        resultado = db.execute_query(query, params, fetchone=True, commit=True)
        
        return resultado[0] if resultado else None
        
    except Exception as e:
        raise ValueError(f'Error al registrar hospital en BD: {str(e)}')
    finally:
        db.close_connection()

def obtener_hospitales():
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            SELECT nro_hospital, nombre_hospital, direccion, latitud, longitud, nro_almacen,
                   TO_CHAR(fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') as fecha_creacion
            FROM {Config.SCHEMA}.t_hospital
            ORDER BY nombre_hospital ASC;
        """
        resultado = db.execute_query(query, fetchall=True)
        
        if not resultado:
            return []
            
        columns = [desc[0] for desc in db.cur.description]
        return [dict(zip(columns, row)) for row in resultado]
        
    except Exception as e:
        raise ValueError(f'Error al obtener el listado de hospitales: {str(e)}')
    finally:
        db.close_connection()