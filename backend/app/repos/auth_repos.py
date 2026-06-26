from app.classes.postgre import PostgreSQL
from app.config import Config

def obtener_usuario_ci(ci:str):
    db=PostgreSQL()

    try:
        db.create_connection()

        query=f"""
            SELECT a.password_hash,a.nro_usuario,a.nombre_completo,c.tipo_sangre,c.factor_rh,
            a.genero,TO_CHAR(a.fecha_nacimiento,'YYYY-MM-DD') AS fecha_nacimiento,b.nombre_rol
            FROM {Config.SCHEMA}.T_USUARIO a
            INNER JOIN {Config.SCHEMA}.T_ROL b ON a.id_rol=b.id_rol
            INNER JOIN {Config.SCHEMA}.T_TIPO_SANGRE c ON a.id_sangre=c.id_sangre
            WHERE a.ci=%s AND a.estado=TRUE
        """

        resultado=db.execute_query(query,(ci,),fetchone=True)

        if not resultado:
            return None
        
        columns=[]
        for column in db.cur.description:
            columns.append(column[0])
        
        data=dict(zip(columns,resultado))
        print(data)

        return data
    except Exception as e:
        raise ValueError(f'ERROR: {str(e)}')
    finally:
        db.close_connection()

def insertar_usuario(data: dict):
    db = PostgreSQL()

    try:
        db.create_connection()

        query = f"""
            INSERT INTO {Config.SCHEMA}.T_USUARIO 
            (NOMBRE_COMPLETO, PASSWORD_HASH, CI, FECHA_NACIMIENTO, GENERO, TELEFONO, CORREO, ID_ROL, ID_SANGRE)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING nro_usuario;
        """
        
        #PREPARAR LA TUPLA DE DATOS PARA LA INSERCION
        params = (
            data['nombre_completo'].upper(),
            data['password_hash'],
            data['ci'],
            data['fecha_nacimiento'],
            data['genero'].upper(),
            data.get('telefono'),
            data.get('correo'),
            data.get('id_rol', 1), #POR DEFECTO ROL 1(CIUDADANO)
            data['id_sangre']
        )

        resultado = db.execute_query(query, params, fetchone=True, commit=True)

        return resultado[0] if resultado else None
        
    except Exception as e:
        raise ValueError(f'ERROR DE BASE DE DATOS: {str(e)}')
    finally:
        db.close_connection()