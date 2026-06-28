from app.repos import usuario_repos


def listar_usuarios():
    return usuario_repos.listar_usuarios()


def obtener_usuario(id):
    usuario = usuario_repos.obtener_usuario(id)
    if not usuario:
        raise ValueError("Usuario no encontrado")
    return usuario


def actualizar_usuario(id, data):
    if not data.get("nombre_completo"):
        raise ValueError("Nombre requerido")

    return usuario_repos.actualizar_usuario(id, data)


def eliminar_usuario(id):
    return usuario_repos.eliminar_usuario(id)