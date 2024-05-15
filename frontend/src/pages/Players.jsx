// src/pages/Players.js

import React from 'react';
import PlayerCard from '../components/PlayerCard';

const Players = () => {
  const players = [
    { id: 1, name: 'John Doe', position: 'Batsman', image: '/images/player1.jpg' },
    { id: 2, name: 'Jane Smith', position: 'Bowler', image: '/images/player2.jpg' },
    // Add more player data
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Players</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
};

export default Players;