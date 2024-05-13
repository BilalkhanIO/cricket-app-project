import { useState, useEffect } from 'react';
import axios from 'axios';

const usePlayerAssignment = () => {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getPlayers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/players');
      setPlayers(response.data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const assignPlayerToTeam = async (playerId, teamId) => {
    try {
      await axios.post(`/players/${playerId}/assign`, { teamId });
    } catch (error) {
      setError(error.message);
    }
  };

  return { getPlayers, assignPlayerToTeam, players, error, loading };
};

export default usePlayerAssignment;