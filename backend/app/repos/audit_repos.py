from app.classes.postgre import PostgreSQL
from app.config import Config
import hashlib


def obtener_bitacora():
    db = PostgreSQL()
    try:
        db.create_connection()

        query = f"""
          
	select a.nro_log,
	a.accion,
	a.descripcion,
	a.fecha_hora,
	b.nombre_completo
	from sangre.t_bitacora a 
	inner join sangre.t_usuario b  on a.nro_usuario=b.nro_usuario 
        """

        rows = db.execute_query(query, fetchall=True)

        
        bitacora = [
            {
                "nro_log": r[0],
                "accion": r[1],
                "descripcion": r[2],
                "fecha_hora": r[3],
                "nombre_completo": r[4],
            }
            for r in rows
        ]

        return bitacora

    finally:
        db.close_connection()