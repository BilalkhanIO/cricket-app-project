// src/components/PlayerDetails.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const PlayerDetails = () => {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const fetchPlayerDetails = async () => {
      try {
        const response = await axios.get(`/api/players/${id}`);
        setPlayer(response.data.player);
      } catch (error) {
        console.error('Error fetching player details:', error);
      }
    };

    fetchPlayerDetails();
  }, [id]);

  if (!player) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">{player.name}'s Profile</h1>
      <p>Player Type: {player.playerType}</p>
      <p>Team: {player.team.name}</p>
      <p>Bio: {player.bio}</p>
      {/* Add more player details as needed */}
    </div>
  );
};

export default PlayerDetails;