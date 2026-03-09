import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

async function getPlayer(id: string) {
  return prisma.player.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, profileImage: true, city: true, dateOfBirth: true, battingStyle: true, bowlingStyle: true } },
      team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      playerStats: true,
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
    },
  });
}

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const player = await getPlayer(params.id);
  if (!player) notFound();

  const careerStats = player.playerStats[0];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Player Header */}
        <div className="bg-gradient-to-br from-green-800 to-emerald-700 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                {player.user.name.charAt(0)}
              </div>
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
                            <Link href={`/matches/${bat.innings.matchId}`} className="text-green-700 hover:underline">
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
                            <Link href={`/matches/${bowl.innings.matchId}`} className="text-green-700 hover:underline">
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
