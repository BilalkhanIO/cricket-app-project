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
        orderBy: { battingOrder: "asc" },
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
            orderBy: { wickets: "desc" },
          },
          overs: {
            orderBy: { overNumber: "asc" },
            include: { balls: { orderBy: { ballNumber: "asc" } } },
          },
        },
        orderBy: { inningsNumber: "asc" },
      },
    },
  });
}

function BallDot({ ball }: { ball: { runs: number; isWicket: boolean; isBoundary: boolean; isSix: boolean; isExtra: boolean; extraType: string | null } }) {
  const label = ball.isWicket ? "W" : ball.isExtra ? (ball.extraType?.charAt(0) || "E") : ball.runs;
  const className = `w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
    ball.isWicket ? "bg-red-500 text-white" :
    ball.isSix ? "bg-purple-500 text-white" :
    ball.isBoundary ? "bg-blue-500 text-white" :
    ball.isExtra ? "bg-yellow-400 text-gray-900" :
    ball.runs === 0 ? "bg-gray-200 text-gray-600" :
    "bg-green-500 text-white"
  }`;
  return <span className={className}>{label}</span>;
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  const inn1 = match.innings.find((i) => i.inningsNumber === 1);
  const inn2 = match.innings.find((i) => i.inningsNumber === 2);
  const isLive = ["LIVE", "INNINGS_BREAK"].includes(match.status);
  const maxOvers = match.league.oversPerInnings;

  // Compute current run rates from active innings
  const activeInnings = match.innings.find((i) => !i.isCompleted);
  const currentRR = activeInnings && activeInnings.totalBalls > 0
    ? (activeInnings.totalRuns / activeInnings.totalBalls) * 6
    : null;
  const requiredRR = activeInnings && activeInnings.inningsNumber === 2 && inn1 && activeInnings.totalBalls < maxOvers * 6
    ? (() => {
        const target = inn1.totalRuns + 1;
        const runsLeft = target - activeInnings.totalRuns;
        const ballsLeft = (maxOvers * 6) - activeInnings.totalBalls;
        return ballsLeft > 0 && runsLeft > 0 ? (runsLeft / ballsLeft) * 6 : null;
      })()
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Match Header */}
        <div className={`py-8 text-white ${
          isLive
            ? "bg-gradient-to-br from-red-700 to-red-600"
            : match.status === "COMPLETED"
            ? "bg-gradient-to-br from-gray-700 to-gray-600"
            : "bg-gradient-to-br from-[#1B3A5C] to-[#2D5484]"
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4">
              <Link href={`/leagues/${match.league.id}`} className="text-sm text-white/70 hover:text-white">
                {match.league.name}
              </Link>
              <span className="text-white/40">/</span>
              <span className="text-sm text-white/70">{match.matchFormat} · {match.overs} overs</span>
            </div>

            {/* Teams and Scores */}
            <div className="flex items-center justify-between gap-4">
              {/* Home Team */}
              <div className="flex-1 text-center">
                <div
                  className="w-14 h-14 rounded-full border-4 border-white/30 flex items-center justify-center text-2xl font-bold mx-auto mb-2"
                  style={{ backgroundColor: match.homeTeam.jerseyColor || "#16a34a" }}
                >
                  {match.homeTeam.shortName.charAt(0)}
                </div>
                <p className="font-bold text-lg">{match.homeTeam.shortName}</p>
                <p className="text-white/60 text-xs">{match.homeTeam.name}</p>
                {inn1 && inn1.teamId === match.homeTeamId && (
                  <p className="text-2xl font-bold mt-2">
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
              <div className="px-4 text-center shrink-0">
                {isLive ? (
                  <div className="bg-white/20 rounded-xl px-4 py-2 mb-2">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></span>
                      <span className="text-sm font-bold">LIVE</span>
                    </div>
                  </div>
                ) : (
                  <StatusBadge status={match.status} />
                )}
                {match.result && (
                  <p className="text-xs mt-2 text-white/90 max-w-[120px]">{match.result}</p>
                )}
                {/* Live RR info */}
                {isLive && currentRR !== null && (
                  <div className="mt-2 text-xs text-white/80 space-y-0.5">
                    <p>CRR: <span className="font-bold">{currentRR.toFixed(2)}</span></p>
                    {requiredRR !== null && (
                      <p>RRR: <span className={`font-bold ${requiredRR > currentRR ? "text-red-300" : "text-green-300"}`}>
                        {requiredRR.toFixed(2)}
                      </span></p>
                    )}
                  </div>
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
                <p className="text-white/60 text-xs">{match.awayTeam.name}</p>
                {inn1 && inn1.teamId === match.awayTeamId && (
                  <p className="text-2xl font-bold mt-2">
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

            {/* Match meta */}
            <div className="flex flex-wrap justify-center gap-3 mt-5 text-xs text-white/70">
              <span>📅 {formatDateTime(match.matchDate)}</span>
              {match.venue && <span>📍 {match.venue.name}, {match.venue.city}</span>}
              {match.tossWinnerId && (
                <span>
                  🪙 {match.tossWinnerId === match.homeTeamId ? match.homeTeam.name : match.awayTeam.name} won toss, chose to {match.tossDecision}
                </span>
              )}
            </div>

            {/* Target chase summary */}
            {isLive && activeInnings && activeInnings.inningsNumber === 2 && inn1 && (
              <div className="mt-4 mx-auto max-w-sm bg-white/10 rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-semibold">
                  {activeInnings.teamId === match.homeTeamId ? match.homeTeam.name : match.awayTeam.name}{" "}
                  need <span className="text-yellow-300">
                    {Math.max(0, inn1.totalRuns + 1 - activeInnings.totalRuns)} more
                  </span> from{" "}
                  <span className="text-white">{(maxOvers * 6) - activeInnings.totalBalls} balls</span>
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  Target: {inn1.totalRuns + 1} · {activeInnings.totalWickets} wickets down
                </p>
              </div>
            )}

            {/* Scorer action */}
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
            {/* Live Commentary */}
            {isLive && match.innings.length > 0 && (
              <LiveCommentary matchId={match.id} initialInnings={match.innings as any} />
            )}

            {/* Innings scorecards */}
            {match.innings.map((innings) => {
              const notOutBatters = innings.battingScores.filter((b) => !b.isOut);
              const dismissedBatters = innings.battingScores.filter((b) => b.isOut);

              return (
                <div key={innings.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">
                      {innings.inningsNumber === 1 ? "1st" : "2nd"} Innings — {innings.team.name}
                    </h2>
                    <span className="text-lg font-semibold text-[#1B3A5C]">
                      {innings.totalRuns}/{innings.totalWickets}
                      <span className="text-base font-normal text-gray-500 ml-1">
                        ({innings.totalOvers.toFixed(1)} ov)
                      </span>
                    </span>
                    {innings.isCompleted && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Completed</span>
                    )}
                    {!innings.isCompleted && isLive && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block"></span>
                        Live
                      </span>
                    )}
                  </div>

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
                              <tr key={bat.id} className={`border-b border-gray-50 hover:bg-gray-50 ${
                                !bat.isOut && isLive ? "bg-green-50" : ""
                              }`}>
                                <td className="px-4 py-2.5">
                                  <p className="font-medium text-gray-900">
                                    {bat.player.user.name}
                                    {!bat.isOut && isLive && (
                                      <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-normal">
                                        batting
                                      </span>
                                    )}
                                  </p>
                                  {bat.isOut ? (
                                    <p className="text-xs text-gray-400">{bat.wicketType?.replace(/_/g, " ").toLowerCase()}</p>
                                  ) : (
                                    <p className="text-xs text-green-600 font-medium">not out</p>
                                  )}
                                </td>
                                <td className="px-2 py-2.5 text-center font-bold text-gray-900">{bat.runs}</td>
                                <td className="px-2 py-2.5 text-center text-gray-600">{bat.balls}</td>
                                <td className="px-2 py-2.5 text-center text-gray-600">{bat.fours}</td>
                                <td className="px-2 py-2.5 text-center text-gray-600">{bat.sixes}</td>
                                <td className="px-2 py-2.5 text-center text-gray-600">
                                  {bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(1) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {innings.battingScores.length === 0 && (
                          <p className="text-center text-gray-400 py-6 text-sm">No batting data yet</p>
                        )}
                      </div>
                      {/* Extras & Total */}
                      <div className="px-4 py-2 bg-gray-50 border-t">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 text-xs">
                            Extras: {innings.extras}
                            {innings.extras > 0 && (
                              <span className="ml-1 text-gray-400">
                                (W: {innings.wides}, NB: {innings.noBalls}, B: {innings.byes}, LB: {innings.legByes})
                              </span>
                            )}
                          </span>
                          <span className="font-bold text-gray-900">
                            Total: {innings.totalRuns}/{innings.totalWickets}
                          </span>
                        </div>
                      </div>

                      {/* Fall of Wickets */}
                      {dismissedBatters.length > 0 && (
                        <div className="px-4 py-3 border-t">
                          <p className="text-xs font-medium text-gray-500 mb-2">Fall of Wickets</p>
                          <div className="flex flex-wrap gap-1.5">
                            {dismissedBatters.map((bat, i) => (
                              <span
                                key={bat.id}
                                className="text-xs bg-red-50 border border-red-100 text-red-700 px-2 py-0.5 rounded"
                              >
                                {i + 1}. {bat.player.user.name}
                                {bat.wicketType && ` (${bat.wicketType.replace(/_/g, " ").toLowerCase()})`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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
                              <th className="px-2 py-2 text-xs font-medium text-gray-500">Wd/NB</th>
                            </tr>
                          </thead>
                          <tbody>
                            {innings.bowlingScores.map((bowl) => (
                              <tr key={bowl.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-medium text-gray-900">{bowl.player.user.name}</td>
                                <td className="px-2 py-2.5 text-center text-gray-600">{bowl.overs.toFixed(1)}</td>
                                <td className="px-2 py-2.5 text-center text-gray-600">{bowl.maidens}</td>
                                <td className="px-2 py-2.5 text-center text-gray-600">{bowl.runs}</td>
                                <td className="px-2 py-2.5 text-center font-bold text-gray-900">{bowl.wickets}</td>
                                <td className="px-2 py-2.5 text-center text-gray-600">
                                  {bowl.overs > 0 ? (bowl.runs / bowl.overs).toFixed(2) : "-"}
                                </td>
                                <td className="px-2 py-2.5 text-center text-gray-500 text-xs">
                                  {bowl.wides}/{bowl.noBalls}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {innings.bowlingScores.length === 0 && (
                          <p className="text-center text-gray-400 py-6 text-sm">No bowling data yet</p>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Over-by-over history */}
                  {innings.overs.length > 0 && (
                    <Card>
                      <CardHeader>
                        <h3 className="font-semibold text-gray-900">
                          Over History
                          <span className="ml-2 text-sm font-normal text-gray-500">({innings.overs.length} overs)</span>
                        </h3>
                      </CardHeader>
                      <CardBody>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-500 border-b">
                                <th className="text-left py-2 pr-4">Over</th>
                                <th className="text-center py-2 pr-4">Runs</th>
                                <th className="text-center py-2 pr-4">Wkts</th>
                                <th className="text-left py-2">Ball by Ball</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...innings.overs].reverse().map((over) => (
                                <tr key={over.id} className="border-b border-gray-50">
                                  <td className="py-2 pr-4 text-gray-700 font-medium">O{over.overNumber}</td>
                                  <td className="py-2 pr-4 text-center font-semibold">{over.runs}</td>
                                  <td className="py-2 pr-4 text-center">
                                    {over.wickets > 0
                                      ? <span className="text-red-500 font-semibold">{over.wickets}W</span>
                                      : <span className="text-gray-300">-</span>}
                                  </td>
                                  <td className="py-2">
                                    <div className="flex gap-1 flex-wrap">
                                      {over.balls.map((ball) => (
                                        <BallDot key={ball.id} ball={ball as any} />
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              );
            })}

            {/* Match Info section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Playing XIs */}
              {match.playingXIs.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-gray-900">Playing XIs</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 gap-6">
                      {[match.homeTeam, match.awayTeam].map((team) => {
                        const xi = match.playingXIs.filter((p) => p.teamId === team.id);
                        return (
                          <div key={team.id}>
                            <p
                              className="font-semibold text-sm mb-2"
                              style={{ color: team.jerseyColor || "#1B3A5C" }}
                            >
                              {team.shortName} ({xi.length})
                            </p>
                            <div className="space-y-1">
                              {xi.map((p, i) => (
                                <p key={p.id ?? p.playerId} className="text-xs text-gray-600">
                                  {i + 1}. {p.player.user.name}
                                  {p.player.isCaptain && <span className="ml-1 text-gray-400">(C)</span>}
                                  {p.player.isWicketkeeper && <span className="ml-1 text-gray-400">(WK)</span>}
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
              {(match.officials.length > 0 || match.scorer) && (
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

            {/* Open Scoring Panel */}
            {(match.status === "UPCOMING" || match.status === "TOSS") && (
              <Card className="border-[#B9D7EA] bg-[#F7FBFC]">
                <CardBody className="text-center py-6">
                  <p className="text-[#1B3A5C] font-medium mb-3">Match is ready to start scoring</p>
                  <Link
                    href={`/scorer/${match.id}`}
                    className="bg-[#1B3A5C] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#2D5484] transition-colors"
                  >
                    🎯 Go to Scoring Panel
                  </Link>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
