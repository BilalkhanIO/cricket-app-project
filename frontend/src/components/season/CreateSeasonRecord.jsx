// src/components/CreateSeasonRecord.js

import React, { useState } from 'react';
import axios from 'axios';

const CreateSeasonRecord = () => {
  const [formData, setFormData] = useState({
    playerId: '',
    seasonId: '',
    runsScored: '',
    wicketsTaken: '',
    // Add more form fields for season record stats
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('/api/seasonRecords/create', formData);
      alert('Season record created successfully');
    } catch (error) {
      console.error('Error creating season record:', error);
      alert('An error occurred while creating season record');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Create Season Record</h1>
      <form onSubmit={handleSubmit}>
        {/* Add form fields for player, season, and season record stats */}
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Create Season Record</button>
      </form>
    </div>
  );
};

export default CreateSeasonRecord;