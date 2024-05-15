// src/components/Header.js

import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          logo
        </Link>
        <ul className="flex space-x-4">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/players">Players</Link></li>
          <li><Link to="/leagues">Leagues</Link></li>
          <li><Link to="/user-profile">User Profile</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
