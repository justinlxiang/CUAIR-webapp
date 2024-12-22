type MessageHandler = (data: any) => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private handlers: Map<string, MessageHandler[]> = new Map();
    private isConnecting: boolean = false;

    connect() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('WebSocket: Already connected');
            return;
        }

        if (this.isConnecting) {
            console.log('WebSocket: Connection already in progress');
            return;
        }

        console.log('WebSocket: Attempting to connect...');
        this.isConnecting = true;

        try {
            this.ws = new WebSocket('ws://localhost:8000/ws');

            this.ws.onopen = () => {
                console.log('WebSocket: Connection established');
                this.isConnecting = false;
            };

            this.ws.onmessage = (event) => {
                try {
                    console.log('WebSocket: Raw message received:', event.data);
                    const message = JSON.parse(event.data);
                    console.log('WebSocket: Parsed message:', message);
                    
                    const handlers = this.handlers.get(message.type) || [];
                    console.log(`WebSocket: Found ${handlers.length} handlers for type ${message.type}`);
                    
                    handlers.forEach(handler => handler(message));
                } catch (error) {
                    console.error('WebSocket: Error processing message:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket: Connection closed', event.reason);
                this.isConnecting = false;
                // Attempt to reconnect after a delay
                setTimeout(() => this.connect(), 1000);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket: Error occurred:', error);
                this.isConnecting = false;
            };

        } catch (error) {
            console.error('WebSocket: Connection error:', error);
            this.isConnecting = false;
        }
    }

    subscribe(type: string, handler: MessageHandler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type)?.push(handler);
    }

    unsubscribe(type: string, handler: MessageHandler) {
        const handlers = this.handlers.get(type);
        if (handlers) {
            this.handlers.set(type, handlers.filter(h => h !== handler));
        }
    }
}

// Create a singleton instance
export const wsClient = new WebSocketClient(); 