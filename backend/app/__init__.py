from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

#IMPORTAR RUTAS

from app.routes import main_routes,auth_routes,profile_routes,usuario_routes

def create_app() -> FastAPI:
    
    app=FastAPI(
        title="Red de Emparejamiento para Donaciones de Sangre",
        version="1.0.0",
        description="Backend FastAPI estructurado en 3 capas"
    )

    #CONFIGURACION DE CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(main_routes.router)
    app.include_router(auth_routes.router,prefix='/api/auth')
    app.include_router(profile_routes.router,prefix='/api/profile')
    app.include_router(usuario_routes.router,prefix='/api/users')

    return app