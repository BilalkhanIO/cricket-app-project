// components/LeagueList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const LeagueList = () => {
  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await axios.get('/api/leagues');
        setLeagues(response.data.leagues);
      } catch (error) {
        console.error('Error fetching leagues:', error);
      }
    };

    fetchLeagues();
  }, []);

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Leagues</h2>
      <ul>
        {leagues.map((league) => (
          <li key={league._id} className="bg-white shadow-md rounded p-4 mb-4">
            <img src={league.leagueLogo} alt="League Logo" className="mb-4" />
            <h3 className="text-xl font-bold">{league.name}</h3>
            <p className="mb-2">{league.description}</p>
            <div className="flex justify-end">
              <Link to={`/leagues/${league._id}`} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
                View
              </Link>
              <Link to={`/leagues/${league._id}/edit`} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2">
                Edit
              </Link>
              <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeagueList;