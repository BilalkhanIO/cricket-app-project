import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const dynamic = 'force-dynamic';

async function getPlayers() {
  return prisma.player.findMany({
    include: {
      user: { select: { name: true, profileImage: true, city: true } },
      team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      playerStats: { take: 1 },
    },
    orderBy: { user: { name: "asc" } },
  });
}

export default async function PlayersPage() {
  const players = await getPlayers();

  const grouped: Record<string, typeof players> = {};
  players.forEach((p) => {
    const role = p.role;
    if (!grouped[role]) grouped[role] = [];
    grouped[role].push(p);
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <div className="bg-green-800 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Players</h1>
            <p className="text-green-200">{players.length} registered players</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {Object.entries(grouped).map(([role, rolePlayers]) => (
            <section key={role}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {role === "BATSMAN" ? "🏏" : role === "BOWLER" ? "🎳" : role === "WICKETKEEPER" ? "🧤" : "⭐"}{" "}
                {role.replace("_", " ")}s ({rolePlayers.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {rolePlayers.map((player) => {
                  const stats = player.playerStats[0];
                  return (
                    <Link key={player.id} href={`/players/${player.id}`}>
                      <Card hoverable className="h-full">
                        <CardBody>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-lg">
                              {player.user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{player.user.name}</p>
                              <p className="text-xs text-gray-500">{player.battingHand} bat</p>
                            </div>
                          </div>

                          {player.team && (
                            <div
                              className="flex items-center gap-2 px-2 py-1 rounded-full text-white text-xs mb-3"
                              style={{ backgroundColor: player.team.jerseyColor || "#16a34a" }}
                            >
                              <span>{player.team.shortName}</span>
                              <span>·</span>
                              <span>{player.team.name}</span>
                            </div>
                          )}

                          {stats && (
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              {role === "BOWLER" ? (
                                <>
                                  <div className="bg-gray-50 rounded p-1.5">
                                    <div className="font-bold text-gray-900">{stats.wickets}</div>
                                    <div className="text-gray-400">Wkts</div>
                                  </div>
                                  <div className="bg-gray-50 rounded p-1.5">
                                    <div className="font-bold text-gray-900">{stats.economy.toFixed(1)}</div>
                                    <div className="text-gray-400">Eco</div>
                                  </div>
                                  <div className="bg-gray-50 rounded p-1.5">
                                    <div className="font-bold text-gray-900">{stats.matchesPlayed}</div>
                                    <div className="text-gray-400">M</div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="bg-gray-50 rounded p-1.5">
                                    <div className="font-bold text-gray-900">{stats.runs}</div>
                                    <div className="text-gray-400">Runs</div>
                                  </div>
                                  <div className="bg-gray-50 rounded p-1.5">
                                    <div className="font-bold text-gray-900">{stats.highestScore}</div>
                                    <div className="text-gray-400">HS</div>
                                  </div>
                                  <div className="bg-gray-50 rounded p-1.5">
                                    <div className="font-bold text-gray-900">{stats.average.toFixed(1)}</div>
                                    <div className="text-gray-400">Avg</div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}

          {players.length === 0 && (
            <Card>
              <CardBody className="text-center py-16">
                <div className="text-5xl mb-4">🏏</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Players Yet</h3>
                <p className="text-gray-500">Players will appear here once registered.</p>
              </CardBody>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
