import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, fetchUserProfile } from '../../store/slices/userSlice';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.user);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setContactNumber(user.contactNumber);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('contactNumber', contactNumber);
    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    const result = await dispatch(updateUserProfile(formData));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/profile');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md mx-auto">
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Contact Number</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Profile Picture</label>
            <input
              type="file"
              onChange={(e) => setProfilePicture(e.target.files[0])}
              className="w-full p-2 border border-gray-300 rounded mt-1"
            />
          </div>
          {error && <div className="text-red-500 mb-4">{error.message || error}</div>}
          <button
            type="submit"
            className="w-full bg-gray-800 text-white p-2 rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
