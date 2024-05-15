// src/components/LeagueCard.js

import React from 'react';
import { Link } from 'react-router-dom';

const LeagueCard = ({ league }) => {
  return (
    <div className="bg-white shadow-md p-4 rounded-lg mb-4">
      <img src={league.logo} alt={league.name} className="w-full h-40 object-cover mb-2" />
      <h2 className="text-lg font-bold">{league.name}</h2>
      <p className="text-sm text-gray-500">{league.description}</p>
      <Link to={`/leagues/${league._id}`} className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block">
        View League
      </Link>
    </div>
  );
};

export default LeagueCard;