import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile } from '../../store/slices/userSlice';
import { Link } from 'react-router-dom';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  if (loading) {
    return <div>Loading...</div>;
  }
  

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container mx-auto flex justify-center items-center h-full">
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
          <Link to="/edit-profile" className="block w-full bg-gray-800 text-white py-2 px-4 rounded hover:bg-blue-600 text-center">
            Edit Profile
          </Link>
        </div>
      )}
    </div>
  );
};
export default Profile;