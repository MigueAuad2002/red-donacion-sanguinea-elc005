from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime,timedelta,timezone
from app.config import Config
import jwt

#INICAR PROTOCOLO DE DETECCION BEARER
bearer_scheme = HTTPBearer()

def create_access_token(nro_usuario, nombre_completo,nombre_rol,genero,fecha_nacimiento,tipo_sangre,factor_rh, minutes=120):
    """
    GENERA EL JWT PARA LA SESIÓN DEL USUARIO
    """
    
    #AJUSTAR A NUEVA TABLA DE USUARIO -> PENDIENTE
    payload = {
        'nro_usuario': nro_usuario,
        'nombre_completo': nombre_completo,
        'nombre_rol': nombre_rol,
        'genero':genero,
        'fecha_nacimiento':fecha_nacimiento,
        'tipo_sangre': tipo_sangre,
        'factor_rh':factor_rh,
        'exp': datetime.now(timezone.utc) + timedelta(minutes=minutes),
        'iat': datetime.now(timezone.utc)
    }

    return jwt.encode(payload, Config.TOKEN_KEY, algorithm="HS256")


def decode_access_token(token: str):
    """
    DECODIFICA Y VALIDA EL JWT ENVIADO POR EL FRONTEND
    """
    try:
        payload = jwt.decode(token, Config.TOKEN_KEY, algorithms=["HS256"])
        
        return {
            'success': True,
            'message': 'TOKEN VALIDO',
            'payload': payload
        }
        
    except jwt.ExpiredSignatureError:
        return {
            'success': False,
            'message': 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.'
        }
        
    except jwt.InvalidTokenError:
        return {
            'success': False,
            'message': 'Token de acceso inválido o corrupto.'
        }


def verificar_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    """
    Dependencia reusable que extrae el token Bearer, lo valida con tu función 
    y retorna el payload decodificado si todo está correcto.
    """
    #OBTENEMOS EL TOKEN
    token = credentials.credentials

    #VERIFICAMOS CON FUNCION DE DECODIFICACION
    resultado = decode_access_token(token)
    
    #SI LA DECODIFICACION FALLA (TOKEN EXPIRADO O INVALIDO) RETORNAR ERROR
    if not resultado.get('success'):
        raise HTTPException(status_code=401, detail=resultado.get('message'))
        
    #SI LA VERIFICACION RETORNA EXITO RETORNAMOS EL CONTENIDO DEL TOKEN
    return resultado.get('payload')