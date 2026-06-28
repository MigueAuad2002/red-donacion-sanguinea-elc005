from app.classes.postgre import PostgreSQL
from app.config import Config

def crear_emergencia(latitud: float, longitud: float, prioridad: str, diagnostico: str, nro_usuario_receptor: int, nro_hospital: int):
    db = PostgreSQL()
    try:
        db.create_connection()
        # nro_estado = 1 (BUSCANDO_DONANTES)
        query = f"""
            INSERT INTO {Config.SCHEMA}.t_emergencia 
            (latitud, longitud, prioridad, diagnostico, nro_usuario_receptor, nro_estado, nro_hospital)
            VALUES (%s, %s, %s, %s, %s, 1, %s) 
            RETURNING nro_emergencia;
        """
        params = (latitud, longitud, prioridad, diagnostico, nro_usuario_receptor, nro_hospital)
        resultado = db.execute_query(query, params, fetchone=True, commit=True)
        return resultado[0] if resultado else None
    except Exception as e:
        raise ValueError(f'Error al crear emergencia en BD: {str(e)}')
    finally:
        db.close_connection()

def obtener_datos_alerta(nro_emergencia: int):
    """Obtiene los datos cruzados del hospital y el paciente para la alerta push."""
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            SELECT h.nombre_hospital, ts.tipo_sangre, ts.factor_rh, e.nro_usuario_receptor
            FROM {Config.SCHEMA}.t_emergencia e
            INNER JOIN {Config.SCHEMA}.t_hospital h ON e.nro_hospital = h.nro_hospital
            INNER JOIN {Config.SCHEMA}.t_usuario u ON e.nro_usuario_receptor = u.nro_usuario
            INNER JOIN {Config.SCHEMA}.t_tipo_sangre ts ON u.id_sangre = ts.id_sangre
            WHERE e.nro_emergencia = %s;
        """
        resultado = db.execute_query(query, (nro_emergencia,), fetchone=True)
        if not resultado:
            return None
            
        columns = [desc[0] for desc in db.cur.description]
        return dict(zip(columns, resultado))
    except Exception as e:
        raise ValueError(f'Error al obtener datos de alerta: {str(e)}')
    finally:
        db.close_connection()

def aceptar_emergencia(nro_emergencia: int, nro_usuario_donador: int):
    """Actualiza la emergencia solo si está en estado 1 (Buscando)."""
    db = PostgreSQL()
    try:
        db.create_connection()
        # Cambiamos nro_estado a 2 (EN_PROCESO) y registramos la fecha y el donador
        query = f"""
            UPDATE {Config.SCHEMA}.t_emergencia 
            SET nro_estado = 2, 
                nro_usuario_donador = %s, 
                fecha_aceptacion = CURRENT_TIMESTAMP
            WHERE nro_emergencia = %s AND nro_estado = 1
            RETURNING nro_emergencia;
        """
        resultado = db.execute_query(query, (nro_usuario_donador, nro_emergencia), fetchone=True, commit=True)
        return True if resultado else False
    except Exception as e:
        raise ValueError(f'Error al aceptar emergencia: {str(e)}')
    finally:
        db.close_connection()

def guardar_evidencia(tipo_archivo: str, url_archivo: str, nro_emergencia: int):
    """
    Inserta la evidencia médica. 
    Para fines prácticos, 'url_archivo' almacenará la cadena completa en Base64.
    """
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            INSERT INTO {Config.SCHEMA}.t_evidencia (tipo_archivo, url_archivo, nro_emergencia)
            VALUES (%s, %s, %s) RETURNING id_evidencia;
        """
        params = (tipo_archivo, url_archivo, nro_emergencia)
        resultado = db.execute_query(query, params, fetchone=True, commit=True)
        
        return resultado[0] if resultado else None
    except Exception as e:
        raise ValueError(f'Error al guardar la evidencia en la BD: {str(e)}')
    finally:
        db.close_connection()


