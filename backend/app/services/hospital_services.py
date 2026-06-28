from app.repos import hospital_repos

def registrar_hospital(data: dict):
    nombre = data.get('nombre_hospital')
    direccion = data.get('direccion')
    latitud = data.get('latitud')
    longitud = data.get('longitud')

    if not nombre or not direccion or latitud is None or longitud is None:
        raise ValueError("El nombre, la dirección, la latitud y la longitud son campos obligatorios.")

    nuevo_id = hospital_repos.crear_hospital_con_almacenes(
        nombre_hospital=nombre,
        direccion=direccion,
        latitud=latitud,
        longitud=longitud
    )

    if not nuevo_id:
        raise ValueError("No se pudo registrar el hospital en la base de datos.")

    return {
        "success": True,
        "message": "Hospital registrado correctamente con sus almacenes de sangre inicializados en 0.",
        "nro_hospital": nuevo_id
    }

def listar_todos_hospitales():
    hospitales = hospital_repos.obtener_hospitales()
    return {
        "success": True,
        "total": len(hospitales),
        "hospitales": hospitales
    }

def obtener_un_hospital(nro_hospital: int):
    hospital = hospital_repos.obtener_hospital_por_id(nro_hospital)
    if not hospital:
        raise ValueError("El hospital solicitado no existe.")
    return {
        "success": True,
        "hospital": hospital
    }

def modificar_hospital(nro_hospital: int, data: dict):
    nombre = data.get('nombre_hospital')
    direccion = data.get('direccion')
    latitud = data.get('latitud')
    longitud = data.get('longitud')

    if not nombre or not direccion or latitud is None or longitud is None:
        raise ValueError("Faltan campos obligatorios para actualizar (nombre, dirección, lat, lng).")

    actualizado = hospital_repos.actualizar_hospital(
        nro_hospital=nro_hospital,
        nombre_hospital=nombre,
        direccion=direccion,
        latitud=latitud,
        longitud=longitud
    )

    if not actualizado:
        raise ValueError("No se pudo actualizar el hospital. Es posible que no exista.")

    return {
        "success": True,
        "message": "Datos del hospital actualizados correctamente."
    }

def borrar_hospital(nro_hospital: int):
    eliminado = hospital_repos.eliminar_hospital(nro_hospital)
    if not eliminado:
        raise ValueError("No se pudo eliminar el hospital. Es posible que no exista.")
    return {
        "success": True,
        "message": "Hospital eliminado permanentemente del sistema."
    }