// src/components/CreateSeason.js

import React, { useState } from 'react';
import axios from 'axios';

const CreateSeason = () => {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    leagueId: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('/api/seasons/create', formData);
      alert('Season created successfully');
    } catch (error) {
      console.error('Error creating season:', error);
      alert('An error occurred while creating season');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Create Season</h1>
      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        <label>Start Date:</label>
        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
        <label>End Date:</label>
        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
        {/* Add dropdown to select league */}
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Create Season</button>
      </form>
    </div>
  );
};

export default CreateSeason;