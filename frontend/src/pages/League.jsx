import React from 'react';
import LeagueList from '../components/league/LeagueList';
import { Link } from 'react-router-dom';

function League() {
  return (
    <div>
      <Link to='/leagues/create' className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Create League</Link>
      <LeagueList/>
    </div>
  )
}

export default League