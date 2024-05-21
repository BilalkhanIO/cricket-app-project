// src/pages/MatchStatsList.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MatchStatsCard from '../components/MatchStatsCard';

const MatchStatsList = () => {
  const [matchStats, setMatchStats] = useState([]);

  useEffect(() => {
    const fetchMatchStats = async () => {
      try {
        const response = await axios.get('/api/matchStats');
        setMatchStats(response.data.matchStats);
      } catch (error) {
        console.error('Error fetching match stats:', error);
      }
    };

    fetchMatchStats();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Match Statistics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matchStats.map(matchStat => (
          <MatchStatsCard key={matchStat._id} matchStat={matchStat} />
        ))}
      </div>
    </div>
  );
};

export default MatchStatsList;