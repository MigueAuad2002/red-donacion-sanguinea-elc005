from fastapi import APIRouter, Body, HTTPException, Depends, Path
from app.services import hospital_services
from app.utils.security import verificar_token

router = APIRouter(tags=['HOSPITALES'])

@router.post("/")
def crear_hospital(data: dict = Body(...), payload: dict = Depends(verificar_token)):
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
    try:
        result = hospital_services.listar_todos_hospitales()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/{nro_hospital}")
def obtener_hospital(
    nro_hospital: int = Path(..., description="ID del hospital"), 
    payload: dict = Depends(verificar_token)
):
    try:
        result = hospital_services.obtener_un_hospital(nro_hospital)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.put("/{nro_hospital}")
def actualizar_hospital(
    nro_hospital: int = Path(...), 
    data: dict = Body(...), 
    payload: dict = Depends(verificar_token)
):
    if payload.get('nombre_rol') != 'ADMINISTRADOR':
        raise HTTPException(status_code=403, detail="No tienes permisos para esta acción.")

    try:
        result = hospital_services.modificar_hospital(nro_hospital, data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.delete("/{nro_hospital}")
def eliminar_hospital(
    nro_hospital: int = Path(...), 
    payload: dict = Depends(verificar_token)
):
    if payload.get('nombre_rol') != 'ADMINISTRADOR':
        raise HTTPException(status_code=403, detail="No tienes permisos para esta acción.")

    try:
        result = hospital_services.borrar_hospital(nro_hospital)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")