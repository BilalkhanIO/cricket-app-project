// src/components/MatchStatsUpdate.js

import React, { useState } from 'react';
import axios from 'axios';

const MatchStatsUpdate = ({ matchStatId }) => {
  const [formData, setFormData] = useState({
    runsScored: '',
    ballsFaced: '',
    fours: '',
    sixes: '',
    strikeRate: '',
    wicketsTaken: '',
    runsConceded: '',
    overs: '',
    maidens: '',
    economy: '',
    catches: '',
    stumpings: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`/api/matchStats/${matchStatId}`, formData);
      alert('Match stats updated successfully');
    } catch (error) {
      console.error('Error updating match stats:', error);
      alert('An error occurred while updating match stats');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Update Match Stats</h1>
      <form onSubmit={handleSubmit}>
        <label>Runs Scored:</label>
        <input type="number" name="runsScored" value={formData.runsScored} onChange={handleChange} required />
        <label>Balls Faced:</label>
        <input type="number" name="ballsFaced" value={formData.ballsFaced} onChange={handleChange} required />
        {/* Add more form fields for other stats */}
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Update Match Stats</button>
      </form>
    </div>
  );
};

export default MatchStatsUpdate;
