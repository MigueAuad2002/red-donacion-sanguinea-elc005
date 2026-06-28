from fastapi import APIRouter, Body, HTTPException, Depends, Path
from app.services import emergencias_services
from app.utils.security import verificar_token

router = APIRouter(tags=['EMERGENCIAS'])

@router.post("/")
async def crear_emergencia(
    data: dict = Body(...),
    payload: dict = Depends(verificar_token)
):
    nro_usuario_receptor = payload.get('nro_usuario')
    if not nro_usuario_receptor:
        raise HTTPException(status_code=401, detail='Token inválido.')

    try:
        result = await emergencias_services.registrar_nueva_emergencia(data, nro_usuario_receptor)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.put("/{nro_emergencia}/aceptar")
async def aceptar_emergencia(
    nro_emergencia: int = Path(..., description="ID de la emergencia a aceptar"),
    payload: dict = Depends(verificar_token)
):
    nro_usuario_donador = payload.get('nro_usuario')
    if not nro_usuario_donador:
        raise HTTPException(status_code=401, detail='Token inválido.')

    try:
        # AÑADIDO: await
        result = await emergencias_services.donante_acepta_emergencia(nro_emergencia, nro_usuario_donador)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
        

@router.get("/globales")
def obtener_todas_emergencias(payload: dict = Depends(verificar_token)):
    try:
        result = emergencias_services.listar_todas_las_emergencias()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/mis-emergencias")
def obtener_mis_emergencias(payload: dict = Depends(verificar_token)):
    nro_usuario = payload.get('nro_usuario')
    if not nro_usuario:
        raise HTTPException(status_code=401, detail='Token inválido o expirado.')

    try:
        result = emergencias_services.listar_mis_emergencias(nro_usuario)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    

@router.get("/compatibles")
def obtener_feed_compatibles(payload: dict = Depends(verificar_token)):
    """
    Retorna el FEED principal del usuario: Emergencias ABIERTAS, 
    de OTRAS personas, con las que el usuario autenticado es COMPATIBLE.
    """
    nro_usuario = payload.get('nro_usuario')
    if not nro_usuario:
        raise HTTPException(status_code=401, detail='Token inválido o expirado.')

    try:
        result = emergencias_services.listar_emergencias_feed_compatibles(nro_usuario)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")