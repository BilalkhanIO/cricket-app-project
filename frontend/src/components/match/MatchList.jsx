// src/pages/MatchList.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MatchCard from '../components/MatchCard';
import MatchCreate from '../components/MatchCreate'; // Import the MatchCreate component

const MatchList = () => {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get('/api/matches');
        setMatches(response.data.matches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Matches</h1>
      <MatchCreate /> {/* Include the MatchCreate component for creating a new match */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map(match => (
          <MatchCard key={match._id} match={match} />
        ))}
      </div>
      <MatchStatsList /> {/* Include the MatchStatsList component */}
    </div>
  );
};

export default MatchList;