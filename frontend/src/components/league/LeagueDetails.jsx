import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeagueById } from '../../store/slices/LeagueSlice';
import { useParams, Link } from 'react-router-dom';

const LeagueDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentLeague, loading, error } = useSelector((state) => state.league);

  useEffect(() => {
    if (id) {
      dispatch(fetchLeagueById(id));
    }
  }, [dispatch, id]);

  const league = currentLeague;
  const leagueLogoUrl = league?.logo ? `http://localhost:3000/${league.logo}` : '';

  return (
    <div className="container mx-auto py-8 px-4 md:px-8">
      {loading && <p className="text-center text-lg">Loading...</p>}
      {error && <p className="text-center text-lg text-red-500">Error: {error}</p>}
      {currentLeague && (
        <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {leagueLogoUrl && (
              <img
                src={leagueLogoUrl}
                alt={league.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full shadow-lg"
              />
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{league.name}</h1>
              <p className="text-gray-700 mb-4">{league.description}</p>
              <Link
                to={`/leagues/update/${league._id}`}
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                Edit
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueDetails;
