from app.classes.postgre import PostgreSQL
from app.config import Config


def obtener_perfil(nro_usuario):
    db=PostgreSQL()

    try:
        db.create_connection()

        query=f"""
            SELECT A.NRO_USUARIO,A.NOMBRE_COMPLETO,A.CI,A.FECHA_NACIMIENTO,A.GENERO,A.TELEFONO,A.CORREO,A.ESTADO,
            A.FECHA_REGISTRO,B.NOMBRE_ROL,C.TIPO_SANGRE,C.FACTOR_RH
            FROM {Config.SCHEMA}.T_USUARIO A
            INNER JOIN {Config.SCHEMA}.T_ROL B ON A.ID_ROL=B.ID_ROL
            INNER JOIN {Config.SCHEMA}.T_TIPO_{Config.SCHEMA} C ON C.ID_SANGRE=A.ID_SANGRE
            WHERE A.NRO_USUARIO=%s;
        """

        result=db.execute_query(query,(nro_usuario,),fetchone=True)

        if not result:
            return None

        columns=[]
        for column in db.cur.description:
            columns.append(column[0])

        data=dict(zip(columns,result))

        return data

    except Exception as e:
        raise ValueError(f'ERROR: {str(e)}')
    finally:
        db.close_connection()


def actualizar_perfil(nro_usuario: int, data: dict):
    db = PostgreSQL()

    try:
        db.create_connection()

        campos_permitidos = ['telefono', 'correo']
        set_clause = []
        valores = []

        for campo in campos_permitidos:
            if campo in data and data[campo] is not None:
                set_clause.append(f"{campo} = %s")
                valores.append(data[campo])

        if not set_clause:
            return False

        valores.append(nro_usuario)
        query_set = ", ".join(set_clause)

        query = f"""
            UPDATE {Config.SCHEMA}.T_USUARIO 
            SET {query_set}
            WHERE NRO_USUARIO = %s
        """

        db.execute_query(query, tuple(valores), commit=True)
        return True

    except Exception as e:
        raise ValueError(f'ERROR DE BASE DE DATOS: {str(e)}')
    finally:
        db.close_connection()