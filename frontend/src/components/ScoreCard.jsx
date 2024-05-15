// src/components/ScorecardCard.js

import React from 'react';

const ScorecardCard = ({ scorecard }) => {
  return (
    <div className="bg-white shadow-md p-4 rounded-lg mb-4">
      <h2 className="text-lg font-bold">Match: {scorecard.match.name}</h2>
      <p>Result: {scorecard.result}</p>
      {/* Display innings information and other relevant details */}
    </div>
  );
};

export default ScorecardCard;