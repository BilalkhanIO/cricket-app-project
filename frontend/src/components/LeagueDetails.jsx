// components/LeagueDetails.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const LeagueDetails = () => {
  const { id } = useParams();
  const [league, setLeague] = useState(null);

  useEffect(() => {
    const fetchLeagueDetails = async () => {
      try {
        const response = await axios.get(`/api/leagues/${id}`);
        setLeague(response.data.league);
      } catch (error) {
        console.error('Error fetching league details:', error);
      }
    };

    fetchLeagueDetails();
  }, [id]);

  if (!league) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">{league.name}</h2>
      <p className="mb-4">{league.description}</p>
      <img src={league.leagueLogo} alt="League Logo" className="mb-4" />
      <h3 className="text-xl font-bold mb-2">Seasons</h3>
      <ul className="mb-4">
        {league.seasons.map((season) => (
          <li key={season._id}>{season.name}</li>
        ))}
      </ul>
      <h3 className="text-xl font-bold mb-2">Teams</h3>
      <ul className="mb-4">
        {league.teams.map((team) => (
          <li key={team._id}>{team.name}</li>
        ))}
      </ul>
      <h3 className="text-xl font-bold mb-2">Matches</h3>
      <ul>
        {league.matches.map((match) => (
          <li key={match._id}>
            {match.team1.name} vs {match.team2.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeagueDetails;