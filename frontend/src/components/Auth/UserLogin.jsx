import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../store/slices/userSlice';
import { Link, useNavigate } from 'react-router-dom';

const UserLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, loading } = useSelector(state => state.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/profile');
    }
  };

  return (
   
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white shadow-lg rounded-lg px-8 pb-8">
    <div className="mb-4">
      <label htmlFor="email" className="block text-gray-700">
        Email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mt-1"
        required
      />
    </div>
    <div className="mb-4">
      <label htmlFor="password" className="block text-gray-700">
        Password
      </label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mt-1"
        required
      />
    </div>
    {error && <div className="text-red-500 mb-4">{error}</div>}
    <p className="text-center mb-8 text-gray-600">
      Don't have an account? <Link to="/sign-up" className="text-gray-800">Sign up here</Link>
    </p>
    <button
      type="submit"
      className="w-full bg-gray-800 text-white  font-medium p-2 rounded hover:bg-gray-900"
      disabled={loading}
    >
      {loading ? 'Logging in...' : 'Login'}
    </button>
    <p className="text-center mt-4 text-red-600">{error}</p>
  </form>
   
  );
};

export default UserLogin;
