import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeams } from '../slices/teamSlice'; // Assuming you have a teamSlice similar to playerSlice

const TeamSelect = ({ value, onChange }) => {
  const dispatch = useDispatch();
  const { teams, loading, error } = useSelector((state) => state.team);

  useEffect(() => {
    dispatch(fetchTeams());
  }, [dispatch]);

  if (loading) return <option>Loading...</option>;
  if (error) return <option>Error loading teams</option>;

  return (
    <select value={value} onChange={onChange} required className="w-full p-2 border border-gray-300 rounded mt-1">
      <option value="">Select team</option>
      {teams.map(team => (
        <option key={team._id} value={team._id}>{team.name}</option>
      ))}
    </select>
  );
};

export default TeamSelect;
