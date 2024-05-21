// src/pages/ScorecardList.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ScorecardCard from '../components/ScorecardCard';

const ScorecardList = () => {
  const [scorecards, setScorecards] = useState([]);

  useEffect(() => {
    const fetchScorecards = async () => {
      try {
        const response = await axios.get('/api/scorecards');
        setScorecards(response.data.scorecards);
      } catch (error) {
        console.error('Error fetching scorecards:', error);
      }
    };

    fetchScorecards();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Scorecards</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scorecards.map(scorecard => (
          <ScorecardCard key={scorecard._id} scorecard={scorecard} />
        ))}
      </div>
    </div>
  );
};

export default ScorecardList;