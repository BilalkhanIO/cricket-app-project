// src/components/CreateTeam.js

import React, { useState } from 'react';
import axios from 'axios';

const CreateTeam = () => {
  const [formData, setFormData] = useState({
    name: '',
    leagueId: '',
    seasonId: '',
    players: [],
    jerseyColor: '',
    standings: {},
    logo: null,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, logo: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('name', formData.name);
    data.append('leagueId', formData.leagueId);
    data.append('seasonId', formData.seasonId);
    data.append('jerseyColor', formData.jerseyColor);
    data.append('standings', JSON.stringify(formData.standings));
    data.append('logo', formData.logo);

    try {
      await axios.post('/api/teams/create', data);
      alert('Team created successfully');
    } catch (error) {
      console.error('Error creating team:', error);
      alert('An error occurred while creating team');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Create Team</h1>
      <form onSubmit={handleSubmit}>
        {/* Add form fields for team details */}
        <input type="file" name="logo" onChange={handleFileChange} />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Create Team</button>
      </form>
    </div>
  );
};

export default CreateTeam;