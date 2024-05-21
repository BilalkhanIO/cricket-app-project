// src/components/DeleteSeason.js

import React from 'react';
import axios from 'axios';

const DeleteSeason = ({ seasonId }) => {
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/seasons/${seasonId}`);
      alert('Season deleted successfully');
    } catch (error) {
      console.error('Error deleting season:', error);
      alert('An error occurred while deleting season');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Delete Season</h1>
      <p>Are you sure you want to delete this season?</p>
      <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded mt-4">Delete Season</button>
    </div>
  );
};

export default DeleteSeason