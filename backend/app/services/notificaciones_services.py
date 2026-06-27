from app.classes.socketmanager import manager
from app.repos import notificaciones_repos

def _get_donantes_compatibles(tipo_receptor: str, rh_receptor: str):
    """
    Algoritmo de Matching: Determina qué donantes pueden darle sangre a un receptor específico.
    """
    compatibilidad = {
        'O-': [('O', '-')],
        'O+': [('O', '+'), ('O', '-')],
        'A-': [('A', '-'), ('O', '-')],
        'A+': [('A', '+'), ('A', '-'), ('O', '+'), ('O', '-')],
        'B-': [('B', '-'), ('O', '-')],
        'B+': [('B', '+'), ('B', '-'), ('O', '+'), ('O', '-')],
        'AB-': [('AB', '-'), ('A', '-'), ('B', '-'), ('O', '-')],
        'AB+': [('AB', '+'), ('AB', '-'), ('A', '+'), ('A', '-'), ('B', '+'), ('B', '-'), ('O', '+'), ('O', '-')]
    }

    llave = f"{tipo_receptor.upper()}{rh_receptor}"
    return compatibilidad.get(llave, [])

async def procesar_alerta_emergencia(data_emergencia: dict):
    # 1. Extracción de datos del requerimiento médico
    hospital = data_emergencia.get('hospital', 'un hospital de la red')
    tipo_receptor = data_emergencia.get('tipo_sangre')
    rh_receptor = data_emergencia.get('factor_rh')
    nro_emergencia = data_emergencia.get('nro_emergencia')

    if not tipo_receptor or not rh_receptor:
        raise ValueError("Se requiere el tipo de sangre y factor RH del receptor para el emparejamiento.")

    # 2. Matching Biológico (Identificamos a quién buscar en la BD)
    tuplas_compatibles = _get_donantes_compatibles(tipo_receptor, rh_receptor)
    usuarios_ids = notificaciones_repos.obtener_usuarios_compatibles(tuplas_compatibles)

    titulo = "🩸 ¡Emergencia Médica Compatibilidad Confirmada!"
    cuerpo = f"Se tiene una emergencia para un paciente, la donacion sera en el {hospital}, se requiere urgentemente donantes para un paciente {tipo_receptor}{rh_receptor}. Tú eres compatible."

    notificados_online = 0
    guardados_bd = 0

    # 3. Guardado Físico y Envío Push a la sala del usuario
    for nro_usuario in usuarios_ids:
        # A) Insertar en BD para trazabilidad
        id_noti = notificaciones_repos.guardar_notificacion(
            titulo=titulo, 
            cuerpo=cuerpo, 
            tipo_referencia='URGENCIA_SANGRE', 
            nro_emergencia=nro_emergencia, 
            nro_usuario=nro_usuario
        )

        if id_noti:
            guardados_bd += 1
            
            # B) Empujar por el túnel si el usuario tiene la app abierta
            if nro_usuario in manager.active_connections:
                mensaje_push = {
                    "id_notificacion": id_noti,
                    "tipo": "ALERTA_EMERGENCIA",
                    "titulo": titulo,
                    "cuerpo": cuerpo,
                    "nro_emergencia": nro_emergencia,
                    "leido": "NO_LEIDO",
                    "data_extra": data_emergencia
                }
                await manager.send_personal_message(mensaje_push, nro_usuario)
                notificados_online += 1

    return {
        "success": True,
        "message": "Algoritmo de emparejamiento ejecutado con éxito.",
        "estadisticas": {
            "donantes_encontrados": len(usuarios_ids),
            "alertas_guardadas_bd": guardados_bd,
            "alertas_push_enviadas": notificados_online
        }
    }

def obtener_mis_notificaciones(nro_usuario: int):
    lista = notificaciones_repos.obtener_notificaciones_usuario(nro_usuario)
    return {
        'success': True,
        'notificaciones': lista
    }

def actualizar_estado_notificacion(id_notificacion: int, nro_usuario: int):
    actualizado = notificaciones_repos.marcar_como_leida(id_notificacion, nro_usuario)
    if not actualizado:
        raise ValueError('La notificación no existe o no tienes permisos para modificarla.')
    return {
        'success': True,
        'message': 'Notificación marcada como leída exitosamente.'
    }