import React from 'react';
import axios from 'axios';

const DeleteSeasonRecord = ({ seasonRecordId }) => {
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/seasonRecords/${seasonRecordId}`);
      alert('Season record deleted successfully');
    } catch (error) {
      console.error('Error deleting season record:', error);
      alert('An error occurred while deleting season record');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Delete Season Record</h1>
      <p>Are you sure you want to delete this season record?</p>
      <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded mt-4">Delete Season Record</button>
    </div>
  );
};

export default DeleteSeasonRecord;