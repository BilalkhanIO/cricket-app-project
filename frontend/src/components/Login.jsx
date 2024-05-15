import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const Navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/user/login', formData);
      console.log(response.data); // Handle successful login response
      alert('Login successful');
      Navigate('/');
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pt-6">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">Log In to Your Account</h1>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-4">
          <label className="block text-gray-700">Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 rounded border focus:outline-none focus:border-blue-500 mb-4" />
          <label className="block text-gray-700">Password:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 rounded border focus:outline-none focus:border-blue-500 mb-4" />
          <p className="text-center mb-8 text-gray-600">Don't have an account? <Link to="/sign-up" className='text-blue-500'>Sign up here</Link></p>
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">SIGN IN</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
