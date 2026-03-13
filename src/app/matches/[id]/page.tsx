import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LiveCommentary from "./LiveCommentary";

export const dynamic = 'force-dynamic';

async function getMatch(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: {
      league: { select: { id: true, name: true, oversPerInnings: true } },
      homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      venue: true,
      scorer: { select: { name: true } },
      officials: true,
      playingXIs: {
        include: {
          player: {
            include: { user: { select: { name: true } } },
          },
        },
      },
      innings: {
        include: {
          team: { select: { id: true, name: true, shortName: true } },
          battingScores: {
            include: {
              player: { include: { user: { select: { name: true } } } },
            },
            orderBy: { battingOrder: "asc" },
          },
          bowlingScores: {
            include: {
              player: { include: { user: { select: { name: true } } } },
            },
          },
          overs: {
            orderBy: { overNumber: "desc" },
            take: 5,
            include: { balls: { orderBy: { ballNumber: "asc" } } },
          },
        },
        orderBy: { inningsNumber: "asc" },
      },
    },
  });
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  const inn1 = match.innings.find((i) => i.inningsNumber === 1);
  const inn2 = match.innings.find((i) => i.inningsNumber === 2);

  const isLive = ["LIVE", "INNINGS_BREAK"].includes(match.status);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Match Header */}
        <div className={`py-8 text-white ${isLive ? "bg-gradient-to-br from-red-700 to-red-600" : "bg-gradient-to-br from-[#1B3A5C] to-[#2D5484]"}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <Link href={`/leagues/${match.league.id}`} className="text-sm text-white/70 hover:text-white">
                {match.league.name}
              </Link>
              <span className="text-white/40">/</span>
              <span className="text-sm text-white/70">{match.matchFormat} · {match.overs} overs</span>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-between">
              {/* Home Team */}
              <div className="flex-1 text-center">
                <div
                  className="w-14 h-14 rounded-full border-4 border-white/30 flex items-center justify-center text-2xl font-bold mx-auto mb-2"
                  style={{ backgroundColor: match.homeTeam.jerseyColor || "#16a34a" }}
                >
                  {match.homeTeam.shortName.charAt(0)}
                </div>
                <p className="font-bold text-lg">{match.homeTeam.shortName}</p>
                <p className="text-white/70 text-xs">{match.homeTeam.name}</p>
                {inn1 && inn1.teamId === match.homeTeamId && (
                  <p className="text-2xl font-bold mt-1">
                    {inn1.totalRuns}/{inn1.totalWickets}
                    <span className="text-base font-normal text-white/70 ml-1">({inn1.totalOvers.toFixed(1)})</span>
                  </p>
                )}
                {inn2 && inn2.teamId === match.homeTeamId && (
                  <p className="text-2xl font-bold mt-1">
                    {inn2.totalRuns}/{inn2.totalWickets}
                    <span className="text-base font-normal text-white/70 ml-1">({inn2.totalOvers.toFixed(1)})</span>
                  </p>
                )}
              </div>

              {/* Middle */}
              <div className="px-6 text-center">
                {isLive ? (
                  <div className="bg-white/20 rounded-xl px-4 py-2">
                    <div className="flex items-center gap-1.5 justify-center mb-1">
                      <span className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></span>
                      <span className="text-sm font-medium">LIVE</span>
                    </div>
                  </div>
                ) : (
                  <StatusBadge status={match.status} />
                )}
                {match.result && (
                  <p className="text-sm mt-2 text-white/90">{match.result}</p>
                )}
              </div>

              {/* Away Team */}
              <div className="flex-1 text-center">
                <div
                  className="w-14 h-14 rounded-full border-4 border-white/30 flex items-center justify-center text-2xl font-bold mx-auto mb-2"
                  style={{ backgroundColor: match.awayTeam.jerseyColor || "#dc2626" }}
                >
                  {match.awayTeam.shortName.charAt(0)}
                </div>
                <p className="font-bold text-lg">{match.awayTeam.shortName}</p>
                <p className="text-white/70 text-xs">{match.awayTeam.name}</p>
                {inn1 && inn1.teamId === match.awayTeamId && (
                  <p className="text-2xl font-bold mt-1">
                    {inn1.totalRuns}/{inn1.totalWickets}
                    <span className="text-base font-normal text-white/70 ml-1">({inn1.totalOvers.toFixed(1)})</span>
                  </p>
                )}
                {inn2 && inn2.teamId === match.awayTeamId && (
                  <p className="text-2xl font-bold mt-1">
                    {inn2.totalRuns}/{inn2.totalWickets}
                    <span className="text-base font-normal text-white/70 ml-1">({inn2.totalOvers.toFixed(1)})</span>
                  </p>
                )}
              </div>
            </div>

            {/* Toss & Match Info */}
            <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs text-white/70">
              <span>📅 {formatDateTime(match.matchDate)}</span>
              {match.venue && <span>📍 {match.venue.name}, {match.venue.city}</span>}
              {match.tossWinnerId && (
                <span>
                  🪙 Toss: {match.tossWinnerId === match.homeTeamId ? match.homeTeam.name : match.awayTeam.name} chose to {match.tossDecision}
                </span>
              )}
            </div>

            {/* Scorer Action */}
            {isLive && (
              <div className="text-center mt-4">
                <Link
                  href={`/scorer/${match.id}`}
                  className="bg-white text-red-700 font-semibold px-6 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm inline-block"
                >
                  🎯 Open Scoring Panel
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Live Commentary - auto-refresh for live matches */}
            {isLive && match.innings.length > 0 && (
              <LiveCommentary matchId={match.id} initialInnings={match.innings} />
            )}

            {match.innings.map((innings) => (
              <div key={innings.id} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {innings.inningsNumber === 1 ? "1st" : "2nd"} Innings — {innings.team.name}
                  <span className="ml-2 text-lg font-semibold text-[#1B3A5C]">
                    {innings.totalRuns}/{innings.totalWickets} ({innings.totalOvers.toFixed(1)} ov)
                  </span>
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Batting Scorecard */}
                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold text-gray-900">Batting</h3>
                    </CardHeader>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Batter</th>
                            <th className="px-2 py-2 text-xs font-medium text-gray-500">R</th>
                            <th className="px-2 py-2 text-xs font-medium text-gray-500">B</th>
                            <th className="px-2 py-2 text-xs font-medium text-gray-500">4s</th>
                            <th className="px-2 py-2 text-xs font-medium text-gray-500">6s</th>
                            <th className="px-2 py-2 text-xs font-medium text-gray-500">SR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {innings.battingScores.map((bat) => (
                            <tr key={bat.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <p className="font-medium text-gray-900">{bat.player.user.name}</p>
                                {bat.isOut ? (
                                  <p className="text-xs text-gray-400">{bat.wicketType?.replace("_", " ").toLowerCase()}</p>
                                ) : (
                                  <p className="text-xs text-[#769FCD] font-medium">not out</p>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center font-bold">{bat.runs}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{bat.balls}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{bat.fours}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{bat.sixes}</td>
                              <td className="px-2 py-2 text-center text-gray-600">
                                {bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(1) : "0.0"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {innings.battingScores.length === 0 && (
                        <p className="text-center text-gray-400 py-4 text-sm">No batting data yet</p>
                      )}
                    </div>
                    <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
                      Extras: {innings.extras} (W: {innings.wides}, NB: {innings.noBalls}, B: {innings.byes}, LB: {innings.legByes})
                    </div>
                  </Card>

                  {/* Bowling Scorecard */}
                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold text-gray-900">Bowling</h3>
                    </CardHeader>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Bowler</th>
                            <th className="px-2 py-2 text-xs font-medium text-gray-500">O</th>
                            <th className="px-2 py-2 text-xs font-medium text-gray-500">M</th>
                            <th className="px-2 py-2 text-xs font-medium text-gray-500">R</th>
                            <th className="px-2 py-2 text-xs font-medium text-gray-500">W</th>
                            <th className="px-2 py-2 text-xs font-medium text-gray-500">Eco</th>
                          </tr>
                        </thead>
                        <tbody>
                          {innings.bowlingScores.map((bowl) => (
                            <tr key={bowl.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-4 py-2 font-medium text-gray-900">{bowl.player.user.name}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{bowl.overs.toFixed(1)}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{bowl.maidens}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{bowl.runs}</td>
                              <td className="px-2 py-2 text-center font-bold">{bowl.wickets}</td>
                              <td className="px-2 py-2 text-center text-gray-600">
                                {bowl.overs > 0 ? (bowl.runs / bowl.overs).toFixed(2) : "0.00"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {innings.bowlingScores.length === 0 && (
                        <p className="text-center text-gray-400 py-4 text-sm">No bowling data yet</p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Over History */}
                {innings.overs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold text-gray-900">Recent Overs</h3>
                    </CardHeader>
                    <CardBody className="overflow-x-auto">
                      <div className="flex gap-2 flex-wrap">
                        {innings.overs.map((over) => (
                          <div key={over.id} className="bg-gray-50 rounded-lg p-3 min-w-[120px]">
                            <p className="text-xs font-medium text-gray-500 mb-2">Over {over.overNumber}</p>
                            <div className="flex gap-1 flex-wrap">
                              {over.balls.map((ball) => (
                                <span
                                  key={ball.id}
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    ball.isWicket ? "bg-red-500 text-white" :
                                    ball.isSix ? "bg-purple-500 text-white" :
                                    ball.isBoundary ? "bg-blue-500 text-white" :
                                    ball.isExtra ? "bg-yellow-400 text-white" :
                                    ball.runs === 0 ? "bg-gray-200 text-gray-600" :
                                    "bg-[#F7FBFC]0 text-white"
                                  }`}
                                >
                                  {ball.isWicket ? "W" : ball.isExtra ? (ball.extraType?.charAt(0) || "E") : ball.runs}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{over.runs} runs {over.wickets > 0 ? `· ${over.wickets}W` : ""}</p>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            ))}

            {/* Match Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Playing XIs */}
              {match.playingXIs.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-gray-900">Playing XIs</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 gap-4">
                      {[match.homeTeam, match.awayTeam].map((team) => {
                        const xi = match.playingXIs.filter((p) => p.teamId === team.id);
                        return (
                          <div key={team.id}>
                            <p className="font-medium text-sm text-gray-700 mb-2">{team.shortName}</p>
                            <div className="space-y-1">
                              {xi.map((p, i) => (
                                <p key={p.id} className="text-xs text-gray-600">
                                  {i + 1}. {p.player.user.name}
                                </p>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Officials */}
              {match.officials.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-gray-900">Match Officials</h3>
                  </CardHeader>
                  <CardBody className="space-y-2">
                    {match.officials.map((off) => (
                      <div key={off.id} className="flex justify-between text-sm">
                        <span className="text-gray-500">{off.role}</span>
                        <span className="font-medium text-gray-900">{off.name}</span>
                      </div>
                    ))}
                    {match.scorer && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Scorer</span>
                        <span className="font-medium text-gray-900">{match.scorer.name}</span>
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}
            </div>

            {/* Open Scoring Link */}
            {match.status === "UPCOMING" || match.status === "TOSS" ? (
              <Card className="border-[#B9D7EA] bg-[#F7FBFC]">
                <CardBody className="text-center py-6">
                  <p className="text-[#1B3A5C] font-medium mb-3">Match is ready to start scoring</p>
                  <Link
                    href={`/scorer/${match.id}`}
                    className="bg-[#769FCD] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#5A8BBE] transition-colors"
                  >
                    🎯 Go to Scoring Panel
                  </Link>
                </CardBody>
              </Card>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
