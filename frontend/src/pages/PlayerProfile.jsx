// src/pages/PlayerProfile.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PlayerProfile = () => {
  const [player, setPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    playerType: '',
    teamId: '',
  });

  useEffect(() => {
    const fetchPlayerDetails = async () => {
      try {
        const response = await axios.get(`/api/players/${myUserId}`);
        setPlayer(response.data.player);
        setFormData({
          name: response.data.player.name,
          bio: response.data.player.bio,
          playerType: response.data.player.playerType,
          teamId: response.data.player.team._id,
        });
      } catch (error) {
        console.error('Error fetching player details:', error);
      }
    };

    fetchPlayerDetails();
  }, [myUserId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`/api/players/${player._id}`, formData);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating profile');
    }
  };

  if (!player) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Player Profile</h1>
      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        <label>Bio:</label>
        <textarea name="bio" value={formData.bio} onChange={handleChange} required />
        <label>Player Type:</label>
        <select name="playerType" value={formData.playerType} onChange={handleChange} required>
          <option value="">Select player type</option>
          <option value="batsman">Batsman</option>
          <option value="bowler">Bowler</option>
          <option value="all_rounder">All-Rounder</option>
          <option value="wicket_keeper">Wicket Keeper</option>
        </select>
        <label>Team:</label>
        <select name="teamId" value={formData.teamId} onChange={handleChange} required>
          <option value="">Select team</option>
          {/* Fetch and populate team options */}
        </select>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Update Profile</button>
      </form>
    </div>
  );
};

export default PlayerProfile;