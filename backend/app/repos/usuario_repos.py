from app.classes.postgre import PostgreSQL
from app.config import Config
import hashlib




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



def registrar_usuario(data: dict):
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
            data.get('id_rol'), #POR DEFECTO ROL 1(CIUDADANO)
            data['id_sangre']
        )

        resultado = db.execute_query(query, params, fetchone=True, commit=True)

        return resultado[0] if resultado else None
        
    except Exception as e:
        raise ValueError(f'ERROR DE BASE DE DATOS: {str(e)}')
    finally:
        db.close_connection()



def listar_usuarios():
    db = PostgreSQL()
    try:
        db.create_connection()

        query = f"""
            SELECT 
                a.nro_usuario,
                a.nombre_completo,
                a.ci::text as ci,
                to_char(a.fecha_nacimiento,'YYYY-MM-DD') as fecha_nacimiento,
                a.genero,
                a.telefono,
                a.correo,
                a.estado,
               b.nombre_rol,
               c.tipo_sangre,
               c.factor_rh
			   FROM {Config.SCHEMA}.T_USUARIO a 
			inner join {Config.SCHEMA}.t_rol b on a.id_rol=b.id_Rol
			inner join {Config.SCHEMA}.t_tipo_sangre c on a.id_sangre=c.id_Sangre
			WHERE estado = TRUE
        """

        rows = db.execute_query(query, fetchall=True)

        
        usuarios = [
            {
                "nro_usuario": r[0],
                "nombre_completo": r[1],
                "ci": r[2],
                "fecha_nacimiento": r[3],
                "genero": r[4],
                "telefono": r[5],
                "correo": r[6],
                "estado": r[7],
                "nombre_rol": r[8],
                "tipo_sangre": r[9],
                "factor_rh": r[10],
            }
            for r in rows
        ]

        return usuarios

    finally:
        db.close_connection()


def obtener_usuario(id):
    db = PostgreSQL()
    try:
        db.create_connection()

        query = f"""
            SELECT * FROM {Config.SCHEMA}.T_USUARIO
            WHERE nro_usuario = %s AND estado = TRUE
        """

        return db.execute_query(query, (id,), fetchone=True)

    finally:
        db.close_connection()


def actualizar_usuario(id, data):
    db = PostgreSQL()
    try:
        db.create_connection()

        query = f"""
            UPDATE {Config.SCHEMA}.T_USUARIO
            SET nombre_completo=%s, telefono=%s, correo=%s
            WHERE nro_usuario=%s
            RETURNING nro_usuario
        """

        return db.execute_query(
            query,
            (
                data.get("nombre_completo"),
                data.get("telefono"),
                data.get("correo"),
                id
            ),
            fetchone=True,
            commit=True
        )

    finally:
        db.close_connection()


def eliminar_usuario(id):
    db = PostgreSQL()
    try:
        db.create_connection()

        query = f"""
            UPDATE {Config.SCHEMA}.T_USUARIO
            SET estado = FALSE
            WHERE nro_usuario = %s
            RETURNING nro_usuario
        """

        return db.execute_query(query, (id,), fetchone=True, commit=True)

    finally:
        db.close_connection()