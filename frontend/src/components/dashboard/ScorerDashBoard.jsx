import React from 'react';

const ScorerDashboard = () => {
  // Sample data for live score updates, match statistics, and notifications
  const liveScoreUpdates = [
    { id: 1, matchId: 101, teamA: 'Team A', teamB: 'Team B', score: 'Team A - 150/3 (20 overs)' },
    { id: 2, matchId: 102, teamA: 'Team C', teamB: 'Team D', score: 'Team D - 90/2 (12 overs)' },
    // Add more live score updates as needed
  ];

  const matchStatistics = [
    { id: 1, matchId: 101, team: 'Team A', runs: 150, wickets: 3 },
    { id: 2, matchId: 102, team: 'Team D', runs: 90, wickets: 2 },
    // Add more match statistics as needed
  ];

  const notifications = [
    { id: 1, message: 'Live score update: Team A - 150/3 (20 overs)' },
    { id: 2, message: 'New match scheduled for next week' },
    // Add more notifications as needed
  ];

  return (
    <div className="container mx-auto mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Live Score Updates</h2>
          <ul>
            {liveScoreUpdates.map(update => (
              <li key={update.id} className="mb-2">{update.score}</li>
            ))}
          </ul>
          <a href="/scorecards" className="text-blue-500">View detailed scorecards and match statistics</a>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Match Statistics</h2>
          <ul>
            {matchStatistics.map(stats => (
              <li key={stats.id} className="mb-2">{stats.team} - Runs: {stats.runs}, Wickets: {stats.wickets}</li>
            ))}
          </ul>
          <a href="/match-statistics" className="text-blue-500">View detailed statistics and past performances</a>
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

export default ScorerDashboard;
