from fastapi import APIRouter, Body, HTTPException
from app.services import audit_services

router = APIRouter(tags=["AUDITORIA"])



# 🔹 LISTAR TODOS LOS USUARIOS
@router.get("/")
def listar_usuarios():
    try:
        return audit_services.listar_bitacora()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



