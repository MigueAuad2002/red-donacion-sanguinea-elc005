from fastapi import APIRouter, Body, HTTPException, Depends
from app.services import hospital_services
from app.utils.security import verificar_token

router = APIRouter(prefix="/hospitales", tags=['HOSPITALES'])

@router.post("/")
def crear_hospital(
    data: dict = Body(...),
    payload: dict = Depends(verificar_token)
):
    """
    Registra un nuevo hospital en el sistema.
    """
    
    if payload.get('nombre_rol') != 'ADMINISTRADOR':
        raise HTTPException(status_code=403, detail="No tienes permisos para esta acción.")

    try:
        result = hospital_services.registrar_hospital(data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/")
def obtener_hospitales(payload: dict = Depends(verificar_token)):
    """
    Retorna la lista de todos los hospitales registrados.
    Ideal para poblar selectores en el frontend.
    """
    try:
        result = hospital_services.listar_todos_hospitales()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")