from app.repos import profile_repos

def obtener_perfil_usuario(nro_usuario: int):
    perfil = profile_repos.obtener_perfil(nro_usuario)

    if not perfil:
        raise ValueError('El perfil solicitado no existe o no está disponible.')

    if 'fecha_nacimiento' in perfil and perfil['fecha_nacimiento']:
        perfil['fecha_nacimiento'] = str(perfil['fecha_nacimiento'])

    if 'fecha_registro' in perfil and perfil['fecha_registro']:
        perfil['fecha_registro'] = str(perfil['fecha_registro'])

    return {
        'success': True,
        'perfil': perfil
    }

def actualizar_perfil_usuario(nro_usuario: int, data: dict):
    usuario_existente = profile_repos.obtener_perfil(nro_usuario)
    if not usuario_existente:
        raise ValueError('No se puede actualizar porque el usuario no existe.')

    actualizado = profile_repos.actualizar_perfil(nro_usuario, data)

    if not actualizado:
        raise ValueError('No se enviaron datos válidos para actualizar o los datos son los mismos.')

    return {
        'success': True,
        'message': 'Perfil actualizado correctamente.'
    }