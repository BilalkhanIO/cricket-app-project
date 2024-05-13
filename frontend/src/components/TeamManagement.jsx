import React, { useState } from 'react';
import useTeamManagement from '../hooks/useTeamManagement';

const TeamManagement = () => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { getTeams, createTeam, deleteTeam, teams, error, loading } = useTeamManagement();

  useEffect(() => {
    getTeams();
  }, []);

  const handleTeamChange = (event) => {
    setSelectedTeam(event.target.value);
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    try {
      const response = await createTeam({
        name: event.target.name.value,
      });
      setTeams([...teams, response.data]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      await deleteTeam(teamId);
      setTeams(teams.filter((team) => team._id !== teamId));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Team Management</h1>
      <select onChange={handleTeamChange}>
        <option value="">Select a team</option>
        {teams.map((team) => (
          <option value={team._id}>{team.name}</option>
        ))}
      </select>
      <button onClick={handleCreateTeam}>Create Team</button>
      <button onClick={() => handleDeleteTeam(selectedTeam)}>Delete Team</button>
      <ul>
        {teams.map((team) => (
          <li key={team._id}>{team.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default TeamManagement;