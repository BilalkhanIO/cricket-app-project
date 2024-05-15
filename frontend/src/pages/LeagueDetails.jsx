// src/pages/LeagueDetails.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">{league.name}</h1>
      <img src={league.logo} alt={league.name} className="w-full h-60 object-cover mb-4" />
      <p>{league.description}</p>
      <h2 className="text-xl font-bold mt-4">Seasons</h2>
      <ul>
        {league.seasons.map(season => (
          <li key={season._id}>{season.name}</li>
        ))}
      </ul>
      <h2 className="text-xl font-bold mt-4">Teams</h2>
      <ul>
        {league.teams.map(team => (
          <li key={team._id}>{team.name}</li>
        ))}
      </ul>
      <h2 className="text-xl font-bold mt-4">Matches</h2>
      <ul>
        {league.matches.map(match => (
          <li key={match._id}>{match.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default LeagueDetails;