// src/components/TeamCard.js

import React from 'react';

const TeamCard = ({ team }) => {
  return (
    <div className="bg-white shadow-md p-4 rounded-lg mb-4">
      <img src={team.logo} alt={team.name} className="w-20 h-20 mb-4" />
      <h2 className="text-lg font-bold">{team.name}</h2>
      <p>League: {team.league.name}</p>
      <p>Season: {team.season.name}</p>
    </div>
  );
};

export default TeamCard;