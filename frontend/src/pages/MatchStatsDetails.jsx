// src/pages/MatchStatsDetails.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const MatchStatsDetails = () => {
  const { id } = useParams();
  const [matchStat, setMatchStat] = useState(null);

  useEffect(() => {
    const fetchMatchStatDetails = async () => {
      try {
        const response = await axios.get(`/api/matchStats/${id}`);
        setMatchStat(response.data.matchStat);
      } catch (error) {
        console.error('Error fetching match stats details:', error);
      }
    };

    fetchMatchStatDetails();
  }, [id]);

  if (!matchStat) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">{matchStat.player.name}'s Match Stats</h1>
      <p>Match: {matchStat.match.name}</p>
      <p>Runs Scored: {matchStat.runsScored}</p>
      <p>Balls Faced: {matchStat.ballsFaced}</p>
      {/* Display more stats as needed */}
    </div>
  );
};

export default MatchStatsDetails;