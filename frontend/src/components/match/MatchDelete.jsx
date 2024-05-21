// src/components/MatchDelete.js

import React from 'react';
import axios from 'axios';

const MatchDelete = ({ matchId }) => {
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/matches/${matchId}`);
      alert('Match deleted successfully');
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('An error occurred while deleting match');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Delete Match</h1>
      <p>Are you sure you want to delete this match?</p>
      <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded mt-4">Delete Match</button>
    </div>
  );
};

export default MatchDelete;