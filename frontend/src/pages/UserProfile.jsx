// src/pages/UserProfile.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfile = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/user/profile');
        const userData = response.data;
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">User Profile</h1>
      <div className="bg-white shadow-md p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Account Information</h2>
        <p>Username: {user.name}</p>
        <p>Email: {user.email}</p>
        <p>Phone Number: {user.contactNumber}</p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Edit Profile</button>
      </div>
    </div>
  );
};

export default UserProfile;