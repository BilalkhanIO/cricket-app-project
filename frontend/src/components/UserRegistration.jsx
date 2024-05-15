import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const UserRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contactNumber: '',
    playerPicture: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' }); // Clear error for the changed field
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, profilePicture: e.target.files[0] });
    setErrors({ ...errors, playerPicture: '' }); // Clear error for the profile picture
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form fields
    const validationErrors = {};
    if (!formData.name) {
      validationErrors.name = 'Name is required';
    }
    if (!formData.email) {
      validationErrors.email = 'Email is required';
    }
    if (!formData.password) {
      validationErrors.password = 'Password is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:3000/api/user/register', formData);
      console.log('User data:', response.data);
      alert('Registration successful');
    } catch (error) {
      console.error('Error registering user:', error);
      alert('An error occurred while registering');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pt-6">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">Join the Cricket Community</h1>
        <p className="text-lg text-center mb-8 text-gray-600">
          Sign up to access exclusive features, connect with other cricket enthusiasts, and stay updated on the latest cricket news and events.
        </p>
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-4">
          <div className="mb-4">
            <label className="block text-gray-700">Name:</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 rounded border focus:outline-none focus:border-blue-500" />
            {errors.name && <p className="text-red-500">{errors.name}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Email:</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 rounded border focus:outline-none focus:border-blue-500" />
            {errors.email && <p className="text-red-500">{errors.email}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Contact Number:</label>
            <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full px-3 py-2 rounded border focus:outline-none focus:border-blue-500" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Password:</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 rounded border focus:outline-none focus:border-blue-500" />
            {errors.password && <p className="text-red-500">{errors.password}</p>}
          </div>
         
          <p className="text-center mb-8 text-gray-600">Already have an account? <Link to="/sign-in" className="text-blue-500">Sign in here</Link></p>
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full" disabled={loading}>
            {loading ? 'Loading...' : 'SIGN UP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserRegistration;
