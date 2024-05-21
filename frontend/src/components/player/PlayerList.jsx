import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PlayerCard from '../components/PlayerCard';
import { fetchPlayers } from '../slices/playerSlice';

const PlayerList = () => {
  const dispatch = useDispatch();
  const { players, loading, error } = useSelector((state) => state.player);

  useEffect(() => {
    dispatch(fetchPlayers());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Players</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map(player => (
          <PlayerCard key={player._id} player={player} />
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
