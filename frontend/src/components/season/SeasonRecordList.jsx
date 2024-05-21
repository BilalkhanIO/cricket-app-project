// src/pages/SeasonRecordList.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SeasonRecordCard from '../components/SeasonRecordCard';

const SeasonRecordList = () => {
  const [seasonRecords, setSeasonRecords] = useState([]);

  useEffect(() => {
    const fetchSeasonRecords = async () => {
      try {
        const response = await axios.get('/api/seasonRecords');
        setSeasonRecords(response.data.seasonRecords);
      } catch (error) {
        console.error('Error fetching season records:', error);
      }
    };

    fetchSeasonRecords();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Season Records</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {seasonRecords.map(seasonRecord => (
          <SeasonRecordCard key={seasonRecord._id} seasonRecord={seasonRecord} />
        ))}
      </div>
    </div>
  );
};

export default SeasonRecordList;