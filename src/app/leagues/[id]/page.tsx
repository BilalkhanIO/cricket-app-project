import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

async function getLeague(id: string) {
  return prisma.league.findUnique({
    where: { id },
    include: {
      admin: { select: { name: true } },
      teams: {
        include: {
          team: {
            include: {
              manager: { select: { name: true } },
              _count: { select: { players: true } },
            },
          },
        },
        where: { status: "APPROVED" },
      },
      matches: {
        include: {
          homeTeam: { select: { id: true, name: true, shortName: true } },
          awayTeam: { select: { id: true, name: true, shortName: true } },
          venue: { select: { name: true, city: true } },
          innings: { select: { inningsNumber: true, teamId: true, totalRuns: true, totalWickets: true, totalOvers: true } },
        },
        orderBy: { matchDate: "asc" },
      },
      pointsTable: {
        include: { team: { select: { id: true, name: true, shortName: true } } },
        orderBy: [{ points: "desc" }, { netRunRate: "desc" }],
      },
      announcements: {
        where: { isPublic: true },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      sponsors: true,
    },
  });
}

export default async function LeagueDetailPage({ params }: { params: { id: string } }) {
  const league = await getLeague(params.id);
  if (!league) notFound();

  const liveMatches = league.matches.filter((m) => m.status === "LIVE");
  const upcomingMatches = league.matches.filter((m) => m.status === "UPCOMING");
  const completedMatches = league.matches.filter((m) => m.status === "COMPLETED");

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* League Header */}
        <div className="bg-gradient-to-br from-green-800 to-emerald-700 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                🏆
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold">{league.name}</h1>
                  <StatusBadge status={league.status} />
                </div>
                <p className="text-green-200 text-sm">
                  {league.season} · {league.matchFormat} · {league.tournamentType.replace("_", " ")}
                </p>
                <p className="text-green-300 text-xs mt-1">
                  {formatDate(league.startDate)} – {formatDate(league.endDate)} · Admin: {league.admin.name}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { v: league.teams.length, l: "Teams" },
                  { v: league.matches.length, l: "Matches" },
                  { v: liveMatches.length, l: "Live" },
                ].map((s) => (
                  <div key={s.l} className="bg-white/10 rounded-xl px-4 py-2">
                    <div className="text-xl font-bold">{s.v}</div>
                    <div className="text-xs text-green-200">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Live Matches */}
              {liveMatches.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                    Live Matches
                  </h2>
                  <div className="space-y-3">
                    {liveMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </section>
              )}

              {/* Points Table */}
              {league.pointsTable.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Points Table</h2>
                  <Card>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-green-50 border-b border-green-100">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Team</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">M</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">W</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">L</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">T</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Pts</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">NRR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {league.pointsTable.map((row, i) => (
                            <tr key={row.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i < 4 ? "bg-green-50/30" : ""}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                                  <Link href={`/teams/${row.teamId}`} className="font-medium text-gray-900 hover:text-green-700">
                                    {row.team.name}
                                  </Link>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center text-gray-600">{row.matchesPlayed}</td>
                              <td className="px-3 py-3 text-center text-green-700 font-medium">{row.wins}</td>
                              <td className="px-3 py-3 text-center text-red-600">{row.losses}</td>
                              <td className="px-3 py-3 text-center text-gray-600">{row.ties}</td>
                              <td className="px-3 py-3 text-center font-bold text-gray-900">{row.points}</td>
                              <td className={`px-3 py-3 text-center text-xs font-medium ${row.netRunRate >= 0 ? "text-green-700" : "text-red-600"}`}>
                                {row.netRunRate > 0 ? "+" : ""}{row.netRunRate.toFixed(3)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </section>
              )}

              {/* Upcoming Matches */}
              {upcomingMatches.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Upcoming Fixtures</h2>
                  <div className="space-y-2">
                    {upcomingMatches.map((match) => (
                      <MatchCard key={match.id} match={match} compact />
                    ))}
                  </div>
                </section>
              )}

              {/* Results */}
              {completedMatches.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Results</h2>
                  <div className="space-y-2">
                    {completedMatches.slice(0, 5).map((match) => (
                      <MatchCard key={match.id} match={match} compact />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Teams */}
              <Card>
                <CardHeader>
                  <h3 className="font-bold text-gray-900">Participating Teams ({league.teams.length})</h3>
                </CardHeader>
                <CardBody className="p-0">
                  {league.teams.map((tl) => (
                    <Link key={tl.teamId} href={`/teams/${tl.teamId}`}>
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 last:border-0">
                        <div
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: tl.team.jerseyColor || "#16a34a" }}
                        >
                          {tl.team.shortName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tl.team.name}</p>
                          <p className="text-xs text-gray-500">{tl.team._count.players} players</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardBody>
              </Card>

              {/* League Info */}
              <Card>
                <CardHeader>
                  <h3 className="font-bold text-gray-900">Tournament Info</h3>
                </CardHeader>
                <CardBody className="space-y-3">
                  {[
                    { label: "Format", value: league.matchFormat },
                    { label: "Type", value: league.tournamentType.replace("_", " ") },
                    { label: "Overs", value: league.oversPerInnings },
                    { label: "Max Teams", value: league.maxTeams },
                    { label: "Points/Win", value: league.pointsPerWin },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>

              {/* Announcements */}
              {league.announcements.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="font-bold text-gray-900">Announcements</h3>
                  </CardHeader>
                  <CardBody className="space-y-3 p-3">
                    {league.announcements.map((ann) => (
                      <div key={ann.id} className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-900">{ann.title}</p>
                        <p className="text-xs text-blue-700 mt-1 line-clamp-2">{ann.content}</p>
                        <p className="text-xs text-blue-400 mt-1">{formatDate(ann.createdAt)}</p>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function MatchCard({ match, compact }: { match: any; compact?: boolean }) {
  return (
    <Link href={`/matches/${match.id}`}>
      <Card hoverable>
        <CardBody className={compact ? "py-3" : "py-4"}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="text-center min-w-[60px]">
                  <p className="font-bold text-sm text-gray-900">{match.homeTeam.shortName}</p>
                  {match.innings.find((i: any) => i.teamId === match.homeTeamId) && (
                    <p className="text-xs text-gray-600">
                      {match.innings.find((i: any) => i.teamId === match.homeTeamId).totalRuns}/
                      {match.innings.find((i: any) => i.teamId === match.homeTeamId).totalWickets}
                    </p>
                  )}
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-400">vs</p>
                  {match.status === "LIVE" && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">LIVE</span>
                  )}
                  {match.status === "COMPLETED" && match.result && (
                    <p className="text-xs text-green-700 font-medium">{match.result}</p>
                  )}
                  {match.status === "UPCOMING" && (
                    <p className="text-xs text-gray-500">{formatDateTime(match.matchDate)}</p>
                  )}
                </div>
                <div className="text-center min-w-[60px]">
                  <p className="font-bold text-sm text-gray-900">{match.awayTeam.shortName}</p>
                  {match.innings.find((i: any) => i.teamId === match.awayTeamId) && (
                    <p className="text-xs text-gray-600">
                      {match.innings.find((i: any) => i.teamId === match.awayTeamId).totalRuns}/
                      {match.innings.find((i: any) => i.teamId === match.awayTeamId).totalWickets}
                    </p>
                  )}
                </div>
              </div>
              {match.venue && !compact && (
                <p className="text-xs text-gray-400 text-center mt-1">📍 {match.venue.city}</p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
