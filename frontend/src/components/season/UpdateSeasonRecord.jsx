// src/components/UpdateSeasonRecord.js

import React, { useState } from 'react';
import axios from 'axios';

const UpdateSeasonRecord = ({ seasonRecordId }) => {
  const [formData, setFormData] = useState({
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
      await axios.put(`/api/seasonRecords/${seasonRecordId}`, formData);
      alert('Season record updated successfully');
    } catch (error) {
      console.error('Error updating season record:', error);
      alert('An error occurred while updating season record');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Update Season Record</h1>
      <form onSubmit={handleSubmit}>
        {/* Add form fields for season record stats */}
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Update Season Record</button>
      </form>
    </div>
  );
};

export default UpdateSeasonRecord;