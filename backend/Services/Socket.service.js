import WebSocket, { WebSocketServer } from 'ws';
import { AppError } from '../Utils/AppError.js';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');
});

export const sendMessage = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) { 
        client.send(JSON.stringify(message));
    }
  }
    );
};

export const broadcastMessage = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

export const sendMessageToClient = (clientId, message) => {
  const client = Array.from(wss.clients).find((c) => c.id === clientId);
    if (!client) {
        throw new AppError("Client not found", 404);
    }
