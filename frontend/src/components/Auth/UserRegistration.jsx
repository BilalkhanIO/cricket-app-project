import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../store/slices/userSlice';
import { useNavigate , Link} from 'react-router-dom';

const Register = () => {
const dispatch = useDispatch();
const navigate = useNavigate();
const { error, loading } = useSelector(state => state.user);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser(formData));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/login');
    }
  };

  return (
    
      <form onSubmit={handleSubmit} encType="multipart/form-data" className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-8">
      <p className="text-lg text-center mb-8 text-gray-600">
      Create and manage your cricket league. Stay informed on league activities.
      </p>
      <div className="mb-4">
          <label className="block text-gray-700">Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 rounded border focus:outline-none focus:border-gray-500" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 rounded border focus:outline-none focus:border-gray-500" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Contact Number:</label>
          <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full px-3 py-2 rounded border focus:outline-none focus:border-gray-500" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Password:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 rounded border focus:outline-none focus:border-gray-500" />
        </div>
       
        <p className="text-center mb-8 text-gray-600">Already have an account? <Link to="/Login" className="text-gray-800">Sign in here</Link></p>
        <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded w-full" disabled={loading}>
          {loading ? 'Loading...' : 'SIGN UP'}
        </button>
          {error && <p className="text-red-500">{error.message}</p>}
      </form>
  );
};

export default Register;
