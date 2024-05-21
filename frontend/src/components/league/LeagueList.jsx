import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeagues} from '../../store/slices/LeagueSlice';
import LeagueCard from './LeagueCard';

const LeagueList = () => {
  const dispatch = useDispatch();
  const { leagues = [] , loading, error } = useSelector((state) => state.league) || {};
  console.log(leagues);
  useEffect(() => {
    dispatch(fetchLeagues());
  }, [dispatch]);

  
  return (
    <>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">Leagues</h1>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
        {leagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leagues.map((league) => (
              <LeagueCard key={league._id} league={league} />
            ))}
          </div>
        ) : (
          !loading && <p>No leagues to display.</p>
        )}
      </div>
    </>
  );
};

export default LeagueList;
