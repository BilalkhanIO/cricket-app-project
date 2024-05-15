// src/components/UserProfileUpdate.js

import React, { useState } from 'react';
import axios from 'axios';

const UserProfileUpdate = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    profilePicture: null,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, profilePicture: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userData = new FormData();
    userData.append('name', formData.name);
    userData.append('email', formData.email);
    userData.append('contactNumber', formData.contactNumber);
    userData.append('profilePicture', formData.profilePicture);

    try {
      await axios.put('/api/user/profile', userData);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating profile');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Update Profile</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        <label>Contact Number:</label>
        <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
        <label>Profile Picture:</label>
        <input type="file" name="profilePicture" onChange={handleFileChange} />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Update Profile</button>
      </form>
    </div>
  );
};

export default UserProfileUpdate;