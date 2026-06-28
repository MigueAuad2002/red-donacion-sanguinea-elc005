from app.repos import usuario_repos
from werkzeug.security import generate_password_hash


def crear_usuario_admin(data: dict):
    
    #VALIDACION DE CAMPOS OBLIGATORIOS
    campos_requeridos = ['nombre_completo', 'password', 'ci', 'fecha_nacimiento', 'genero', 'id_sangre']
    for campo in campos_requeridos:
        if not data.get(campo):
            raise ValueError(f'El campo {campo} es obligatorio para el registro.')

    #VALIDACION: USUARIO DUPLICADO 'CI'
    usuario_existente = usuario_repos.obtener_usuario_ci(data['ci'])
    if usuario_existente:
        raise ValueError('Ya existe un usuario registrado con el número de Carnet de Identidad ingresado.')

    #ENCRIPTACION DE CONTRASEÑA
    data['password_hash'] = generate_password_hash(data['password'])

    #ASIGNACION DE ROL POR DEFECTO (CIUDADANO)
    if 'id_rol' not in data:
        data['id_rol'] = 1

    #INSERTAR EN LA DB
    nuevo_id = usuario_repos.registrar_usuario(data)

    if not nuevo_id:
         raise ValueError('Ocurrió un error al intentar crear el registro en la base de datos.')

    return {
        'success': True,
        'message': 'Registro de usuario exitoso.',
        'nro_usuario': nuevo_id
    }

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