def obtener_emergencias_globales():
    """
    Retorna TODAS las emergencias del sistema con sus datos cruzados.
    Ideal para el mapa principal o vista de administrador.
    """
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            SELECT e.nro_emergencia, e.latitud, e.longitud, e.prioridad, e.diagnostico,
                   TO_CHAR(e.fecha_inicio, 'YYYY-MM-DD HH24:MI:SS') as fecha_inicio,
                   TO_CHAR(e.fecha_aceptacion, 'YYYY-MM-DD HH24:MI:SS') as fecha_aceptacion,
                   h.nombre_hospital, h.direccion,
                   ee.nombre_estado, ee.nro_estado
            FROM {Config.SCHEMA}.t_emergencia e
            INNER JOIN {Config.SCHEMA}.t_hospital h ON e.nro_hospital = h.nro_hospital
            INNER JOIN {Config.SCHEMA}.t_estado_emergencia ee ON e.nro_estado = ee.nro_estado
            ORDER BY e.fecha_inicio DESC;
        """
        resultado = db.execute_query(query, fetchall=True)
        
        if not resultado:
            return []
            
        columns = [desc[0] for desc in db.cur.description]
        return [dict(zip(columns, row)) for row in resultado]
        
    except Exception as e:
        raise ValueError(f'Error al obtener emergencias globales: {str(e)}')
    finally:
        db.close_connection()


def obtener_emergencias_personales(nro_usuario: int):
    """
    Retorna las emergencias donde el usuario es el RECEPTOR (pidió ayuda) 
    o el DONADOR (brindó ayuda), clasificando su rol dinámicamente.
    """
    db = PostgreSQL()
    try:
        db.create_connection()
        # Pasamos el nro_usuario 4 veces para el CASE y el WHERE
        params = (nro_usuario, nro_usuario, nro_usuario, nro_usuario)
        
        query = f"""
            SELECT e.nro_emergencia, e.prioridad, e.diagnostico,
                   TO_CHAR(e.fecha_inicio, 'YYYY-MM-DD HH24:MI:SS') as fecha_inicio,
                   h.nombre_hospital,
                   ee.nombre_estado, ee.nro_estado,
                   CASE
                       WHEN e.nro_usuario_receptor = %s THEN 'SOLICITANTE'
                       WHEN e.nro_usuario_donador = %s THEN 'DONANTE'
                   END as mi_rol
            FROM {Config.SCHEMA}.t_emergencia e
            INNER JOIN {Config.SCHEMA}.t_hospital h ON e.nro_hospital = h.nro_hospital
            INNER JOIN {Config.SCHEMA}.t_estado_emergencia ee ON e.nro_estado = ee.nro_estado
            WHERE e.nro_usuario_receptor = %s OR e.nro_usuario_donador = %s
            ORDER BY e.fecha_inicio DESC;
        """
        resultado = db.execute_query(query, params, fetchall=True)
        
        if not resultado:
            return []
            
        columns = [desc[0] for desc in db.cur.description]
        return [dict(zip(columns, row)) for row in resultado]
        
    except Exception as e:
        raise ValueError(f'Error al obtener el historial personal de emergencias: {str(e)}')
    finally:
        db.close_connection()


def obtener_sangre_usuario(nro_usuario: int):
    """Obtiene el tipo de sangre y factor RH del usuario autenticado."""
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            SELECT ts.tipo_sangre, ts.factor_rh 
            FROM {Config.SCHEMA}.t_usuario u
            INNER JOIN {Config.SCHEMA}.t_tipo_sangre ts ON u.id_sangre = ts.id_sangre
            WHERE u.nro_usuario = %s;
        """
        resultado = db.execute_query(query, (nro_usuario,), fetchone=True)
        if not resultado: return None
        return {'tipo_sangre': resultado[0], 'factor_rh': resultado[1]}
    except Exception as e:
        raise ValueError(f'Error al obtener la sangre del usuario: {str(e)}')
    finally:
        db.close_connection()

def obtener_emergencias_compatibles(tuplas_receptor_compatibles: list, nro_usuario: int):
    """Busca emergencias en estado 1 (Buscando) que hagan match con la sangre y no sean propias."""
    if not tuplas_receptor_compatibles:
        return []
        
    db = PostgreSQL()
    try:
        db.create_connection()
        # Construimos el OR dinámico para emparejar
        condiciones = " OR ".join(["(ts.tipo_sangre = %s AND ts.factor_rh = %s)"] * len(tuplas_receptor_compatibles))
        params = []
        for tipo, rh in tuplas_receptor_compatibles:
            params.extend([tipo, rh])
            
        params.append(nro_usuario) # Para el filtro de exclusión
        
        query = f"""
            SELECT e.nro_emergencia, e.latitud, e.longitud, e.prioridad, e.diagnostico,
                   TO_CHAR(e.fecha_inicio, 'YYYY-MM-DD HH24:MI:SS') as fecha_inicio,
                   h.nombre_hospital, h.direccion,
                   ts.tipo_sangre as sangre_receptor, ts.factor_rh as rh_receptor
            FROM {Config.SCHEMA}.t_emergencia e
            INNER JOIN {Config.SCHEMA}.t_hospital h ON e.nro_hospital = h.nro_hospital
            INNER JOIN {Config.SCHEMA}.t_usuario u ON e.nro_usuario_receptor = u.nro_usuario
            INNER JOIN {Config.SCHEMA}.t_tipo_sangre ts ON u.id_sangre = ts.id_sangre
            WHERE e.nro_estado = 1 
              AND ({condiciones})
              AND e.nro_usuario_receptor != %s
            ORDER BY e.fecha_inicio DESC;
        """
        resultado = db.execute_query(query, tuple(params), fetchall=True)
        
        if not resultado: return []
        columns = [desc[0] for desc in db.cur.description]
        return [dict(zip(columns, row)) for row in resultado]
        
    except Exception as e:
        raise ValueError(f'Error al obtener emergencias compatibles: {str(e)}')
    finally:
        db.close_connection()