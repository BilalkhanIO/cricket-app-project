// src/components/ScorecardDetails.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ScorecardDetails = () => {
  const { id } = useParams();
  const [scorecard, setScorecard] = useState(null);

  useEffect(() => {
    const fetchScorecardDetails = async () => {
      try {
        const response = await axios.get(`/api/scorecards/${id}`);
        setScorecard(response.data.scorecard);
      } catch (error) {
        console.error('Error fetching scorecard details:', error);
      }
    };

    fetchScorecardDetails();
  }, [id]);

  if (!scorecard) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Scorecard: {scorecard.match.name}</h1>
      <p>Result: {scorecard.result}</p>
      {/* Display innings information */}
      {scorecard.innings.map((innings, index) => (
        <div key={index}>
          <h2>Innings {index + 1} - {innings.team.name}</h2>
          <p>Runs: {innings.runs}</p>
          <p>Wickets: {innings.wickets}</p>
          <p>Overs: {innings.overs}</p>
          {/* Display batting and bowling statistics */}
          <h3>Batting</h3>
          {innings.batting.map(batsman => (
            <div key={batsman._id}>
              <p>{batsman.batsman.name} - {batsman.runsScored} runs off {batsman.ballsFaced} balls</p>
            </div>
          ))}
          <h3>Bowling</h3>
          {innings.bowling.map(bowler => (
            <div key={bowler._id}>
              <p>{bowler.bowler.name} - {bowler.overs} overs, {bowler.wickets} wickets, {bowler.runsConceded} runs conceded</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ScorecardDetails;