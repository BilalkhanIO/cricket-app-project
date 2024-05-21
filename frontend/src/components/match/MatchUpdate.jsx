// src/components/MatchUpdate.js

import React, { useState } from 'react';
import axios from 'axios';

const MatchUpdate = ({ matchId }) => {
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
      await axios.put(`/api/matches/${matchId}`, formData);
      alert('Match updated successfully');
    } catch (error) {
      console.error('Error updating match:', error);
      alert('An error occurred while updating match');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Update Match</h1>
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
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Update Match</button>
      </form>
    </div>
  );
};

export default MatchUpdate;