// src/components/SeasonCard.js

import React from 'react';

const SeasonCard = ({ season }) => {
  return (
    <div className="bg-white shadow-md p-4 rounded-lg mb-4">
      <h2 className="text-lg font-bold">{season.name}</h2>
      <p>Start Date: {season.startDate}</p>
      <p>End Date: {season.endDate}</p>
      <p>League: {season.league.name}</p>
    </div>
  );
};

export default SeasonCard;