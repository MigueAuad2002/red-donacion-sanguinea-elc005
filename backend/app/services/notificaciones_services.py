from app.classes.socketmanager import manager
from app.repos import notificaciones_repos

def _get_donantes_compatibles(tipo_receptor: str, rh_receptor: str):
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
    hospital = data_emergencia.get('hospital', 'un hospital de la red')
    tipo_receptor = data_emergencia.get('tipo_sangre')
    rh_receptor = data_emergencia.get('factor_rh')
    nro_emergencia = data_emergencia.get('nro_emergencia')
    nro_receptor = data_emergencia.get('nro_usuario_receptor') # EXTRAEMOS AL RECEPTOR

    if not tipo_receptor or not rh_receptor:
        raise ValueError("Se requiere el tipo de sangre y factor RH del receptor para el emparejamiento.")

    tuplas_compatibles = _get_donantes_compatibles(tipo_receptor, rh_receptor)
    usuarios_ids = notificaciones_repos.obtener_usuarios_compatibles(tuplas_compatibles)

    # REGLA DE CALIDAD: Eliminar al creador de la emergencia si es compatible consigo mismo
    if nro_receptor in usuarios_ids:
        usuarios_ids.remove(nro_receptor)

    titulo = "🩸 ¡Emergencia Médica Compatibilidad Confirmada!"
    cuerpo = f"Se tiene una emergencia para un paciente, la donación será en el {hospital}, se requiere urgentemente donantes para un paciente {tipo_receptor}{rh_receptor}. Tú eres compatible."

    notificados_online = 0
    guardados_bd = 0

    for nro_usuario in usuarios_ids:
        id_noti = notificaciones_repos.guardar_notificacion(
            titulo=titulo, 
            cuerpo=cuerpo, 
            tipo_referencia='URGENCIA_SANGRE', 
            nro_emergencia=nro_emergencia, 
            nro_usuario=nro_usuario
        )

        if id_noti:
            guardados_bd += 1
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