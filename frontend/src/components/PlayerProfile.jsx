import React from 'react';

const PlayerProfile = ({ player }) => {
  return (
    <div className="player-profile bg-white shadow-md py-4">
      {/* <h3 className="text-lg font-bold mb-2">{player.name}</h3>
      {/* <img src={player.photo} alt={player.name} className="w-32 h-32 rounded-full mb-4" /> */}
      <p className="text-gray-600">
        {/* Team: {player.team} */}
      </p>
      {/* <p className="text-gray-600">
        Batting Average: {player.battingAverage}
      </p>
      <p className="text-gray-600">
        Bowling Average: {player.bowlingAverage}
      </p>
      <p className="text-gray-600">
        Recent Performance:
        {player.recentPerformance.map((performance) => (
          <span key={performance.id} className="block">
            {performance.format}: {performance.runs} runs, {performance.wickets} wickets
          </span>
        ))}
      </p>
      <p className="text-gray-600">
        Biographic Information:
        {player.biography}
      </p>  */}
    </div>
  );
};

export default PlayerProfile;