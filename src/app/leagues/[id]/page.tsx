import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const dynamic = 'force-dynamic';

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
      awards: {
        include: {
          player: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

// Calculate form guide for a team (last 5 results)
function getFormGuide(teamId: string, matches: any[]): string[] {
  const completedMatches = matches
    .filter((m) =>
      m.status === "COMPLETED" &&
      (m.homeTeamId === teamId || m.awayTeamId === teamId)
    )
    .slice(-5);

  return completedMatches.map((m) => {
    if (!m.winnerTeamId) return "T";
    return m.winnerTeamId === teamId ? "W" : "L";
  });
}

export default async function LeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const league = await getLeague(id);
  if (!league) notFound();

  const liveMatches = league.matches.filter((m) => m.status === "LIVE");
  const upcomingMatches = league.matches.filter((m) => m.status === "UPCOMING");
  const completedMatches = league.matches.filter((m) => m.status === "COMPLETED");

  // Enrich points table with form guide
  const enrichedPointsTable = league.pointsTable.map((row) => ({
    ...row,
    formGuide: getFormGuide(row.teamId, league.matches as any),
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* League Header */}
        <div className="bg-gradient-to-br from-[#1B3A5C] to-[#2D5484] text-white py-10">
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
                <p className="text-[#B9D7EA] text-sm">
                  {league.season} · {league.matchFormat} · {league.tournamentType.replace("_", " ")}
                </p>
                <p className="text-[#B9D7EA] text-xs mt-1">
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
                    <div className="text-xs text-[#B9D7EA]">{s.l}</div>
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

              {/* Enhanced Points Table */}
              {enrichedPointsTable.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Points Table</h2>
                  <Card>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#F7FBFC] border-b border-[#D6E6F2]">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Team</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">M</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">W</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">L</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">T</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Pts</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">NRR</th>
                            <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Form</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrichedPointsTable.map((row, i) => (
                            <tr
                              key={row.id}
                              className={`border-b border-gray-50 hover:bg-gray-50 ${
                                i < 2
                                  ? "bg-[#F7FBFC]/50 border-l-4 border-l-[#769FCD]"
                                  : i < 4
                                  ? "bg-blue-50/30"
                                  : ""
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                                    i < 2 ? "bg-[#F7FBFC]0 text-white" : "text-gray-400"
                                  }`}>
                                    {i + 1}
                                  </span>
                                  <Link href={`/teams/${row.teamId}`} className="font-medium text-gray-900 hover:text-[#1B3A5C]">
                                    {row.team.name}
                                  </Link>
                                  {i < 2 && (
                                    <span className="text-xs bg-[#D6E6F2] text-[#1B3A5C] px-1.5 py-0.5 rounded font-medium">
                                      Playoff
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center text-gray-600">{row.matchesPlayed}</td>
                              <td className="px-3 py-3 text-center text-[#1B3A5C] font-medium">{row.wins}</td>
                              <td className="px-3 py-3 text-center text-red-600">{row.losses}</td>
                              <td className="px-3 py-3 text-center text-gray-600">{row.ties}</td>
                              <td className="px-3 py-3 text-center font-bold text-gray-900">{row.points}</td>
                              <td className={`px-3 py-3 text-center text-xs font-medium ${row.netRunRate >= 0 ? "text-[#1B3A5C]" : "text-red-600"}`}>
                                {row.netRunRate > 0 ? "+" : ""}{row.netRunRate.toFixed(3)}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex gap-0.5">
                                  {row.formGuide.map((result, fi) => (
                                    <span
                                      key={fi}
                                      className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${
                                        result === "W" ? "bg-[#F7FBFC]0 text-white" :
                                        result === "L" ? "bg-red-500 text-white" :
                                        "bg-gray-300 text-gray-600"
                                      }`}
                                    >
                                      {result}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex gap-4">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#F7FBFC]0 rounded-full inline-block"></span> Playoff spots</span>
                      <span>Form: last 5 results (W/L/T)</span>
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

              {/* Awards Section */}
              {league.awards.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Awards</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {league.awards.map((award) => (
                      <div key={award.id} className="flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-3">
                        <div className="text-2xl">
                          {award.awardType === "MAN_OF_MATCH" ? "🏅" :
                           award.awardType === "BEST_BATSMAN" ? "🏏" :
                           award.awardType === "BEST_BOWLER" ? "🎳" :
                           award.awardType === "PLAYER_OF_TOURNAMENT" ? "🏆" : "⭐"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {award.awardType.replace(/_/g, " ")}
                          </p>
                          {award.player && (
                            <Link href={`/players/${award.playerId}`} className="text-xs text-[#1B3A5C] hover:underline font-medium">
                              {award.player.user.name}
                            </Link>
                          )}
                          {award.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{award.description}</p>
                          )}
                        </div>
                      </div>
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

              {/* Sponsors */}
              {league.sponsors.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="font-bold text-gray-900">Sponsors</h3>
                  </CardHeader>
                  <CardBody className="space-y-2">
                    {league.sponsors.map((sponsor) => (
                      <div key={sponsor.id} className="flex items-center gap-2">
                        {sponsor.logo ? (
                          <img src={sponsor.logo} alt={sponsor.name} className="w-8 h-8 object-contain rounded" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">
                            {sponsor.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          {sponsor.website ? (
                            <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                              {sponsor.name}
                            </a>
                          ) : (
                            <p className="text-sm font-medium text-gray-900">{sponsor.name}</p>
                          )}
                          {sponsor.tier && (
                            <p className="text-xs text-gray-400">{sponsor.tier}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              )}

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

              {/* Media Link */}
              <Link href={`/leagues/${league.id}/media`}>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📷</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Media Gallery</p>
                      <p className="text-xs text-gray-500">Photos & videos from this league</p>
                    </div>
                  </div>
                </div>
              </Link>

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
                    <p className="text-xs text-[#1B3A5C] font-medium">{match.result}</p>
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
