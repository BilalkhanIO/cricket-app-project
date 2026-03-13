import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const dynamic = 'force-dynamic';

async function getStats() {
  const [topBatters, topBowlers, topSixers, leagues] = await Promise.all([
    prisma.playerStats.findMany({
      where: { runs: { gt: 0 } },
      include: {
        player: {
          include: {
            user: { select: { name: true } },
            team: { select: { shortName: true, jerseyColor: true } },
          },
        },
      },
      orderBy: { runs: "desc" },
      take: 10,
    }),
    prisma.playerStats.findMany({
      where: { wickets: { gt: 0 } },
      include: {
        player: {
          include: {
            user: { select: { name: true } },
            team: { select: { shortName: true, jerseyColor: true } },
          },
        },
      },
      orderBy: { wickets: "desc" },
      take: 10,
    }),
    prisma.playerStats.findMany({
      where: { sixes: { gt: 0 } },
      include: {
        player: {
          include: {
            user: { select: { name: true } },
            team: { select: { shortName: true, jerseyColor: true } },
          },
        },
      },
      orderBy: { sixes: "desc" },
      take: 10,
    }),
    prisma.league.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    }),
  ]);

  return { topBatters, topBowlers, topSixers, leagues };
}

export default async function StatsPage() {
  const { topBatters, topBowlers, topSixers, leagues } = await getStats();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <div className="bg-green-800 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Statistics & Leaderboards</h1>
            <p className="text-green-200">Top performers across all leagues</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Batters */}
            <Card>
              <CardHeader>
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  🏏 Most Runs
                </h2>
              </CardHeader>
              {topBatters.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">No data yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {topBatters.map((stat, i) => (
                    <Link key={stat.id} href={`/players/${stat.playerId}`}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? "bg-yellow-400 text-white" : "bg-gray-100 text-gray-500"}`}>
                          {i + 1}
                        </span>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: stat.player.team?.jerseyColor || "#16a34a" }}
                        >
                          {stat.player.team?.shortName?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{stat.player.user.name}</p>
                          <p className="text-xs text-gray-500">{stat.player.team?.shortName} · {stat.matchesPlayed}M</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{stat.runs}</p>
                          <p className="text-xs text-gray-500">avg {stat.average.toFixed(1)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* Top Wicket Takers */}
            <Card>
              <CardHeader>
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  🎳 Most Wickets
                </h2>
              </CardHeader>
              {topBowlers.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">No data yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {topBowlers.map((stat, i) => (
                    <Link key={stat.id} href={`/players/${stat.playerId}`}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? "bg-yellow-400 text-white" : "bg-gray-100 text-gray-500"}`}>
                          {i + 1}
                        </span>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: stat.player.team?.jerseyColor || "#16a34a" }}
                        >
                          {stat.player.team?.shortName?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{stat.player.user.name}</p>
                          <p className="text-xs text-gray-500">{stat.player.team?.shortName} · {stat.oversBowled.toFixed(1)} ov</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{stat.wickets}</p>
                          <p className="text-xs text-gray-500">eco {stat.economy.toFixed(2)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* Most Sixes */}
            <Card>
              <CardHeader>
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  💥 Most Sixes
                </h2>
              </CardHeader>
              {topSixers.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">No data yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {topSixers.map((stat, i) => (
                    <Link key={stat.id} href={`/players/${stat.playerId}`}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? "bg-yellow-400 text-white" : "bg-gray-100 text-gray-500"}`}>
                          {i + 1}
                        </span>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: stat.player.team?.jerseyColor || "#16a34a" }}
                        >
                          {stat.player.team?.shortName?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{stat.player.user.name}</p>
                          <p className="text-xs text-gray-500">{stat.player.team?.shortName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{stat.sixes}</p>
                          <p className="text-xs text-gray-500">sixes</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* League Points Tables */}
          {leagues.length > 0 && (
            <div className="mt-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">League Standings</h2>
              {leagues.map((league) => (
                <div key={league.id}>
                  <Link href={`/leagues/${league.id}`} className="text-green-700 hover:text-green-800 font-semibold text-lg mb-2 block">
                    {league.name} →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
