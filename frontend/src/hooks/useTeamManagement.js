import { useState, useEffect } from 'react';
import axios from 'axios';

const useTeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getTeams = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/teams');
      setTeams(response.data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const createTeam = async (teamData) => {
    try {
      const response = await axios.post('/teams', teamData);
      return response.data;
    } catch (error) {
      setError(error.message);
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      await axios.delete(`/teams/${teamId}`);
    } catch (error) {
      setError(error.message);
    }
  };

  return { getTeams, createTeam, deleteTeam, teams, error, loading };
};

export default useTeamManagement;