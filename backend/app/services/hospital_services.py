from app.repos import hospital_repos

def registrar_hospital(data: dict):
    nombre = data.get('nombre_hospital')
    direccion = data.get('direccion')
    latitud = data.get('latitud')
    longitud = data.get('longitud')
    nro_almacen = data.get('nro_almacen') # Gracias a tu ALTER TABLE, puede ser None

    if not nombre or not direccion or latitud is None or longitud is None:
        raise ValueError("El nombre, la dirección, la latitud y la longitud son campos obligatorios.")

    nuevo_id = hospital_repos.crear_hospital(
        nombre_hospital=nombre,
        direccion=direccion,
        latitud=latitud,
        longitud=longitud,
        nro_almacen=nro_almacen
    )

    if not nuevo_id:
        raise ValueError("No se pudo registrar el hospital en la base de datos.")

    return {
        "success": True,
        "message": "Hospital registrado correctamente.",
        "nro_hospital": nuevo_id
    }

def listar_todos_hospitales():
    hospitales = hospital_repos.obtener_hospitales()
    return {
        "success": True,
        "hospitales": hospitales
    }