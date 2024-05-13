// WebSocketClient.js

import React, { useState, useEffect } from 'react';

const WebSocketClient = ({ matchId }) => {
  const [matchData, setMatchData] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      // Send subscription message to server
      ws.send(JSON.stringify({ type: 'subscribe', matchId }));
    };

    ws.onmessage = (event) => {
      console.log('Received: ', event.data);
      const data = JSON.parse(event.data);
      // Update match data in state
      setMatchData(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error: ', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Reconnect logic if needed
    };

    return () => {
      ws.close();
      console.log('WebSocket connection closed');
    };
  }, [matchId]);

  return (
    <div>
      {/* Render live scores and match details using matchData state */}
    </div>
  );
};

export default WebSocketClient;
