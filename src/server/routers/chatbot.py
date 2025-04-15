from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import os
import asyncio
import logging
from typing import List, Dict, Optional
from ollama import AsyncClient

# Disable httpx logging
logging.getLogger("httpx").setLevel(logging.WARNING)

router = APIRouter()

# Define data models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    response: str

class MessagesResponse(BaseModel):
    messages: List[Message]

# Store chat history in memory (in a real app, you'd use a database)
global chat_history
chat_history: List[Message] = []

# Track the context marker (index in chat_history where context starts)
global context_marker
context_marker = 0

# Demo tool functions
def start_lidar():
    """Start the LIDAR system"""
    print("TURNING ON LIDAR")
    return "Tool call successful: LIDAR system activated successfully"

def stop_lidar():
    """Stop the LIDAR system"""
    print("TURNING OFF LIDAR")
    return "Tool call successful: LIDAR system deactivated successfully"

def start_video_stream():
    """Start the video stream from the aircraft camera"""
    print("STARTING VIDEO STREAM")
    return "Tool call successful: Video stream started successfully"

def stop_video_stream():
    """Stop the video stream from the aircraft camera"""
    print("STOPPING VIDEO STREAM")
    return "Tool call successful: Video stream stopped successfully"

# System context for Nexus
SYSTEM_CONTEXT = """You are Nexus AI, an AI agent for CUAir - a student project team at Cornell University developing autonomous aircraft. 
You were created by the Intsys subteam, which focuses on computer vision, obstacle avoidance, mapping, and warning systems.
As Nexus AI, you have the ability to control and monitor various systems on CUAir's aircraft. You should be helpful, professional, and focused on 
assisting with tasks related to autonomous aircraft operations, mapping, obstacle avoidance, and system monitoring. Nexus itself is the platform built by Intsys you are
running on which has pages to monitor and control systems on the aircraft.

You have access to the following tools:
- start_lidar: Activates the LIDAR system on the aircraft for obstacle detection and mapping.
- stop_lidar: Deactivates the LIDAR system on the aircraft.
- start_video_stream: Starts the video stream from the aircraft camera.
- stop_video_stream: Stops the video stream from the aircraft camera.

If a user explicitly asks you to use a tool, another request is handling it, so respond that the tool is being handled. Be concise.
If a user asks what tools are available, make sure to list all of them.
IMPORTANT: When a tool is being used, DO NOT include the tool result in your response. The system will automatically append the tool result to your response.
Also don't list the available tools unless the user asks for them."""

# Tool decision prompt
TOOL_DECISION_PROMPT = """You are a tool decision assistant for Nexus AI, an AI agent for CUAir.
Your job is to determine if the user's request requires the use of a specific tool.

Available tools:
- start_lidar: Activates the LIDAR system on the aircraft for obstacle detection and mapping.
- stop_lidar: Deactivates the LIDAR system on the aircraft.
- start_video_stream: Starts the video stream from the aircraft camera.
- stop_video_stream: Stops the video stream from the aircraft camera.

Respond with ONLY "YES" if the user's request requires using any of the available tools, or "NO" if no tool is needed.
Do not provide any explanation, just "YES" or "NO". 
Make sure even if the user asks general questions about system or what tools are available, respond with "NO".
If the user asks what tools are available, for example, "What are the tools available?", respond with "NO".

For example:
- If the user asks "start the lidar" or "activate the lidar", respond with "YES"
- If the user asks "stop the lidar" or "turn off the lidar", respond with "YES"
- If the user asks "start the video stream" or "turn on the camera", respond with "YES"
- If the user asks "stop the video stream" or "turn off the camera", respond with "YES"
- If the user asks "what is the weather" or "tell me about CUAir", respond with "NO"
"""

# Model name
MODEL_NAME = "llama3.2:3b"

def prepare_messages(request, system_prompt):
    """Prepare messages for the model with system prompt"""
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add user messages
    for msg in request["messages"]:
        messages.append({"role": msg.role, "content": msg.content})
    
    return messages

def get_available_tools():
    """Return the list of available tools with their schemas"""
    return [
        {
            "name": "start_lidar",
            "description": "Start the LIDAR system",
            "input_schema": {}
        },
        {
            "name": "stop_lidar",
            "description": "Stop the LIDAR system",
            "input_schema": {}
        },
        {
            "name": "start_video_stream",
            "description": "Start the video stream from the aircraft camera",
            "input_schema": {}
        },
        {
            "name": "stop_video_stream",
            "description": "Stop the video stream from the aircraft camera",
            "input_schema": {}
        }
    ]

def execute_tool(tool_name: str):
    """Execute the appropriate tool based on the name"""
    if tool_name == "start_lidar":
        return start_lidar()
    elif tool_name == "stop_lidar":
        return stop_lidar()
    elif tool_name == "start_video_stream":
        return start_video_stream()
    elif tool_name == "stop_video_stream":
        return stop_video_stream()
    else:
        print(f"Unknown tool: {tool_name}")
        return f"Unknown tool requested: {tool_name}"

