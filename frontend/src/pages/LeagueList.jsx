// src/pages/LeagueList.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LeagueCard from '../components/LeagueCard';

const LeagueList = () => {
  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await axios.get('/api/leagues');
        setLeagues(response.data.leagues);
      } catch (error) {
        console.error('Error fetching leagues:', error);
      }
    };

    fetchLeagues();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Leagues</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leagues.map(league => (
          <LeagueCard key={league._id} league={league} />
        ))}
      </div>
    </div>
  );
};

export default LeagueList;