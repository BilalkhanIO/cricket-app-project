import React, { useState } from 'react';

const MyFavTeams = () => {
  const [favoriteTeams, setFavoriteTeams] = useState([]);

  const handleAddFavoriteTeam = (team) => {
    setFavoriteTeams((prevTeams) => [...prevTeams, team]);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Component</h1>
      <p className="text-lg">
        This is an example of a component with customization options.
      </p>
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded"
        onClick={() => handleAddFavoriteTeam('Team 1')}
      >
        Add Team 1 to Favorites
      </button>
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded"
        onClick={() => handleAddFavoriteTeam('Team 2')}
      >
        Add Team 2 to Favorites
      </button>
      <h2 className="text-xl font-bold mb-2">Favorite Teams</h2>
      <ul>
        {favoriteTeams.map((team) => (
          <li key={team}>{team}</li>
        ))}
      </ul>
    </div>
  );
};

export default MyFavTeams;