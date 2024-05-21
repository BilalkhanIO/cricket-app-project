import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile, logoutUser, deleteUserAccount } from '../../store/slices/userSlice';
import { Link, useNavigate } from 'react-router-dom';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };
  
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      await dispatch(deleteUserAccount());
      navigate('/sign-up'); // Navigate to signup or home page after account deletion
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container mx-auto flex justify-center items-center p-8">
      {user && (
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
          <img
            src={`http://localhost:3000/${user.profilePicture}`}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover mb-4 mx-auto"
          />
          <h2 className="text-2xl font-bold mb-2 text-center">{user.name}</h2>
          <div className="border-b border-gray-300 mb-4"></div>
          <div className="text-gray-700 mb-4 space-y-2">
            <div className="flex items-center">
              <label className="font-semibold mr-2">Email:</label>
              <span>{user.email}</span>
            </div>
            <div className="flex items-center">
              <label className="font-semibold mr-2">Role:</label>
              <span>{user.role}</span>
            </div>
            <div className="flex items-center">
              <label className="font-semibold mr-2">Contact Number:</label>
              <span>{user.contactNumber}</span>
            </div>
          </div>
          <div className="border-b border-gray-300 mb-4"></div>

          <Link to="/edit-profile" className="block w-full mb-2 text-gray-800 border border-gray-300 py-2 px-4 rounded hover:bg-gray-200 text-center">
            Edit Profile
          </Link>
          <button onClick={handleLogout} disabled={loading} className='block w-full mb-2 text-gray-800 border border-gray-300 py-2 px-4 rounded hover:bg-gray-200 text-center'>
           {loading ? 'Logout...' : 'Logout'}
          </button>
          <button onClick={handleDeleteAccount} disabled={loading} className='block w-full text-red-500 border border-red-500 py-2 px-4 rounded hover:bg-red-200 text-center'>
          {loading ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
