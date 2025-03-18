from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        self.lidar_connection: WebSocket | None = None
        self.pi_detection_connection: WebSocket | None = None
        self.mapping_connection: WebSocket | None = None
        self.detection_frontend_connection: WebSocket | None = None

    async def connect_lidar(self, websocket: WebSocket):
        await websocket.accept()
        self.lidar_connection = websocket

    async def connect_pi_detection(self, websocket: WebSocket):
        await websocket.accept()
        self.pi_detection_connection = websocket

    async def connect_detection_frontend(self, websocket: WebSocket):
        await websocket.accept()
        self.detection_frontend_connection = websocket

    async def connect_mapping(self, websocket: WebSocket):
        await websocket.accept()
        self.mapping_connection = websocket

    async def disconnect(self):
        self.connection = None

    async def disconnect_pi_detection(self):
        self.pi_detection_connection = None

    async def disconnect_mapping(self):
        self.mapping_connection = None

    async def disconnect_detection_frontend(self):
        self.detection_frontend_connection = None

    async def send_lidar_message(self, message: dict):
        if self.lidar_connection:
            try:
                await self.lidar_connection.send_json(message)
            except Exception as e:
                print(f"Error sending to websocket: {e}")
                self.connection = None

    async def send_frontend_detection_message(self, message: dict):
        if self.detection_frontend_connection:
            try:
                await self.detection_frontend_connection.send_json(message)
            except Exception as e:
                print(f"Error sending to websocket: {e}")
                self.detection_frontend_connection = None

    async def send_mapping_image_message(self, message: dict):
        if self.mapping_connection:
            try:
                await self.mapping_connection.send_json(message)
            except Exception as e:
                print(f"Error sending to websocket: {e}")
                self.mapping_connection = None