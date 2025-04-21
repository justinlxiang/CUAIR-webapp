from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import random
import json
from datetime import datetime
from websocket_manager import WebSocketManager
import logging 
import numpy as np
import time

router = APIRouter()
ws_manager = WebSocketManager("warning-system")
logger = logging.getLogger(__name__)

def generate_telemetry_data():
    timestamp = time.time()
    pitch = 80 * np.sin(timestamp / 2)
    roll = 50 * np.sin(timestamp / 3 + 1)
    yaw = 30 * np.sin(timestamp / 4 + 2)
    
    return {
        "timestamp": timestamp,
        "pitch": float(pitch),
        "roll": float(roll),
        "yaw": float(yaw)
    }

@router.websocket("/ws/warning-system")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await ws_manager.connect(websocket)
        logger.info("Client connected to warning system websocket")
        
        while True:
            if not ws_manager.connection:
                logger.info("WebSocket disconnected, stopping data generation")
                break
                
            # Generate random attitude data
            data = {
                "type": "telemetry",
                "data": generate_telemetry_data()
            }
            
            success = await ws_manager.send_message(data)
            if not success:
                logger.info("Failed to send message, stopping data generation")
                break
                
            await asyncio.sleep(0.1)  # Send data every 100ms
            
    except WebSocketDisconnect:
        logger.info("Client disconnected from warning system websocket")
    except Exception as e:
        logger.error(f"Error in warning system websocket: {str(e)}")
    finally:
        await ws_manager.disconnect()
        logger.info("Cleaned up warning system websocket connection")
