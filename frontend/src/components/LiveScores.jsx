import React, { useState, useEffect } from 'react';

const LiveScores = (Scores) => {
  // const [scores, setScores] = useState([]);
  // const [_match, setMatch] = useState('match1');

  // useEffect(() => {
  //   fetchLiveScores(_match).then((data) => setScores(data));
  // }, [_match]);

  // const handleMatchSwitch = (match) => {
  //   setMatch(match);
  // };

  return (
    <section className="live-scores bg-white shadow-md py-4">
      <h2 className="text-2xl font-bold mb-2">Live Scores</h2>
      <ul className="flex flex-wrap justify-center">
        {/* {scores.map((score) => (
          <li key={score.id} className="scorecard">
            <h3 className="text-lg font-bold">{score.team1} vs {score.team2}</h3>
            <p className="text-gray-600">{score.score}</p>
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900 py-2 px-4 rounded"
              onClick={() => handleMatchSwitch(score.match1)}
            >
              Switch to {score.match1}
            </button>
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900 py-2 px-4 rounded"
              onClick={() => handleMatchSwitch(score.match2)}
            >
              Switch to {score.match2}
            </button>
          </li>
        ))} */}
      </ul>
    </section>
  );
};

export default LiveScores;