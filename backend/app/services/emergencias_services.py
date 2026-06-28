from app.repos import emergencias_repos
from app.services import notificaciones_services
from app.classes.socketmanager import manager
from app.repos import notificaciones_repos

async def registrar_nueva_emergencia(data: dict, nro_usuario_receptor: int):
    latitud = data.get('latitud')
    longitud = data.get('longitud')
    nro_hospital = data.get('nro_hospital')

    if not latitud or not longitud or not nro_hospital:
        raise ValueError("Latitud, longitud y el ID del hospital son obligatorios.")

    prioridad = data.get('prioridad', 'MEDIA')
    diagnostico = data.get('diagnostico', 'No especificado')
    listado_evidencias = data.get('evidencias', []) 

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

    evidencias_guardadas = 0
    for ev in listado_evidencias:
        tipo = ev.get('tipo_archivo', 'image/jpeg')
        base64_str = ev.get('base64')
        if base64_str:
            id_evidencia = emergencias_repos.guardar_evidencia(
                tipo_archivo=tipo,
                url_archivo=base64_str,
                nro_emergencia=nro_emergencia
            )
            if id_evidencia:
                evidencias_guardadas += 1

    info_alerta = emergencias_repos.obtener_datos_alerta(nro_emergencia)
    
    if info_alerta:
        payload_notificacion = {
            "nro_emergencia": nro_emergencia,
            "hospital": info_alerta['nombre_hospital'],
            "tipo_sangre": info_alerta['tipo_sangre'],
            "factor_rh": info_alerta['factor_rh'],
            "latitud": latitud,
            "longitud": longitud,
            "tiene_evidencias": evidencias_guardadas > 0,
            "nro_usuario_receptor": nro_usuario_receptor  # PASAMOS EL RECEPTOR AL SERVICIO
        }
        await notificaciones_services.procesar_alerta_emergencia(payload_notificacion)

    return {
        "success": True,
        "message": "Emergencia registrada, evidencias procesadas e inicio de emparejamiento completado.",
        "nro_emergencia": nro_emergencia,
        "evidencias_almacenadas": evidencias_guardadas
    }

async def donante_acepta_emergencia(nro_emergencia: int, nro_usuario_donador: int):
    info_alerta = emergencias_repos.obtener_datos_alerta(nro_emergencia)
    if not info_alerta:
        raise ValueError("La emergencia solicitada no existe.")
        
    nro_receptor = info_alerta['nro_usuario_receptor']
        
    if nro_receptor == nro_usuario_donador:
        raise ValueError("Operación no permitida: No puedes aceptar tu propia solicitud de emergencia.")

    exito = emergencias_repos.aceptar_emergencia(nro_emergencia, nro_usuario_donador)
    
    if not exito:
        raise ValueError("No se pudo aceptar la emergencia. Es posible que ya haya sido tomada por otro donante o cancelada.")

    # NOTIFICACIÓN DE VUELTA AL PACIENTE (RECEPTOR)
    titulo_resp = "¡Donante en camino! 🩸"
    cuerpo_resp = f"Un donante ha aceptado tu solicitud y se dirige al {info_alerta['nombre_hospital']}."
    
    id_noti = notificaciones_repos.guardar_notificacion(
        titulo=titulo_resp, 
        cuerpo=cuerpo_resp, 
        tipo_referencia='DONANTE_EN_CAMINO',
        nro_emergencia=nro_emergencia, 
        nro_usuario=nro_receptor
    )

    if id_noti and (nro_receptor in manager.active_connections):
        await manager.send_personal_message({
            "id_notificacion": id_noti,
            "tipo": "DONANTE_EN_CAMINO",
            "titulo": titulo_resp,
            "cuerpo": cuerpo_resp
        }, nro_receptor)

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

def _get_receptores_compatibles_con_donante(tipo_donante: str, rh_donante: str):
    compatibilidad = {
        'O-': [('O','-'), ('O','+'), ('A','-'), ('A','+'), ('B','-'), ('B','+'), ('AB','-'), ('AB','+')],
        'O+': [('O','+'), ('A','+'), ('B','+'), ('AB','+')],
        'A-': [('A','-'), ('A','+'), ('AB','-'), ('AB','+')],
        'A+': [('A','+'), ('AB','+')],
        'B-': [('B','-'), ('B','+'), ('AB','-'), ('AB','+')],
        'B+': [('B','+'), ('AB','+')],
        'AB-': [('AB','-'), ('AB','+')],
        'AB+': [('AB','+')]
    }
    llave = f"{tipo_donante.upper()}{rh_donante}"
    return compatibilidad.get(llave, [])

def listar_emergencias_feed_compatibles(nro_usuario: int):
    # 1. Obtener tipo de sangre de este usuario
    sangre_user = emergencias_repos.obtener_sangre_usuario(nro_usuario)
    if not sangre_user:
        raise ValueError("No se pudo determinar tu tipo de sangre.")

    # 2. Descubrir a quiénes puede donarle
    tuplas_compatibles = _get_receptores_compatibles_con_donante(
        sangre_user['tipo_sangre'], 
        sangre_user['factor_rh']
    )

    # 3. Buscar en la base de datos las emergencias abiertas compatibles
    lista = emergencias_repos.obtener_emergencias_compatibles(tuplas_compatibles, nro_usuario)
    
    return {
        "success": True,
        "total": len(lista),
        "mi_sangre": f"{sangre_user['tipo_sangre']}{sangre_user['factor_rh']}",
        "emergencias": lista
    }