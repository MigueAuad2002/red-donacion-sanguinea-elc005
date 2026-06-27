from fastapi import APIRouter, Body, HTTPException, Depends
from app.services import profile_services
from app.utils.security import verificar_token

router = APIRouter(tags=['PERFIL'])

@router.get('/')
def get_perfil(payload: dict = Depends(verificar_token)):
    nro_usuario = payload.get('nro_usuario')
    
    if not nro_usuario:
        raise HTTPException(
            status_code=401, 
            detail='El token no contiene un identificador de usuario válido.'
        )

    try:
        result = profile_services.obtener_perfil_usuario(nro_usuario)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.put('/')
def update_perfil(
    payload: dict = Depends(verificar_token),
    data: dict = Body(...)
):
    if not data:
        raise HTTPException(
            status_code=400,
            detail='El cuerpo de la petición está vacío.'
        )
        
    nro_usuario = payload.get('nro_usuario')
    
    if not nro_usuario:
        raise HTTPException(
            status_code=401, 
            detail='El token no contiene un identificador de usuario válido.'
        )
        
    try:
        
        result = profile_services.actualizar_perfil_usuario(nro_usuario, data)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")