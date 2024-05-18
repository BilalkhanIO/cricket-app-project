// src/components/PlayerCard.js

import { Link } from 'react-router-dom';

const PlayerCard = ({ player }) => {
  return (
    <div className="bg-white shadow-md p-4 rounded-lg mb-4">
      <h2 className="text-lg font-bold">{player.name}</h2>
      {/* Other player details */}
      <Link to={`/players/${player._id}/profile`} className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block">
        View Profile
      </Link>
    </div>
  );
};

export default PlayerCard;