import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlayer } from '../../store/slices/playerSlice';

const PlayerProfile = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { player, loading, error } = useSelector((state) => state.player);

  useEffect(() => {
    dispatch(fetchPlayer(id));
  }, [dispatch, id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!player) return <div>No player found</div>;

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

export default PlayerProfile;