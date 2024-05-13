import React from 'react';

const PlayerDashboard = () => {
  // Sample data for upcoming matches, team information, personal statistics, and notifications
  const upcomingMatches = [
    { id: 1, date: '2024-05-15', time: '10:00 AM', opponent: 'Team A' },
    { id: 2, date: '2024-05-20', time: '2:00 PM', opponent: 'Team B' },
    // Add more matches as needed
  ];

  const teamInfo = {
    name: 'Team X',
    logoUrl: '/team-logo.png', // Replace with actual logo URL
    standing: '1st Place', // Example standing
  };

  const personalStats = {
    battingAverage: '50.25',
    bowlingAverage: '20.10',
  };

  const notifications = [
    { id: 1, message: 'Upcoming match against Team A on May 15, 2024' },
    { id: 2, message: 'Team meeting scheduled for May 18, 2024' },
    // Add more notifications as needed
  ];

  return (
    <div className="container mx-auto mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Upcoming Matches</h2>
          <ul>
            {upcomingMatches.map(match => (
              <li key={match.id} className="mb-2">
                <span>{match.date} - {match.time}: </span>
                <span>{match.opponent}</span>
                <a href={`/matches/${match.id}`} className="text-blue-500 ml-2">View details</a>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Team Information</h2>
          <div className="flex items-center mb-4">
            <img src={teamInfo.logoUrl} alt="Team Logo" className="w-8 h-8 mr-2" />
            <span>{teamInfo.name}</span>
          </div>
          <p>Standing: {teamInfo.standing}</p>
          <a href="/team-roster" className="text-blue-500">View roster and statistics</a>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Personal Statistics</h2>
          <p>Batting Average: {personalStats.battingAverage}</p>
          <p>Bowling Average: {personalStats.bowlingAverage}</p>
          <a href="/personal-stats" className="text-blue-500">View detailed statistics</a>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <ul>
            {notifications.map(notification => (
              <li key={notification.id} className="mb-2">{notification.message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
