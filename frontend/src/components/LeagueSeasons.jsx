import React, { useState } from 'react';
import useLeagueSeasons from '../hooks/useLeagueSeasons';

const LeagueSeasons = () => {
  const [selectedLeague, setSelectedLeague] = useState(null);
  const { getLeagueSeasons, seasons, error, loading } = useLeagueSeasons();

  useEffect(() => {
    const fetchSeasons = async () => {
      if (selectedLeague) {
        try {
          await getLeagueSeasons(selectedLeague);
        } catch (error) {
          console.error(error);
        }
      }
    };
    fetchSeasons();
  }, [selectedLeague]);

  const handleLeagueChange = (event) => {
    setSelectedLeague(event.target.value);
  };

  return (
    <div>
      <h1>League Seasons</h1>
      <select onChange={handleLeagueChange}>
        <option value="">Select a league</option>
        {/* Add league options here */}
      </select>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {seasons.map((season) => (
            <li key={season._id}>{season.name}</li>
          ))}
        </ul>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default LeagueSeasons;