import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";

async function getDashboardStats() {
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
  ]);

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
  };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const statCards = [
    { label: "Total Leagues", value: stats.leaguesCount, icon: "🏆", href: "/admin/leagues", color: "bg-purple-50 border-purple-100" },
    { label: "Total Teams", value: stats.teamsCount, icon: "👕", href: "/admin/teams", color: "bg-blue-50 border-blue-100" },
    { label: "Total Players", value: stats.playersCount, icon: "🏏", href: "/admin/players", color: "bg-green-50 border-green-100" },
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
          <Link href="/admin/leagues/new" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            + New League
          </Link>
          <Link href="/admin/matches/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Schedule Match
          </Link>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Matches */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
              Live Matches
            </h2>
            <Link href="/matches" className="text-green-600 text-sm hover:underline">View all</Link>
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
                      <span className="text-xs text-green-600 hover:underline">Score →</span>
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
            <h2 className="font-bold text-gray-900">📢 Announcements</h2>
            <Link href="/admin/announcements" className="text-green-600 text-sm hover:underline">Manage</Link>
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
              <Link href="/admin/announcements/new" className="text-green-600 text-sm hover:underline">
                + New Announcement
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

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
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl transition-colors text-center"
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
        <p className="text-blue-800 text-sm font-medium mb-1">🌱 Demo Data</p>
        <p className="text-blue-600 text-xs">
          No data yet? Run the seeder to populate with sample data:{" "}
          <code className="bg-blue-100 px-2 py-0.5 rounded text-blue-700">POST /api/seed</code>
          {" "}— this will create leagues, teams, players and a sample match.
        </p>
      </div>
    </div>
  );
}
