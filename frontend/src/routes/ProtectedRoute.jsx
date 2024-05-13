import React from 'react';
// import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
//   const isAuthenticated = useSelector((state) => state.auth.token); // Assuming you're using Redux for state management
const isAuthenticated = localStorage.getItem('token'); // Check if user is authenticated
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;