import React, { useState } from 'react';
import axios from 'axios';

const ScorecardUpdate = ({ scorecardId }) => {
  const [formData, setFormData] = useState({
    innings: [
      {
        team: '',
        runs: '',
        wickets: '',
        overs: '',
        batting: [
          {
            batsman: '',
            runsScored: '',
            ballsFaced: '',
            fours: '',
            sixes: '',
            strikeRate: '',
          },
        ],
        bowling: [
          {
            bowler: '',
            overs: '',
            wickets: '',
            runsConceded: '',
            economy: '',
          },
        ],
      },
    ],
    extras: '',
    result: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`/api/scorecards/${scorecardId}`, formData);
      alert('Scorecard updated successfully');
    } catch (error) {
      console.error('Error updating scorecard:', error);
      alert('An error occurred while updating scorecard');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Update Scorecard</h1>
      <form onSubmit={handleSubmit}>
        {/* Innings form fields */}
        <label>Team:</label>
        <input type="text" name="team" value={formData.innings[0].team} onChange={handleChange} required />
        <label>Runs:</label>
        <input type="number" name="runs" value={formData.innings[0].runs} onChange={handleChange} required />
        {/* Add more form fields for innings, batting, and bowling */}
        <label>Extras:</label>
        <input type="text" name="extras" value={formData.extras} onChange={handleChange} />
        <label>Result:</label>
        <input type="text" name="result" value={formData.result} onChange={handleChange} required />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Update Scorecard</button>
      </form>
    </div>
  );
};

export default ScorecardUpdate;