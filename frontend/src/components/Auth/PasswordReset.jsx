import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { requestPasswordReset } from '../../store/slices/userSlice';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const { error, loading } = useSelector(state => state.user);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(requestPasswordReset({ email }));
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Password Reset</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
          />
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Requesting...' : 'Request Password Reset'}
        </button>
      </form>
    </div>
  );
};

export default PasswordReset;
