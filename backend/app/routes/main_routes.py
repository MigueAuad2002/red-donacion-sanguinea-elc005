from fastapi import APIRouter,Body

router=APIRouter(tags=['PRINCIPAL'])

@router.get('/')
def index():
    return {
        'success':'true',
        'estado':'En Linea',
        'Proyecto':'Red de Emparejamiento para Donaciones de Sangre.'
    }