from fastapi import APIRouter, WebSocket, HTTPException
from fastapi.websockets import WebSocketDisconnect
import requests
import time
import asyncio
import logging
from websocket_manager import WebSocketManager
from config import CAMERA_SERVICE_URL

router = APIRouter()
logger = logging.getLogger(__name__)
detection_frontend_ws_manager = WebSocketManager(name="detection_frontend")
pi_detection_ws_manager = WebSocketManager(name="pi_detection")

@router.websocket("/ws/detection_stream")
async def detection_stream_websocket_endpoint(websocket: WebSocket):
    await detection_frontend_ws_manager.connect(websocket)
    
    try:
        while True:
            try:
                await websocket.receive_text()
            
            except WebSocketDisconnect:
                break
            except asyncio.CancelledError:
                break
            
    except Exception as e:
        print(f"Detection WebSocket error: {e}")
    finally:
        await detection_frontend_ws_manager.disconnect()

@router.websocket("/ws/detection")
async def detection_websocket_endpoint(websocket: WebSocket):
    await pi_detection_ws_manager.connect(websocket)
    
    try:
        while True:
            try:
                # Receive frame data from Raspberry Pi
                data = await websocket.receive_json()
                logger.info("Received frame data from Raspberry Pi")
                
                # Forward the frame data to frontend client
                detection_frame = {
                    "type": "detection_frame",
                    "data": {
                        "timestamp": int(time.time()),
                        "frame": data["frame"]
                    }
                }
                
                # Send to frontend if connection exists
                if detection_frontend_ws_manager.connection:
                    success = await detection_frontend_ws_manager.send_message(detection_frame)
                    if not success:
                        logger.warning("Failed to forward detection frame to frontend")
                else:
                    logger.warning("No frontend connection available to forward detection data")
                
            except WebSocketDisconnect:
                logger.info("Pi detection WebSocket disconnected")
                break
            except asyncio.CancelledError:
                logger.info("Pi detection WebSocket cancelled")
                break
            except Exception as e:
                logger.error(f"Error in detection WebSocket: {str(e)}")
                break
            
    except Exception as e:
        logger.error(f"Detection WebSocket error: {str(e)}")
    finally:
        await pi_detection_ws_manager.disconnect()

@router.post("/stream/start")
async def start_stream():
    print("Forwarding start request to stream service")
    response = requests.post(f"{CAMERA_SERVICE_URL}/start", json={"name": "start"}, timeout=3)
    return response.json()

@router.post("/stream/stop")
async def stop_stream():
    print("Forwarding stop request to stream service")
    response = requests.post(f"{CAMERA_SERVICE_URL}/stop", json={"name": "stop"}, timeout=3)
    return response.json()

@router.get("/stream/status")
async def get_stream_status():
    print("Checking stream service status")
    try:
        response = requests.get(f"{CAMERA_SERVICE_URL}/status", timeout=3)
        return response.json()
    except requests.exceptions.Timeout:
        return {"isRunning": False, "error": "Request timed out"}
    except Exception as e:
        logger.error(f"Error checking stream status: {str(e)}")
        return {"isRunning": False, "error": str(e)}
