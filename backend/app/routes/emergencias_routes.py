from fastapi import APIRouter, Body, HTTPException, Depends, Path
from app.services import emergencias_services
from app.utils.security import verificar_token

router = APIRouter(tags=['EMERGENCIAS'])

@router.post("/")
async def crear_emergencia(
    data: dict = Body(...),
    payload: dict = Depends(verificar_token)
):
    """
    Registra una emergencia médica, tomando la ubicación enviada.
    Dispara automáticamente las notificaciones Push a usuarios compatibles.
    """
    nro_usuario_receptor = payload.get('nro_usuario')
    if not nro_usuario_receptor:
        raise HTTPException(status_code=401, detail='Token inválido.')

    try:
        # Usamos await porque la función subyacente dispara los sockets
        result = await emergencias_services.registrar_nueva_emergencia(data, nro_usuario_receptor)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.put("/{nro_emergencia}/aceptar")
def aceptar_emergencia(
    nro_emergencia: int = Path(..., description="ID de la emergencia a aceptar"),
    payload: dict = Depends(verificar_token)
):
    """
    El donante acepta la solicitud. Cambia el estado a 'EN_PROCESO'.
    """
    nro_usuario_donador = payload.get('nro_usuario')
    if not nro_usuario_donador:
        raise HTTPException(status_code=401, detail='Token inválido.')

    try:
        result = emergencias_services.donante_acepta_emergencia(nro_emergencia, nro_usuario_donador)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    

@router.get("/globales")
def obtener_todas_emergencias(payload: dict = Depends(verificar_token)):
    """
    Retorna todas las emergencias (Ideal para poblar el mapa general).
    """
    try:
        result = emergencias_services.listar_todas_las_emergencias()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/mis-emergencias")
def obtener_mis_emergencias(payload: dict = Depends(verificar_token)):
    """
    Retorna el historial médico y heroico del usuario autenticado.
    El nro_usuario se extrae de forma segura del token.
    """
    nro_usuario = payload.get('nro_usuario')
    if not nro_usuario:
        raise HTTPException(status_code=401, detail='Token inválido o expirado.')

    try:
        result = emergencias_services.listar_mis_emergencias(nro_usuario)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")