async def check_tool_decision(tool_decision_messages):
    """Check if a tool is needed and execute it if necessary"""
    tool_needed = False
    tool_result = None
    
    try:
        # Create an Ollama client
        client = AsyncClient()
        
        # Make the tool decision request
        response = await client.chat(
            model=MODEL_NAME,
            messages=tool_decision_messages
        )
        
        # Check if the model wants to use a tool
        tool_decision = response.message.content.strip().upper()
        tool_needed = tool_decision == "YES"
        print(f"Tool decision: {tool_decision}, Tool needed: {tool_needed}")
        
        # If tool is needed, execute it
        if tool_needed:
            # Make a tool call with the specified format
            tool_call_response = await client.chat(
                model=MODEL_NAME,
                messages=tool_decision_messages,
                tools=get_available_tools()
            )
            
            # Check if there's a tool call in the response
            print(tool_call_response)
            if hasattr(tool_call_response, 'message') and hasattr(tool_call_response.message, 'tool_calls') and tool_call_response.message.tool_calls:
                # Extract the tool call information
                tool_call = tool_call_response.message.tool_calls[0]
                tool_name = tool_call.function.name
                
                print(f"Tool call detected: {tool_name}")
                tool_result = execute_tool(tool_name)
            else:
                print("No tool calls found in the response")
    except Exception as e:
        print(f"Error checking for tool calls: {str(e)}")
        
    return tool_needed, tool_result

async def stream_response(messages):
    """Stream the response from Ollama"""
    full_response = ""
    client = AsyncClient()
    
    try:
        # Get the streaming response
        stream = await client.chat(
            model=MODEL_NAME,
            messages=messages,
            stream=True
        )
        
        # Process the streaming response
        async for chunk in stream:
            if hasattr(chunk, 'message') and hasattr(chunk.message, 'content'):
                content_chunk = chunk.message.content
                full_response += content_chunk
                yield content_chunk, False
    except Exception as e:
        error_detail = f"Error streaming from Ollama: {str(e)}"
        print(error_detail)
        yield error_detail, True

def update_chat_history(request_messages, assistant_message):
    """Update the chat history for a user"""
    global chat_history
    
    # Add the user's messages
    chat_history.extend(request_messages)
    
    # Add the assistant's message
    chat_history.append(assistant_message)

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream the chatbot response"""
    try:
        # Get the context messages (only messages after the context marker)
        context_messages = chat_history[context_marker:] if context_marker < len(chat_history) else []
        
        # Add the new user message to the context
        context_messages.append(request.messages[-1])
        
        # Prepare the messages with system context
        messages = prepare_messages({"messages": context_messages}, SYSTEM_CONTEXT)
        tool_decision_messages = prepare_messages({"messages": context_messages}, TOOL_DECISION_PROMPT)
        
        async def generate():
            # Create a new message for the assistant
            assistant_message = Message(role="assistant", content="")
            
            # Update chat history with the full request messages
            update_chat_history(request.messages, assistant_message)
            
            # Start the tool decision process in the background
            tool_decision_task = asyncio.create_task(check_tool_decision(tool_decision_messages))
            
            # Stream the response
            full_response = ""
            async for content_chunk, is_error in stream_response(messages):
                if is_error:
                    yield f"data: {json.dumps({'error': content_chunk})}\n\n"
                    return
                
                full_response += content_chunk
                assistant_message.content = full_response
                yield f"data: {json.dumps({'chunk': content_chunk, 'done': False})}\n\n"
            
            # Wait for the tool decision process to complete
            tool_needed, tool_result = await tool_decision_task
            
            # If a tool was needed and executed, append the result to the response
            if tool_needed and tool_result:
                # Check if the tool result is already included in the model's response
                if tool_result not in full_response:
                    full_response += f"\n\n{tool_result}"
                    assistant_message.content = full_response
                    chunk_data = {'chunk': '\n\n' + tool_result, 'done': False}
                    yield f"data: {json.dumps(chunk_data)}\n\n"
            
            # Signal that streaming is complete
            yield f"data: {json.dumps({'chunk': '', 'done': True})}\n\n"
        
        return StreamingResponse(generate(), media_type="text/event-stream")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages", response_model=MessagesResponse)
async def get_messages():
    """Retrieve all messages for the default user"""
    
    return MessagesResponse(messages=chat_history)

@router.post("/clear")
async def clear_history():
    """Clear chat history for the default user"""
    chat_history = []
    context_marker = 0
    return {"status": "success", "message": "Chat history cleared"}

@router.post("/clear-context")
async def clear_context():
    """Clear the context for the chatbot while preserving message history"""
    global context_marker
    # Set the context marker to the current length of chat history
    # This means all future messages will be treated as new context
    context_marker = len(chat_history)
    return {"status": "success", "message": "Context cleared"}