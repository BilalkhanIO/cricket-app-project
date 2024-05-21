// src/components/MatchCreate.js

import React, { useState } from 'react';
import axios from 'axios';

const MatchCreate = () => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    team1: '',
    team2: '',
    venue: '',
    details: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('/api/matches/create', formData);
      alert('Match created successfully');
    } catch (error) {
      console.error('Error creating match:', error);
      alert('An error occurred while creating match');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Create Match</h1>
      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        <label>Date:</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        <label>Team 1:</label>
        <input type="text" name="team1" value={formData.team1} onChange={handleChange} required />
        <label>Team 2:</label>
        <input type="text" name="team2" value={formData.team2} onChange={handleChange} required />
        <label>Venue:</label>
        <input type="text" name="venue" value={formData.venue} onChange={handleChange} required />
        <label>Details:</label>
        <textarea name="details" value={formData.details} onChange={handleChange} required />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Create Match</button>
      </form>
    </div>
  );
};

export default MatchCreate;