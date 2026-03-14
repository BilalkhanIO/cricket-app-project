import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";

export const dynamic = 'force-dynamic';

async function getPlayerData(userId: string) {
  const player = await prisma.player.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, profileImage: true, city: true } },
      team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      playerStats: { where: { leagueId: OVERALL_LEAGUE_KEY }, orderBy: { updatedAt: "desc" }, take: 1 },
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
        include: { league: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  return player;
}

export default async function PlayerDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const player = await getPlayerData(session.user.id);

  if (!player) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-5xl mb-4">🏏</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Player Profile Found</h2>
            <p className="text-gray-500">Ask your team manager or admin to create your player profile.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const careerStats = player.playerStats[0];
  const totalRuns = player.battingScores.reduce((s, b) => s + b.runs, 0);
  const totalWickets = player.bowlingScores.reduce((s, b) => s + b.wickets, 0);
  const bestBat = player.battingScores.reduce((best, b) => b.runs > best ? b.runs : best, 0);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-[#1B3A5C] to-[#2D5484] rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center gap-5">
            {player.user.profileImage ? (
              <img src={player.user.profileImage} alt={player.user.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white/30" />
            ) : (
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                {player.user.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{player.user.name}</h1>
                {player.isCaptain && <span className="bg-yellow-400/20 border border-yellow-300 text-yellow-200 text-xs px-2 py-0.5 rounded">Captain</span>}
                {player.isViceCaptain && <span className="bg-blue-400/20 border border-blue-300 text-blue-200 text-xs px-2 py-0.5 rounded">Vice Captain</span>}
                {player.isWicketkeeper && <span className="bg-purple-400/20 border border-purple-300 text-purple-200 text-xs px-2 py-0.5 rounded">Wicketkeeper</span>}
              </div>
              <div className="flex gap-4 mt-1 text-sm text-white/70">
                <span>🎯 {player.role.replace(/_/g, " ")}</span>
                <span>🏏 {player.battingHand} bat</span>
                {player.jerseyNumber && <span>👕 #{player.jerseyNumber}</span>}
                {player.user.city && <span>📍 {player.user.city}</span>}
              </div>
              {player.team && (
                <Link href={`/teams/${player.team.id}`}
                  className="inline-flex items-center gap-2 mt-2 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-sm transition-colors">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.team.jerseyColor || "#16a34a" }} />
                  {player.team.name}
                </Link>
              )}
            </div>
            <div className="ml-auto">
              <Link href={`/players/${player.id}`}
                className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                View Public Profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Matches Played", value: careerStats?.matchesPlayed || player.battingScores.length, icon: "🏏" },
            { label: "Total Runs", value: careerStats?.runs ?? totalRuns, icon: "🏃" },
            { label: "Total Wickets", value: careerStats?.wickets ?? totalWickets, icon: "🎳" },
            { label: "Highest Score", value: careerStats?.highestScore ?? bestBat, icon: "⭐" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Batting */}
          <div className="lg:col-span-2 space-y-5">
            {player.battingScores.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Recent Batting</h3>
                  <Link href={`/players/${player.id}`} className="text-xs text-blue-500 hover:underline">See all</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="text-left px-4 py-2">Match</th>
                        <th className="px-3 py-2 text-center">R</th>
                        <th className="px-3 py-2 text-center">B</th>
                        <th className="px-3 py-2 text-center">4s</th>
                        <th className="px-3 py-2 text-center">6s</th>
                        <th className="px-3 py-2 text-center">SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {player.battingScores.slice(0, 8).map((bat) => (
                        <tr key={bat.id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs">
                            <Link href={`/matches/${bat.innings.matchId}`} className="text-blue-500 hover:underline">
                              {bat.innings.match.homeTeam.shortName} vs {bat.innings.match.awayTeam.shortName}
                            </Link>
                            <p className="text-gray-400">{bat.innings.match.league.name}</p>
                          </td>
                          <td className="px-3 py-2 text-center font-bold">{bat.runs}</td>
                          <td className="px-3 py-2 text-center text-gray-500">{bat.balls}</td>
                          <td className="px-3 py-2 text-center text-gray-500">{bat.fours}</td>
                          <td className="px-3 py-2 text-center text-gray-500">{bat.sixes}</td>
                          <td className="px-3 py-2 text-center text-gray-500">
                            {bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(0) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {player.bowlingScores.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Recent Bowling</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="text-left px-4 py-2">Match</th>
                        <th className="px-3 py-2 text-center">O</th>
                        <th className="px-3 py-2 text-center">R</th>
                        <th className="px-3 py-2 text-center">W</th>
                        <th className="px-3 py-2 text-center">Eco</th>
                      </tr>
                    </thead>
                    <tbody>
                      {player.bowlingScores.slice(0, 8).map((bowl) => (
                        <tr key={bowl.id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs">
                            <Link href={`/matches/${bowl.innings.matchId}`} className="text-blue-500 hover:underline">
                              {bowl.innings.match.homeTeam.shortName} vs {bowl.innings.match.awayTeam.shortName}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-500">{bowl.overs.toFixed(1)}</td>
                          <td className="px-3 py-2 text-center text-gray-500">{bowl.runs}</td>
                          <td className="px-3 py-2 text-center font-bold">{bowl.wickets}</td>
                          <td className="px-3 py-2 text-center text-gray-500">
                            {bowl.overs > 0 ? (bowl.runs / bowl.overs).toFixed(2) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Career stats summary */}
            {careerStats && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900 mb-3">Career Stats</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Average", value: careerStats.average.toFixed(1) },
                    { label: "Strike Rate", value: careerStats.strikeRate.toFixed(1) },
                    { label: "Economy", value: careerStats.economy.toFixed(2) },
                    { label: "Fours", value: careerStats.fours },
                    { label: "Sixes", value: careerStats.sixes },
                    { label: "Maidens", value: careerStats.maidens },
                    { label: "Catches", value: careerStats.catches },
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between">
                      <span className="text-gray-500">{s.label}</span>
                      <span className="font-semibold text-gray-900">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Awards */}
            {player.awards.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900 mb-3">Awards</h3>
                <div className="space-y-2">
                  {player.awards.map((award) => (
                    <div key={award.id} className="flex items-center gap-2 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                      <span>{award.awardType === "MAN_OF_MATCH" ? "🏅" : award.awardType === "BEST_BATSMAN" ? "🏏" : "⭐"}</span>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{award.awardType.replace(/_/g, " ")}</p>
                        <Link href={`/leagues/${award.league.id}`} className="text-xs text-blue-500 hover:underline">
                          {award.league.name}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
