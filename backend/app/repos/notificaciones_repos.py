from app.classes.postgre import PostgreSQL
from app.config import Config

def marcar_como_leida(id_notificacion: int, nro_usuario: int):
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            UPDATE {Config.SCHEMA}.t_notificacion 
            SET leido = 'LEIDO' 
            WHERE id_notificacion = %s AND nro_usuario = %s
            RETURNING id_notificacion;
        """
        resultado = db.execute_query(query, (id_notificacion, nro_usuario), fetchone=True, commit=True)
        return True if resultado else False
    except Exception as e:
        raise ValueError(f'Error al actualizar BD: {str(e)}')
    finally:
        db.close_connection()

def guardar_notificacion(titulo: str, cuerpo: str, tipo_referencia: str, nro_emergencia: int, nro_usuario: int):
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            INSERT INTO {Config.SCHEMA}.t_notificacion 
            (titulo, cuerpo, tipo_referencia, leido, nro_emergencia, nro_usuario)
            VALUES (%s, %s, %s, 'NO_LEIDO', %s, %s) RETURNING id_notificacion;
        """
        resultado = db.execute_query(query, (titulo, cuerpo, tipo_referencia, nro_emergencia, nro_usuario), fetchone=True, commit=True)
        return resultado[0] if resultado else None
    except Exception as e:
        raise ValueError(f'Error al registrar notificación en BD: {str(e)}')
    finally:
        db.close_connection()

def obtener_notificaciones_usuario(nro_usuario: int):
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            SELECT id_notificacion, titulo, cuerpo, tipo_referencia, leido, 
                   TO_CHAR(fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') as fecha_creacion, nro_emergencia
            FROM {Config.SCHEMA}.t_notificacion
            WHERE nro_usuario = %s
            ORDER BY fecha_creacion DESC LIMIT 50;
        """
        resultado = db.execute_query(query, (nro_usuario,), fetchall=True)
        if not resultado:
            return []
            
        columns = [desc[0] for desc in db.cur.description]
        return [dict(zip(columns, row)) for row in resultado]
    except Exception as e:
        raise ValueError(f'Error al obtener notificaciones: {str(e)}')
    finally:
        db.close_connection()

def obtener_usuarios_compatibles(compatibles: list):
    """
    Recibe una lista de tuplas con los tipos y factores compatibles. Ej: [('O', '+'), ('O', '-')]
    """
    if not compatibles:
        return []
        
    db = PostgreSQL()
    try:
        db.create_connection()
        # Construimos un bloque OR dinámico para emparejar sangre y factor
        condiciones = " OR ".join(["(ts.tipo_sangre = %s AND ts.factor_rh = %s)"] * len(compatibles))
        params = []
        for tipo, rh in compatibles:
            params.extend([tipo, rh])

        query = f"""
            SELECT u.nro_usuario
            FROM {Config.SCHEMA}.t_usuario u
            INNER JOIN {Config.SCHEMA}.t_tipo_sangre ts ON u.id_sangre = ts.id_sangre
            WHERE u.estado = TRUE AND ({condiciones});
        """
        resultado = db.execute_query(query, tuple(params), fetchall=True)
        return [row[0] for row in resultado] if resultado else []
    except Exception as e:
        raise ValueError(f'Error de búsqueda de compatibilidad: {str(e)}')
    finally:
        db.close_connection()