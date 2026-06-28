from fastapi import APIRouter, Body, HTTPException
from app.services import usuario_services

router = APIRouter(tags=["USUARIOS"])

@router.post('/register_usuario')
def crear_usuarios(data: dict = Body(...)):
    if not data:
        raise HTTPException(
            status_code=400,
            detail='El cuerpo de la petición está vacío o no es un JSON válido.'
        )
    
    try:
        result = usuario_services.registrar_usuario(data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


# 🔹 LISTAR TODOS LOS USUARIOS
@router.get("/")
def listar_usuarios():
    try:
        return usuario_services.listar_usuarios()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 🔹 OBTENER USUARIO POR ID
@router.get("/{id}")
def obtener_usuario(id: int):
    try:
        return usuario_services.obtener_usuario(id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# 🔹 ACTUALIZAR USUARIO
@router.put("/{id}")
def actualizar_usuario(id: int, data: dict = Body(...)):
    try:
        return usuario_services.actualizar_usuario(id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 🔹 ELIMINAR USUARIO
@router.delete("/{id}")
def eliminar_usuario(id: int):
    try:
        return usuario_services.eliminar_usuario(id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))