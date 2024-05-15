// src/components/MatchCard.js

import React from 'react';

const MatchCard = ({ match }) => {
  return (
    <div className="bg-white shadow-md p-4 rounded-lg mb-4">
      <h2 className="text-lg font-bold">{match.name}</h2>
      <p>Date: {match.date}</p>
      <p>Teams: {match.team1.name} vs {match.team2.name}</p>
      <p>Venue: {match.venue}</p>
      <p>Details: {match.details}</p>
    </div>
  );
};

export default MatchCard;