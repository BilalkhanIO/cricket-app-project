// src/components/LeagueCreate.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createLeague } from '../../store/slices/LeagueSlice';

const LeagueCreate = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: null,
  });
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, logo: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const leagueData = new FormData();
    leagueData.append('name', formData.name);
    leagueData.append('description', formData.description);
    leagueData.append('logo', formData.logo);

    dispatch(createLeague(leagueData));
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Create League</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        <label>Description:</label>
        <textarea name="description" value={formData.description} onChange={handleChange} required />
        <label>Logo:</label>
        <input type="file" name="logo" onChange={handleFileChange} />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Create League</button>
      </form>
    </div>
  );
};

export default LeagueCreate;
