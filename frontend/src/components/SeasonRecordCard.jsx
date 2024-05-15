// src/components/SeasonRecordCard.js

import React from 'react';

const SeasonRecordCard = ({ seasonRecord }) => {
  return (
    <div className="bg-white shadow-md p-4 rounded-lg mb-4">
      <h2 className="text-lg font-bold">{seasonRecord.player.name}</h2>
      <p>Season: {seasonRecord.season.name}</p>
      <p>Runs Scored: {seasonRecord.runsScored}</p>
      <p>Wickets Taken: {seasonRecord.wicketsTaken}</p>
      {/* Display more season record details as needed */}
    </div>
  );
};

export default SeasonRecordCard;