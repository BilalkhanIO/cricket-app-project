import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PlayerStatsCharts from "./PlayerStatsCharts";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";

export const dynamic = 'force-dynamic';

async function getPlayer(id: string) {
  return prisma.player.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, profileImage: true, city: true, dateOfBirth: true, battingStyle: true, bowlingStyle: true } },
      team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      playerStats: { orderBy: { updatedAt: "desc" } },
      battingScores: {
        include: {
          innings: {
            include: {
              match: {
                include: {
                  homeTeam: { select: { shortName: true } },
                  awayTeam: { select: { shortName: true } },
                  league: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { innings: { createdAt: "desc" } },
        take: 10,
      },
      bowlingScores: {
        include: {
          innings: {
            include: {
              match: {
                include: {
                  homeTeam: { select: { shortName: true } },
                  awayTeam: { select: { shortName: true } },
                },
              },
            },
          },
        },
        orderBy: { innings: { createdAt: "desc" } },
        take: 10,
      },
      awards: {
        include: {
          league: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

async function getLeagueNames(leagueIds: string[]) {
  if (leagueIds.length === 0) return new Map<string, string>();
  const leagues = await prisma.league.findMany({
    where: { id: { in: leagueIds } },
    select: { id: true, name: true },
  });
  return new Map(leagues.map((l) => [l.id, l.name]));
}

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const careerStats =
    player.playerStats.find((s) => s.leagueId === OVERALL_LEAGUE_KEY) || player.playerStats[0];
  const leagueStats = player.playerStats.filter(
    (s) => s.leagueId && s.leagueId !== OVERALL_LEAGUE_KEY
  );
  const leagueNames = await getLeagueNames(
    Array.from(new Set(leagueStats.map((s) => s.leagueId!).filter(Boolean)))
  );

  // Prepare chart data
  const battingChartData = player.battingScores.slice().reverse().map((bat, i) => ({
    match: `M${i + 1}`,
    runs: bat.runs,
  }));
  const bowlingChartData = player.bowlingScores.slice().reverse().map((bowl, i) => ({
    match: `M${i + 1}`,
    wickets: bowl.wickets,
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Player Header */}
        <div className="bg-gradient-to-br from-[#1B3A5C] to-[#2D5484] text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {player.user.profileImage ? (
                <img
                  src={player.user.profileImage}
                  alt={player.user.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/30"
                />
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                  {player.user.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold">{player.user.name}</h1>
                  {player.isCaptain && <span className="bg-yellow-400/20 border border-yellow-300 text-yellow-200 text-xs px-2 py-1 rounded">Captain</span>}
                  {player.isViceCaptain && <span className="bg-blue-400/20 border border-blue-300 text-blue-200 text-xs px-2 py-1 rounded">Vice Captain</span>}
                  {player.isWicketkeeper && <span className="bg-purple-400/20 border border-purple-300 text-purple-200 text-xs px-2 py-1 rounded">Wicketkeeper</span>}
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/80">
                  <span>🎯 {player.role.replace("_", " ")}</span>
                  <span>🏏 {player.battingHand} hand bat</span>
                  {player.bowlingType && <span>🎳 {player.bowlingType.replace(/_/g, " ")}</span>}
                  {player.age && <span>📅 Age {player.age}</span>}
                  {player.user.city && <span>📍 {player.user.city}</span>}
                  {player.jerseyNumber && <span>👕 #{player.jerseyNumber}</span>}
                </div>
                {player.team && (
                  <Link href={`/teams/${player.team.id}`}>
                    <div
                      className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg text-white text-sm"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: player.team.jerseyColor || "#16a34a" }}
                      />
                      {player.team.name}
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Career Stats */}
          {careerStats && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Career Statistics</h2>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                {[
                  { label: "Matches", value: careerStats.matchesPlayed, color: "bg-blue-50 border-blue-100" },
                  { label: "Runs", value: careerStats.runs, color: "bg-[#F7FBFC] border-[#D6E6F2]" },
                  { label: "Average", value: careerStats.average.toFixed(1), color: "bg-yellow-50 border-yellow-100" },
                  { label: "Strike Rate", value: careerStats.strikeRate.toFixed(1), color: "bg-orange-50 border-orange-100" },
                  { label: "Wickets", value: careerStats.wickets, color: "bg-red-50 border-red-100" },
                  { label: "Economy", value: careerStats.economy.toFixed(2), color: "bg-purple-50 border-purple-100" },
                ].map((s) => (
                  <div key={s.label} className={`border rounded-xl p-3 text-center ${s.color}`}>
                    <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-gray-900">🏏 Batting</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: "Matches", value: careerStats.matchesPlayed },
                        { label: "Innings", value: careerStats.innings },
                        { label: "Runs", value: careerStats.runs },
                        { label: "HS", value: careerStats.highestScore },
                        { label: "Not Outs", value: careerStats.notOuts },
                        { label: "Average", value: careerStats.average.toFixed(1) },
                        { label: "SR", value: careerStats.strikeRate.toFixed(1) },
                        { label: "Fours", value: careerStats.fours },
                        { label: "Sixes", value: careerStats.sixes },
                        { label: "Balls", value: careerStats.ballsFaced },
                      ].map((s) => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                          <div className="text-xl font-bold text-gray-900">{s.value}</div>
                          <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-gray-900">🎳 Bowling & Fielding</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: "Wickets", value: careerStats.wickets },
                        { label: "Overs", value: careerStats.oversBowled.toFixed(1) },
                        { label: "Economy", value: careerStats.economy.toFixed(2) },
                        { label: "Bowl Avg", value: careerStats.bowlingAverage.toFixed(2) },
                        { label: "Bowl SR", value: careerStats.bowlingStrikeRate.toFixed(2) },
                        { label: "Maidens", value: careerStats.maidens },
                        { label: "Runs Conc.", value: careerStats.runsConceded },
                        { label: "Best", value: careerStats.bestBowling || "-" },
                        { label: "Catches", value: careerStats.catches },
                        { label: "Stumpings", value: careerStats.stumpings },
                        { label: "Run Outs", value: careerStats.runOuts },
                      ].map((s) => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                          <div className="text-xl font-bold text-gray-900">{s.value}</div>
                          <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </section>
          )}

          {leagueStats.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">League-wise Statistics</h2>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">League</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">M</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">R</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">Avg</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">SR</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">W</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">Eco</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">B Avg</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">B SR</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">Best</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leagueStats
                        .slice()
                        .sort((a, b) => b.runs - a.runs || b.wickets - a.wickets)
                        .map((s) => (
                          <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-2 text-xs font-medium text-gray-800">
                              {leagueNames.get(s.leagueId || "") || "Unknown League"}
                            </td>
                            <td className="px-3 py-2 text-center">{s.matchesPlayed}</td>
                            <td className="px-3 py-2 text-center">{s.runs}</td>
                            <td className="px-3 py-2 text-center">{s.average.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">{s.strikeRate.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">{s.wickets}</td>
                            <td className="px-3 py-2 text-center">{s.economy.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">{s.bowlingAverage.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">{s.bowlingStrikeRate.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">{s.bestBowling || "-"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          )}

          {/* Charts */}
          {(battingChartData.length > 1 || bowlingChartData.length > 1) && (
            <PlayerStatsCharts battingData={battingChartData} bowlingData={bowlingChartData} />
          )}

          {/* Awards */}
          {player.awards.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Awards & Recognition</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {player.awards.map((award) => (
                  <div key={award.id} className="flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-3">
                    <div className="text-2xl">
                      {award.awardType === "MAN_OF_MATCH" ? "🏅" :
                       award.awardType === "BEST_BATSMAN" ? "🏏" :
                       award.awardType === "BEST_BOWLER" ? "🎳" :
                       award.awardType === "PLAYER_OF_TOURNAMENT" ? "🏆" : "⭐"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{award.awardType.replace(/_/g, " ")}</p>
                      <Link href={`/leagues/${award.league.id}`} className="text-xs text-[#769FCD] hover:underline">
                        {award.league.name}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Batting */}
          {player.battingScores.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Batting</h2>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Match</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">R</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">B</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">4s</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">6s</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">SR</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">Dismissal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {player.battingScores.map((bat) => (
                        <tr key={bat.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs">
                            <Link href={`/matches/${bat.innings.matchId}`} className="text-[#769FCD] hover:underline">
                              {bat.innings.match.homeTeam.shortName} vs {bat.innings.match.awayTeam.shortName}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-center font-bold">{bat.runs}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{bat.balls}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{bat.fours}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{bat.sixes}</td>
                          <td className="px-3 py-2 text-center text-gray-600">
                            {bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(1) : "-"}
                          </td>
                          <td className="px-3 py-2 text-center text-xs text-gray-500">
                            {bat.isOut ? bat.wicketType?.replace("_", " ").toLowerCase() : "not out"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          )}

          {/* Recent Bowling */}
          {player.bowlingScores.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bowling</h2>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Match</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">O</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">M</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">R</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">W</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500">Eco</th>
                      </tr>
                    </thead>
                    <tbody>
                      {player.bowlingScores.map((bowl) => (
                        <tr key={bowl.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs">
                            <Link href={`/matches/${bowl.innings.matchId}`} className="text-[#769FCD] hover:underline">
                              {bowl.innings.match.homeTeam.shortName} vs {bowl.innings.match.awayTeam.shortName}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-600">{bowl.overs.toFixed(1)}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{bowl.maidens}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{bowl.runs}</td>
                          <td className="px-3 py-2 text-center font-bold">{bowl.wickets}</td>
                          <td className="px-3 py-2 text-center text-gray-600">
                            {bowl.overs > 0 ? (bowl.runs / bowl.overs).toFixed(2) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
