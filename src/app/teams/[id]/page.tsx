import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const dynamic = 'force-dynamic';

async function getTeam(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: {
      manager: { select: { name: true } },
      players: {
        include: {
          user: { select: { name: true, profileImage: true, city: true } },
          playerStats: { take: 1 },
        },
        orderBy: [
          { isCaptain: "desc" },
          { isViceCaptain: "desc" },
          { jerseyNumber: "asc" },
        ],
      },
      leagues: {
        include: { league: { select: { id: true, name: true, season: true, status: true } } },
      },
      pointsTables: {
        include: { league: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await getTeam(id);
  if (!team) notFound();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Team Header */}
        <div className="py-10 text-white" style={{ backgroundColor: team.jerseyColor || "#16a34a" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                {team.shortName}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{team.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/80">
                  {team.city && <span>📍 {team.city}</span>}
                  <span>👥 {team.players.length} players</span>
                  {team.manager && <span>👤 Manager: {team.manager.name}</span>}
                  {team.sponsorName && <span>🤝 {team.sponsorName}</span>}
                </div>
                {team.description && (
                  <p className="text-white/70 text-sm mt-2">{team.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Squad */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Squad ({team.players.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {team.players.map((player) => (
                  <Link key={player.id} href={`/players/${player.id}`}>
                    <Card hoverable>
                      <CardBody className="flex items-center gap-3 py-3">
                        <div className="w-10 h-10 bg-[#D6E6F2] rounded-full flex items-center justify-center font-bold text-[#1B3A5C]">
                          {player.jerseyNumber || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-medium text-gray-900 text-sm truncate">{player.user.name}</p>
                            {player.isCaptain && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium">C</span>
                            )}
                            {player.isViceCaptain && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">VC</span>
                            )}
                            {player.isWicketkeeper && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium">WK</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{player.role.replace("_", " ")} · {player.battingHand} bat</p>
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* League Registrations */}
              {team.leagues.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="font-bold text-gray-900">Leagues</h3>
                  </CardHeader>
                  <CardBody className="p-0">
                    {team.leagues.map((tl) => (
                      <Link key={tl.leagueId} href={`/leagues/${tl.leagueId}`}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 hover:bg-gray-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{tl.league.name}</p>
                            <p className="text-xs text-gray-500">{tl.league.season}</p>
                          </div>
                          <Badge variant={tl.status === "APPROVED" ? "success" : tl.status === "PENDING" ? "warning" : "danger"}>
                            {tl.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </CardBody>
                </Card>
              )}

              {/* Performance */}
              {team.pointsTables.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="font-bold text-gray-900">Performance</h3>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    {team.pointsTables.map((pt) => (
                      <div key={pt.id}>
                        <p className="text-xs font-medium text-gray-500 mb-2">{pt.league.name}</p>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          {[
                            { label: "Matches", value: pt.matchesPlayed },
                            { label: "Wins", value: pt.wins },
                            { label: "Points", value: pt.points },
                            { label: "NRR", value: pt.netRunRate.toFixed(3) },
                            { label: "Losses", value: pt.losses },
                            { label: "Ties", value: pt.ties },
                          ].map((s) => (
                            <div key={s.label} className="bg-gray-50 rounded-lg p-2">
                              <div className="font-bold text-gray-900">{s.value}</div>
                              <div className="text-gray-400">{s.label}</div>
                            </div>
                          ))}
                        </div>
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
