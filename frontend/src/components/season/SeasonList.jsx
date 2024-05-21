// src/pages/SeasonList.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SeasonCard from '../components/SeasonCard';

const SeasonList = () => {
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const response = await axios.get('/api/seasons');
        setSeasons(response.data.seasons);
      } catch (error) {
        console.error('Error fetching seasons:', error);
      }
    };

    fetchSeasons();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Seasons</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {seasons.map(season => (
          <SeasonCard key={season._id} season={season} />
        ))}
      </div>
    </div>
  );
};

export default SeasonList;