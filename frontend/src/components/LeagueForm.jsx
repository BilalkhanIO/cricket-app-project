// components/LeagueForm.js
import React, { useState } from 'react';
import axios from 'axios';

const LeagueForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leagueLogo, setLeagueLogo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('leagueLogo', leagueLogo);

    try {
      await axios.post('/api/leagues', formData);
      // Reset form fields after successful submission
      setName('');
      setDescription('');
      setLeagueLogo(null);
    } catch (error) {
      console.error('Error creating league:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white shadow-md rounded">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="League Name"
        className="w-full mb-4 p-2 border rounded"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full mb-4 p-2 border rounded"
      ></textarea>
      <input
        type="file"
        onChange={(e) => setLeagueLogo(e.target.files[0])}
        className="w-full mb-4"
      />
      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Submit
      </button>
    </form>
  );
};

export default LeagueForm;