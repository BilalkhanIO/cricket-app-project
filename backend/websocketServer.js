// websocketServer.js

import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received: %s', message);
    // Handle message from client (e.g., subscribe to match updates)
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Clean up resources (e.g., unsubscribe from match updates)
  });
});

export default wss;