import React, { useState } from 'react';
import usePlayerAssignment from '../hooks/usePlayerAssignment';

const PlayerAssignment = () => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { getPlayers, assignPlayerToTeam } = usePlayerAssignment();

  useEffect(() => {
    getPlayers();
  }, []);

  const handlePlayerChange = (event) => {
    setSelectedPlayer(event.target.value);
  };

  const handleTeamChange = (event) => {
    setSelectedTeam(event.target.value);
  };

  const handleAssignPlayer = async () => {
    try {
      await assignPlayerToTeam(selectedPlayer, selectedTeam);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Player Assignment</h1>
      <select onChange={handlePlayerChange}>
        <option value="">Select a player</option>
        {players.map((player) => (
          <option value={player._id}>{player.name}</option>
        ))}
      </select>
      <select onChange={handleTeamChange}>
        <option value="">Select a team</option>
        {/* Add team options here */}
      </select>
      <button onClick={handleAssignPlayer}>Assign Player</button>
    </div>
  );
};

export default PlayerAssignment;