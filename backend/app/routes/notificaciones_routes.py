from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException,Depends,Path
from app.classes.socketmanager import manager
from app.services import notificaciones_services
from app.utils.security import decode_access_token,verificar_token

router = APIRouter(tags=['NOTIFICACIONES'])

#TUNEL WEBSOCKET

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    resultado = decode_access_token(token)
    
    if not resultado.get('success'):
        await websocket.close(code=1008)
        return
        
    nro_usuario = resultado.get('payload').get('nro_usuario')
    if not nro_usuario:
        await websocket.close(code=1008)
        return

    # Delegamos la conexión a nuestra clase
    await manager.connect(websocket, nro_usuario)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(nro_usuario)


@router.get("/")
def obtener_notificaciones(payload: dict = Depends(verificar_token)):
    """
    Obtiene el historial de notificaciones del usuario autenticado.
    """
    nro_usuario = payload.get('nro_usuario')
    if not nro_usuario:
        raise HTTPException(status_code=401, detail='Token inválido.')

    try:
        return notificaciones_services.obtener_mis_notificaciones(nro_usuario)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{id_notificacion}/marcar-leido")
def marcar_notificacion_leida(
    id_notificacion: int = Path(..., description="ID de la notificación"),
    payload: dict = Depends(verificar_token)
):
    nro_usuario = payload.get('nro_usuario')
    if not nro_usuario:
        raise HTTPException(status_code=401, detail='Token inválido.')

    try:
        return notificaciones_services.actualizar_estado_notificacion(id_notificacion, nro_usuario)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simular-emergencia")
async def simular_emergencia(data: dict):
    """
    Endpoint para probar el Matching Biológico.
    Ej JSON esperado: {"hospital": "Hospital de Niños", "tipo_sangre": "A", "factor_rh": "-", "nro_emergencia": 1}
    """
    try:
        result = await notificaciones_services.procesar_alerta_emergencia(data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))