import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import AdminDashboardCharts from "./AdminDashboardCharts";

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    leaguesCount,
    teamsCount,
    playersCount,
    matchesCount,
    liveMatches,
    upcomingMatches,
    completedMatches,
    pendingTeams,
    usersCount,
    recentAnnouncements,
    recentAuditLogs,
    todayBallEvents,
  ] = await Promise.all([
    prisma.league.count(),
    prisma.team.count(),
    prisma.player.count(),
    prisma.match.count(),
    prisma.match.findMany({
      where: { status: "LIVE" },
      include: {
        homeTeam: { select: { shortName: true } },
        awayTeam: { select: { shortName: true } },
        innings: { select: { totalRuns: true, totalWickets: true, teamId: true } },
      },
      take: 5,
    }),
    prisma.match.count({ where: { status: "UPCOMING" } }),
    prisma.match.count({ where: { status: "COMPLETED" } }),
    prisma.teamLeague.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
      take: 5,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }).catch(() => []),
    prisma.ballEvent.findMany({
      where: { createdAt: { gte: today } },
      select: { runs: true, isWicket: true, extraRuns: true },
    }).catch(() => []),
  ]);

  // Match completion rate by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const recentMatches = await prisma.match.findMany({
    where: { matchDate: { gte: sixMonthsAgo } },
    select: { matchDate: true, status: true },
  });

  // Player registration trend (last 6 months)
  const recentPlayers = await prisma.player.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  // Calculate today's stats
  const todayRuns = todayBallEvents.reduce((s, b) => s + b.runs + b.extraRuns, 0);
  const todayWickets = todayBallEvents.filter((b) => b.isWicket).length;

  // Prepare monthly data
  const monthlyData: Record<string, { month: string; total: number; completed: number; players: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    monthlyData[key] = { month: label, total: 0, completed: 0, players: 0 };
  }

  recentMatches.forEach((m) => {
    const d = new Date(m.matchDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthlyData[key]) {
      monthlyData[key].total++;
      if (m.status === "COMPLETED") monthlyData[key].completed++;
    }
  });

  recentPlayers.forEach((p) => {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthlyData[key]) {
      monthlyData[key].players++;
    }
  });

  const chartData = Object.values(monthlyData);

  return {
    leaguesCount,
    teamsCount,
    playersCount,
    matchesCount,
    liveMatches,
    upcomingMatches,
    completedMatches,
    pendingTeams,
    usersCount,
    recentAnnouncements,
    recentAuditLogs,
    todayRuns,
    todayWickets,
    chartData,
  };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const statCards = [
    { label: "Total Leagues", value: stats.leaguesCount, icon: "🏆", href: "/admin/leagues", color: "bg-purple-50 border-purple-100" },
    { label: "Total Teams", value: stats.teamsCount, icon: "👕", href: "/admin/teams", color: "bg-blue-50 border-blue-100" },
    { label: "Total Players", value: stats.playersCount, icon: "🏏", href: "/admin/players", color: "bg-[#F7FBFC] border-[#D6E6F2]" },
    { label: "Total Matches", value: stats.matchesCount, icon: "📅", href: "/admin/matches", color: "bg-orange-50 border-orange-100" },
    { label: "Live Now", value: stats.liveMatches.length, icon: "⚡", href: "/admin/matches?status=LIVE", color: "bg-red-50 border-red-100" },
    { label: "Upcoming", value: stats.upcomingMatches, icon: "📆", href: "/admin/matches?status=UPCOMING", color: "bg-sky-50 border-sky-100" },
    { label: "Completed", value: stats.completedMatches, icon: "✅", href: "/admin/matches?status=COMPLETED", color: "bg-emerald-50 border-emerald-100" },
    { label: "Pending Approvals", value: stats.pendingTeams, icon: "⏳", href: "/admin/teams?pending=true", color: "bg-yellow-50 border-yellow-100" },
    { label: "Registered Users", value: stats.usersCount, icon: "👥", href: "/admin/users", color: "bg-indigo-50 border-indigo-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/leagues/new" className="bg-[#769FCD] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5A8BBE]">
            + New League
          </Link>
          <Link href="/admin/matches/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Schedule Match
          </Link>
        </div>
      </div>

      {/* Today's Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Runs Scored Today", value: stats.todayRuns, icon: "🏏", color: "bg-[#F7FBFC] border-[#D6E6F2]" },
          { label: "Wickets Today", value: stats.todayWickets, icon: "🎳", color: "bg-red-50 border-red-200" },
          { label: "Live Matches", value: stats.liveMatches.length, icon: "⚡", color: "bg-orange-50 border-orange-200" },
          { label: "Pending Approvals", value: stats.pendingTeams, icon: "⏳", color: "bg-yellow-50 border-yellow-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className={`rounded-xl border p-4 hover:shadow-md transition-shadow ${stat.color}`}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <AdminDashboardCharts chartData={stats.chartData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Matches */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
              Live Matches
            </h2>
            <Link href="/matches" className="text-[#769FCD] text-sm hover:underline">View all</Link>
          </div>
          <CardBody className="p-0">
            {stats.liveMatches.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">No live matches</p>
            ) : (
              stats.liveMatches.map((m) => (
                <Link key={m.id} href={`/scorer/${m.id}`}>
                  <div className="flex items-center justify-between px-6 py-3 border-b border-gray-50 hover:bg-gray-50 last:border-0">
                    <span className="text-sm font-medium">{m.homeTeam.shortName} vs {m.awayTeam.shortName}</span>
                    <div className="flex items-center gap-2">
                      {m.innings.map((i) => (
                        <span key={i.teamId} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
                          {i.totalRuns}/{i.totalWickets}
                        </span>
                      ))}
                      <span className="text-xs text-[#769FCD] hover:underline">Score →</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Announcements</h2>
            <Link href="/admin/announcements" className="text-[#769FCD] text-sm hover:underline">Manage</Link>
          </div>
          <CardBody className="p-0">
            {stats.recentAnnouncements.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">No announcements</p>
            ) : (
              stats.recentAnnouncements.map((ann) => (
                <div key={ann.id} className="px-6 py-3 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-gray-900">{ann.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">by {ann.author.name}</p>
                </div>
              ))
            )}
            <div className="px-6 py-3">
              <Link href="/admin/announcements/new" className="text-[#769FCD] text-sm hover:underline">
                + New Announcement
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Audit Logs */}
      {stats.recentAuditLogs.length > 0 && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Activity Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Action</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Entity</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAuditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{log.action}</td>
                    <td className="px-4 py-2 text-gray-600">{log.entity}</td>
                    <td className="px-4 py-2 text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Quick Actions</h2>
        </div>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: "Create League", href: "/admin/leagues/new", icon: "🏆" },
              { label: "Add Team", href: "/admin/teams/new", icon: "👕" },
              { label: "Schedule Match", href: "/admin/matches/new", icon: "📅" },
              { label: "Add Venue", href: "/admin/venues/new", icon: "🏟️" },
              { label: "Post Announcement", href: "/admin/announcements/new", icon: "📢" },
              { label: "View Live Scores", href: "/matches", icon: "⚡" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-[#F7FBFC] border border-gray-200 hover:border-[#B9D7EA] rounded-xl transition-colors text-center"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-xs font-medium text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Seed Data Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800 text-sm font-medium mb-1">Demo Data</p>
        <p className="text-blue-600 text-xs">
          No data yet? Run the seeder to populate with sample data:{" "}
          <code className="bg-blue-100 px-2 py-0.5 rounded text-blue-700">POST /api/seed</code>
          {" "}— this will create leagues, teams, players and a sample match.
        </p>
      </div>
    </div>
  );
}
