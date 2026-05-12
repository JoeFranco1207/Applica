import WebSocket, { WebSocketServer } from 'ws';
import crypto from 'crypto';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.id = crypto.randomUUID();

  console.log(`Client connected: ${ws.id}`);

  ws.on('message', (data) => {
    const message = data.toString();

    console.log(`[${ws.id}]: ${message}`);

    // Broadcast to everyone
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            clientId: ws.id,
            text: message,
          })
        );
      }
    });
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${ws.id}`);
  });
});

console.log('Chat server running on ws://localhost:8080');