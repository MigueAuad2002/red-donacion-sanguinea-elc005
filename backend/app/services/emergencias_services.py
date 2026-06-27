# app/services/emergencias_services.py
from app.repos import emergencias_repos
from app.services import notificaciones_services

async def registrar_nueva_emergencia(data: dict, nro_usuario_receptor: int):
    # 1. Validaciones básicas de infraestructura
    latitud = data.get('latitud')
    longitud = data.get('longitud')
    nro_hospital = data.get('nro_hospital')

    if not latitud or not longitud or not nro_hospital:
        raise ValueError("Latitud, longitud y el ID del hospital son obligatorios.")

    prioridad = data.get('prioridad', 'MEDIA')
    diagnostico = data.get('diagnostico', 'No especificado')
    
    # Extraemos el arreglo de evidencias enviadas desde el frontend
    # Estructura esperada: [{"tipo_archivo": "image/png", "base64": "data:image/png;base64,..."}, ...]
    listado_evidencias = data.get('evidencias', []) 

    # 2. Inserción de la Emergencia
    nro_emergencia = emergencias_repos.crear_emergencia(
        latitud=latitud, 
        longitud=longitud, 
        prioridad=prioridad, 
        diagnostico=diagnostico, 
        nro_usuario_receptor=nro_usuario_receptor, 
        nro_hospital=nro_hospital
    )

    if not nro_emergencia:
        raise ValueError("No se pudo registrar la emergencia.")

    # 3. Procesamiento y guardado de Evidencias en Base64
    evidencias_guardadas = 0
    for ev in listado_evidencias:
        tipo = ev.get('tipo_archivo', 'image/jpeg')
        base64_str = ev.get('base64')
        
        if base64_str:
            id_evidencia = emergencias_repos.guardar_evidencia(
                tipo_archivo=tipo,
                url_archivo=base64_str,  # El string base64 se almacena directamente aquí
                nro_emergencia=nro_emergencia
            )
            if id_evidencia:
                evidencias_guardadas += 1

    # 4. Obtener datos cruzados y disparar el Algoritmo de Matching por WebSockets
    info_alerta = emergencias_repos.obtener_datos_alerta(nro_emergencia)
    
    if info_alerta:
        payload_notificacion = {
            "nro_emergencia": nro_emergencia,
            "hospital": info_alerta['nombre_hospital'],
            "tipo_sangre": info_alerta['tipo_sangre'],
            "factor_rh": info_alerta['factor_rh'],
            "latitud": latitud,
            "longitud": longitud,
            "tiene_evidencias": evidencias_guardadas > 0
        }
        await notificaciones_services.procesar_alerta_emergencia(payload_notificacion)

    return {
        "success": True,
        "message": "Emergencia registrada, evidencias procesadas e inicio de emparejamiento completado.",
        "nro_emergencia": nro_emergencia,
        "evidencias_almacenadas": evidencias_guardadas
    }


def donante_acepta_emergencia(nro_emergencia: int, nro_usuario_donador: int):
    # Regla de negocio: Un usuario no puede donarse sangre a sí mismo
    info_alerta = emergencias_repos.obtener_datos_alerta(nro_emergencia)
    if not info_alerta:
        raise ValueError("La emergencia solicitada no existe.")
        
    if info_alerta['nro_usuario_receptor'] == nro_usuario_donador:
        raise ValueError("Operación no permitida: No puedes aceptar tu propia solicitud de emergencia.")

    # Ejecutamos la actualización
    exito = emergencias_repos.aceptar_emergencia(nro_emergencia, nro_usuario_donador)
    
    if not exito:
        raise ValueError("No se pudo aceptar la emergencia. Es posible que ya haya sido tomada por otro donante o cancelada.")

    #TODO en el futuro: Notificar vía WS al paciente receptor que alguien ya va en camino.

    return {
        "success": True,
        "message": "¡Gracias! Has aceptado la emergencia. Dirígete al hospital asignado."
    }


def listar_todas_las_emergencias():
    lista = emergencias_repos.obtener_emergencias_globales()
    return {
        "success": True,
        "total": len(lista),
        "emergencias": lista
    }

def listar_mis_emergencias(nro_usuario: int):
    lista = emergencias_repos.obtener_emergencias_personales(nro_usuario)
    return {
        "success": True,
        "total": len(lista),
        "emergencias": lista
    }