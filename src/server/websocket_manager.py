from fastapi import WebSocket
from typing import Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self, name: str = "default"):
        self.connection: Optional[WebSocket] = None
        self.name = name
        logger.info(f"Initialized WebSocketManager: {name}")

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connection = websocket
        logger.info(f"WebSocket connected: {self.name}")
        return True

    async def disconnect(self):
        if self.connection:
            logger.info(f"WebSocket disconnected: {self.name}")
            self.connection = None
            return True
        return False

    async def send_message(self, message: dict):
        if not self.connection:
            logger.warning(f"Attempted to send message to disconnected websocket: {self.name}")
            return False
            
        try:
            await self.connection.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Error sending message to {self.name} websocket: {str(e)}")
            self.connection = None
            return False