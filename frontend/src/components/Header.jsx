import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/react.svg';

const Header = () => {
  return (
    <header className="flex items-center justify-between py-4 bg-gray-200">
      <div className="logo">
        <img src={logo} alt="App Logo" />
      </div>
      <nav className="flex items-center">
        <ul className="flex items-center">
          <li>
            <Link to="/live-scores">
              <a className="text-gray-600 hover:text-gray-900">
                Live Scores
              </a>
            </Link>
          </li>
          <li>
            <Link to="/teams">
              <a className="text-gray-600 hover:text-gray-900">
                Teams
              </a>
            </Link>
          </li>
          <li>
            <Link to="/players">
              <a className="text-gray-600 hover:text-gray-900">
                Players
              </a>
            </Link>
          </li>
          <li>
            <Link to="/league-standings">
              <a className="text-gray-600 hover:text-gray-900">
                Standings
              </a>
            </Link>
          </li>
          { /* Optional search bar */ }
          <li>
            <input
              type="search"
              placeholder="Search..."
              className="bg-white border border-gray-300 rounded py-2 px-4"
            />
          </li>
        </ul>
      </nav>
      { /* Optional user login/logout options */ }
      <div className="user-actions">
        { /* Login/Logout button */ }
        <button className="bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900 py-2 px-4 rounded">
         <Link to="registration">Login/Logout</Link> 
        </button>
      </div>
    </header>
  );
};

export default Header;