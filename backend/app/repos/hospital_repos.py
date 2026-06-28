from app.classes.postgre import PostgreSQL
from app.config import Config

def crear_hospital_con_almacenes(nombre_hospital: str, direccion: str, latitud: float, longitud: float):
    db = PostgreSQL()
    try:
        db.create_connection()
        
        # 1. Insertamos el hospital (ya no enviamos nro_almacen)
        query_hospital = f"""
            INSERT INTO {Config.SCHEMA}.t_hospital 
            (nombre_hospital, direccion, latitud, longitud)
            VALUES (%s, %s, %s, %s) RETURNING nro_hospital;
        """
        # Usamos commit=False para no guardar los cambios permanentemente todavía
        resultado_hosp = db.execute_query(query_hospital, (nombre_hospital, direccion, latitud, longitud), fetchone=True, commit=False)
        nro_hospital = resultado_hosp[0]

        # 2. Obtenemos todos los tipos de sangre (O+, O-, A+, etc.)
        query_sangres = f"SELECT id_sangre FROM {Config.SCHEMA}.t_tipo_sangre;"
        tipos_sangre = db.execute_query(query_sangres, fetchall=True, commit=False)

        # 3.CALLE MARICA
        if tipos_sangre:
            query_inventario = f"""
                INSERT INTO {Config.SCHEMA}.t_banco_sanguineo 
                (cant_lts_disponible, id_sangre, nro_hospital)
                VALUES (0.00, %s, %s);
            """
            for tipo in tipos_sangre:
                db.execute_query(query_inventario, (tipo[0], nro_hospital), commit=False)

        # 4. Si todo salió perfecto, guardamos los cambios físicos en la BD
        db.conn.commit()
        return nro_hospital

    except Exception as e:
        # Tolerancia a fallos: Si explota, deshacemos la inserción del hospital
        db.conn.rollback()
        raise ValueError(f'Error al registrar hospital y su inventario: {str(e)}')
    finally:
        db.close_connection()

def obtener_hospitales():
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            SELECT nro_hospital, nombre_hospital, direccion, latitud, longitud,
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

def obtener_hospital_por_id(nro_hospital: int):
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            SELECT nro_hospital, nombre_hospital, direccion, latitud, longitud, 
                   TO_CHAR(fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') as fecha_creacion
            FROM {Config.SCHEMA}.t_hospital
            WHERE nro_hospital = %s;
        """
        resultado = db.execute_query(query, (nro_hospital,), fetchone=True)
        if not resultado:
            return None
        columns = [desc[0] for desc in db.cur.description]
        return dict(zip(columns, resultado))
    except Exception as e:
        raise ValueError(f'Error al obtener el hospital: {str(e)}')
    finally:
        db.close_connection()

def actualizar_hospital(nro_hospital: int, nombre_hospital: str, direccion: str, latitud: float, longitud: float):
    """
    Actualiza datos del hospital. NOTA: nro_almacen es omitido intencionalmente
    para proteger la integridad del banco sanguíneo.
    """
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            UPDATE {Config.SCHEMA}.t_hospital 
            SET nombre_hospital = %s, direccion = %s, latitud = %s, longitud = %s
            WHERE nro_hospital = %s
            RETURNING nro_hospital;
        """
        params = (nombre_hospital, direccion, latitud, longitud, nro_hospital)
        resultado = db.execute_query(query, params, fetchone=True, commit=True)
        return True if resultado else False
    except Exception as e:
        raise ValueError(f'Error al actualizar hospital: {str(e)}')
    finally:
        db.close_connection()

def eliminar_hospital(nro_hospital: int):
    db = PostgreSQL()
    try:
        db.create_connection()
        query = f"""
            DELETE FROM {Config.SCHEMA}.t_hospital 
            WHERE nro_hospital = %s
            RETURNING nro_hospital;
        """
        resultado = db.execute_query(query, (nro_hospital,), fetchone=True, commit=True)
        return True if resultado else False
    except Exception as e:
        raise ValueError(f'Error al eliminar hospital: {str(e)}')
    finally:
        db.close_connection()