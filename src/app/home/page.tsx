import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = 'force-dynamic';

async function getHomeData() {
  const [liveMatches, upcomingMatches, activeLeagues, announcements] = await Promise.all([
    prisma.match.findMany({
      where: { status: "LIVE" },
      include: {
        homeTeam: { select: { name: true, shortName: true, jerseyColor: true } },
        awayTeam: { select: { name: true, shortName: true, jerseyColor: true } },
        league: { select: { name: true } },
        innings: { select: { inningsNumber: true, teamId: true, totalRuns: true, totalWickets: true, totalOvers: true } },
      },
      take: 5,
    }),
    prisma.match.findMany({
      where: { status: "UPCOMING" },
      include: {
        homeTeam: { select: { name: true, shortName: true } },
        awayTeam: { select: { name: true, shortName: true } },
        venue: { select: { name: true, city: true } },
        league: { select: { name: true } },
      },
      orderBy: { matchDate: "asc" },
      take: 6,
    }),
    prisma.league.findMany({
      where: { status: "ACTIVE" },
      include: {
        _count: { select: { teams: true, matches: true } },
      },
      take: 4,
    }),
    prisma.announcement.findMany({
      where: { isPublic: true },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return { liveMatches, upcomingMatches, activeLeagues, announcements };
}

export default async function HomePage() {
  const { liveMatches, upcomingMatches, activeLeagues, announcements } = await getHomeData();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🏏</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Cricket League App
            </h1>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Manage leagues, track live scores, view statistics and follow your favorite teams all in one place.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/leagues"
                className="bg-white text-green-800 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                View Leagues
              </Link>
              <Link
                href="/matches"
                className="bg-green-600 border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-500 transition-colors"
              >
                Live Scores
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { icon: "🏆", label: "Active Leagues", value: activeLeagues.length },
              { icon: "⚡", label: "Live Now", value: liveMatches.length },
              { icon: "📅", label: "Upcoming", value: upcomingMatches.length },
              { icon: "📢", label: "Announcements", value: announcements.length },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <div className="text-3xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-green-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                Live Matches
              </h2>
              <Link href="/matches?status=LIVE" className="text-green-600 hover:text-green-700 text-sm font-medium">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card hoverable className="overflow-hidden">
                    <div className="bg-red-50 px-4 py-2 flex items-center justify-between border-b border-red-100">
                      <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        LIVE
                      </span>
                      <span className="text-xs text-gray-500">{match.league.name}</span>
                    </div>
                    <CardBody className="py-3">
                      <div className="space-y-2">
                        {[match.homeTeam, match.awayTeam].map((team, i) => {
                          const inning = match.innings.find((inn) =>
                            inn.teamId === (i === 0 ? match.homeTeamId : match.awayTeamId) ||
                            inn.inningsNumber === i + 1
                          );
                          return (
                            <div key={team.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: team.jerseyColor || "#16a34a" }}
                                />
                                <span className="font-medium text-sm">{team.shortName}</span>
                              </div>
                              {inning ? (
                                <span className="text-sm font-bold">
                                  {inning.totalRuns}/{inning.totalWickets}
                                  <span className="text-gray-500 font-normal ml-1">({inning.totalOvers.toFixed(1)})</span>
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">Yet to bat</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Matches */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Matches</h2>
            <Link href="/matches" className="text-green-600 hover:text-green-700 text-sm font-medium">
              View all →
            </Link>
          </div>
          {upcomingMatches.length === 0 ? (
            <Card>
              <CardBody className="text-center py-10 text-gray-500">
                No upcoming matches scheduled.
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card hoverable>
                    <CardBody>
                      <p className="text-xs text-green-600 font-medium mb-2">{match.league.name}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-900">{match.homeTeam.shortName}</span>
                        <span className="text-gray-400 text-sm font-medium">vs</span>
                        <span className="font-semibold text-gray-900">{match.awayTeam.shortName}</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>📅 {formatDateTime(match.matchDate)}</p>
                        {match.venue && <p>📍 {match.venue.city}</p>}
                        <p>🏏 {match.matchFormat}</p>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Leagues */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Active Leagues</h2>
              <Link href="/leagues" className="text-green-600 hover:text-green-700 text-sm font-medium">
                All leagues →
              </Link>
            </div>
            {activeLeagues.length === 0 ? (
              <Card>
                <CardBody className="text-center py-8 text-gray-500">No active leagues.</CardBody>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeLeagues.map((league) => (
                  <Link key={league.id} href={`/leagues/${league.id}`}>
                    <Card hoverable>
                      <CardBody className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-semibold text-gray-900">{league.name}</p>
                          <p className="text-xs text-gray-500">
                            {league._count.teams} teams · {league._count.matches} matches · {league.season}
                          </p>
                        </div>
                        <StatusBadge status={league.status} />
                      </CardBody>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Announcements */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
            </div>
            {announcements.length === 0 ? (
              <Card>
                <CardBody className="text-center py-8 text-gray-500">No announcements yet.</CardBody>
              </Card>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <Card key={ann.id}>
                    <CardBody className="py-3">
                      <p className="font-semibold text-gray-900 mb-1">{ann.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{ann.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        by {ann.author.name} · {formatDate(ann.createdAt)}
                      </p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Quick Actions */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Play?</h2>
          <p className="text-green-100 mb-6">Register your team or create a league today.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="bg-white text-green-800 px-5 py-2.5 rounded-lg font-semibold hover:bg-green-50 transition-colors text-sm"
            >
              Register Account
            </Link>
            <Link
              href="/leagues"
              className="border-2 border-white text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-500 transition-colors text-sm"
            >
              Browse Leagues
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
