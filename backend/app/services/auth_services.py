from werkzeug.security import generate_password_hash,check_password_hash
from app.utils import security
from app.repos import auth_repos

def loguear_usuario(data:dict):
    ci=data.get('ci')
    password=data.get('password')

    if not ci or not password:
        raise ValueError(f'El CI y la contraseña son obligatorios.')
    
    usuario_db=auth_repos.obtener_usuario_ci(ci)

    if not usuario_db:
        raise ValueError('El Usuario Ingresado no Existe o esta Inactivo.')

    password_hash=usuario_db['password_hash']

    if check_password_hash(password_hash,password):

        token=security.create_access_token(
            usuario_db['nro_usuario'],
            usuario_db['nombre_completo'],
            usuario_db['nombre_rol'],
            usuario_db['genero'],
            usuario_db['fecha_nacimiento'],
            usuario_db['tipo_sangre'],
            usuario_db['factor_rh']
        )
        
        #ACORTAR EL JSON -> NO SIRVE GUARDAR PASSWORD_HASH EN FRONTEND
        usuario_db.pop('password_hash')

        return {
            'success':True,
            'message':'Inicio de Sesión Exitoso',
            'usuario':usuario_db,
            'token':token
        }
    
    raise ValueError('Contraseña Incorrecta.')

def registrar_usuario(data: dict):
    
    #VALIDACION DE CAMPOS OBLIGATORIOS
    campos_requeridos = ['nombre_completo', 'password', 'ci', 'fecha_nacimiento', 'genero', 'id_sangre']
    for campo in campos_requeridos:
        if not data.get(campo):
            raise ValueError(f'El campo {campo} es obligatorio para el registro.')

    #VALIDACION: USUARIO DUPLICADO 'CI'
    usuario_existente = auth_repos.obtener_usuario_ci(data['ci'])
    if usuario_existente:
        raise ValueError('Ya existe un usuario registrado con el número de Carnet de Identidad ingresado.')

    #ENCRIPTACION DE CONTRASEÑA
    data['password_hash'] = generate_password_hash(data['password'])

    #ASIGNACION DE ROL POR DEFECTO (CIUDADANO)
    if 'id_rol' not in data:
        data['id_rol'] = 1

    #INSERTAR EN LA DB
    nuevo_id = auth_repos.insertar_usuario(data)

    if not nuevo_id:
         raise ValueError('Ocurrió un error al intentar crear el registro en la base de datos.')

    return {
        'success': True,
        'message': 'Registro de usuario exitoso.',
        'nro_usuario': nuevo_id
    }