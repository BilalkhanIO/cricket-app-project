import { useState, useEffect } from 'react';
import axios from 'axios';

const useLeagueSeasons = () => {
  const [seasons, setSeasons] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLeagueSeasons = async (leagueId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/leagues/${leagueId}/seasons`);
      setSeasons(response.data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return { getLeagueSeasons, seasons, error, loading };
};

export default useLeagueSeasons;