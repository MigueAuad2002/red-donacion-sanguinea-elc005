from fastapi import WebSocket
from typing import Dict

class SocketManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, nro_usuario: int):
        await websocket.accept()
        self.active_connections[nro_usuario] = websocket
        print(f"[WS] Usuario {nro_usuario} conectado al túnel.")

    def disconnect(self, nro_usuario: int):
        if nro_usuario in self.active_connections:
            del self.active_connections[nro_usuario]
            print(f"[WS] Usuario {nro_usuario} desconectado.")

    async def send_personal_message(self, message: dict, nro_usuario: int):
        if nro_usuario in self.active_connections:
            websocket = self.active_connections[nro_usuario]
            await websocket.send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = SocketManager()