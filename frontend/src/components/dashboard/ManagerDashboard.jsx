import React from 'react';

const ManagerDashboard = () => {
  // Sample data for team members, upcoming matches, team statistics, and notifications
  const teamMembers = [
    { id: 1, name: 'Player 1', role: 'Captain', email: 'player1@example.com' },
    { id: 2, name: 'Player 2', role: 'Batsman', email: 'player2@example.com' },
    // Add more team members as needed
  ];

  const upcomingMatches = [
    { id: 1, date: '2024-05-15', time: '10:00 AM', opponent: 'Team A' },
    { id: 2, date: '2024-05-20', time: '2:00 PM', opponent: 'Team B' },
    // Add more matches as needed
  ];

  const teamStatistics = {
    winLossRecord: '5-2', // Example win-loss record
    battingAverage: '35.75',
    bowlingAverage: '22.50',
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
          <h2 className="text-lg font-semibold mb-4">Team Management</h2>
          <ul>
            {teamMembers.map(member => (
              <li key={member.id} className="mb-2">
                <span>{member.name} - {member.role}</span>
                <span className="ml-2">{member.email}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <a href="/edit-roster" className="text-blue-500">Edit team roster</a>
            <span className="mx-2">|</span>
            <a href="/manage-stats" className="text-blue-500">Manage player statistics</a>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Match Scheduling</h2>
          <p>Calendar of upcoming matches and fixtures...</p>
          <a href="/schedule-matches" className="text-blue-500">Schedule new matches</a>
          <span className="mx-2">|</span>
          <a href="/edit-matches" className="text-blue-500">Edit existing matches</a>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Team Statistics</h2>
          <p>Win-Loss Record: {teamStatistics.winLossRecord}</p>
          <p>Batting Average: {teamStatistics.battingAverage}</p>
          <p>Bowling Average: {teamStatistics.bowlingAverage}</p>
          <a href="/team-stats" className="text-blue-500">View detailed statistics</a>
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

export default ManagerDashboard;
