// src/components/DeleteTeam.js

import React from 'react';
import axios from 'axios';

const DeleteTeam = ({ teamId }) => {
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/teams/${teamId}`);
      alert('Team deleted successfully');
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('An error occurred while deleting team');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Delete Team</h1>
      <p>Are you sure you want to delete this team?</p>
      <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded mt-4">Delete Team</button>
    </div>
  );
};

export default DeleteTeam;