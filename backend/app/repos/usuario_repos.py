from app.classes.postgre import PostgreSQL
from app.config import Config


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