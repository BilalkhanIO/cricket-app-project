// src/components/MatchStatsCard.js

import React from 'react';

const MatchStatsCard = ({ matchStat }) => {
  return (
    <div className="bg-white shadow-md p-4 rounded-lg mb-4">
      <h2 className="text-lg font-bold">{matchStat.player.name}</h2>
      <p>Match: {matchStat.match.name}</p>
      <p>Runs Scored: {matchStat.runsScored}</p>
      <p>Balls Faced: {matchStat.ballsFaced}</p>
      {/* Add more stats as needed */}
    </div>
  );
};

export default MatchStatsCard;