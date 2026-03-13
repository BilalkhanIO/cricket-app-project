import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { StatusBadge } from "@/components/ui/Badge";

export const dynamic = 'force-dynamic';

async function getTeamManagerData(userId: string) {
  const teams = await prisma.team.findMany({
    where: { managerId: userId },
    include: {
      players: {
        include: {
          user: { select: { name: true, profileImage: true, city: true } },
          playerStats: { orderBy: { updatedAt: "desc" }, take: 1 },
        },
        orderBy: [{ isCaptain: "desc" }, { isViceCaptain: "desc" }],
      },
      leagues: {
        include: {
          league: {
            select: {
              id: true,
              name: true,
              status: true,
              season: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      },
      homeMatches: {
        where: { status: { in: ["UPCOMING", "LIVE", "INNINGS_BREAK", "TOSS"] } },
        include: {
          awayTeam: { select: { shortName: true } },
          league: { select: { name: true } },
        },
        orderBy: { matchDate: "asc" },
        take: 5,
      },
      awayMatches: {
        where: { status: { in: ["UPCOMING", "LIVE", "INNINGS_BREAK", "TOSS"] } },
        include: {
          homeTeam: { select: { shortName: true } },
          league: { select: { name: true } },
        },
        orderBy: { matchDate: "asc" },
        take: 5,
      },
    },
  });
  return teams;
}

export default async function TeamDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "LEAGUE_ADMIN", "TEAM_MANAGER"].includes(session.user.role)) {
    redirect("/login");
  }

  const teams = await getTeamManagerData(session.user.id);

  if (teams.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-5xl mb-4">🏏</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Teams Found</h2>
            <p className="text-gray-500">You haven&apos;t been assigned as manager of any team yet.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Manager Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {session.user.name}</p>
        </div>

        {teams.map((team) => {
          const upcomingMatches = [
            ...team.homeMatches.map((m) => ({
              id: m.id,
              status: m.status,
              matchDate: m.matchDate,
              opponent: m.awayTeam.shortName,
              leagueName: m.league.name,
              isHome: true,
            })),
            ...team.awayMatches.map((m) => ({
              id: m.id,
              status: m.status,
              matchDate: m.matchDate,
              opponent: m.homeTeam.shortName,
              leagueName: m.league.name,
              isHome: false,
            })),
          ].sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

          const captain = team.players.find((p) => p.isCaptain);
          const viceCaptain = team.players.find((p) => p.isViceCaptain);
          const wicketkeeper = team.players.find((p) => p.isWicketkeeper);

          return (
            <div key={team.id} className="mb-10">
              {/* Team Header */}
              <div
                className="rounded-2xl p-6 text-white mb-6"
                style={{
                  background: `linear-gradient(135deg, ${team.jerseyColor || "#1B3A5C"}cc, ${team.jerseyColor || "#2D5484"}99)`,
                  backgroundColor: team.jerseyColor || "#1B3A5C",
                }}
              >
                <div className="flex items-center gap-5">
                  <div
                    className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center text-2xl font-bold shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  >
                    {team.shortName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{team.name}</h2>
                    <p className="text-white/70 text-sm">{team.shortName} · {team.city}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-white/80">
                      {captain && <span>Captain: {captain.user.name}</span>}
                      {viceCaptain && <span>· VC: {viceCaptain.user.name}</span>}
                      {wicketkeeper && <span>· WK: {wicketkeeper.user.name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/teams/${team.id}`}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Public Profile →
                    </Link>
                  </div>
                </div>

                {/* Team stats bar */}
                <div className="grid grid-cols-3 gap-4 mt-5">
                  <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
                    <div className="text-2xl font-bold">{team.players.length}</div>
                    <div className="text-xs text-white/70 mt-0.5">Players</div>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
                    <div className="text-2xl font-bold">{team.leagues.length}</div>
                    <div className="text-xs text-white/70 mt-0.5">Leagues</div>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
                    <div className="text-2xl font-bold">{upcomingMatches.filter((m) => ["LIVE", "INNINGS_BREAK", "TOSS"].includes(m.status)).length}</div>
                    <div className="text-xs text-white/70 mt-0.5">Live Now</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Squad */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Squad ({team.players.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs text-gray-500">
                            <th className="text-left px-4 py-2">#</th>
                            <th className="text-left px-4 py-2">Player</th>
                            <th className="px-3 py-2 text-center">Role</th>
                            <th className="px-3 py-2 text-center">M</th>
                            <th className="px-3 py-2 text-center">R</th>
                            <th className="px-3 py-2 text-center">W</th>
                          </tr>
                        </thead>
                        <tbody>
                          {team.players.map((player) => {
                            const stats = player.playerStats[0];
                            return (
                              <tr key={player.id} className="border-t border-gray-50 hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-400 text-xs">
                                  {player.jerseyNumber ? `#${player.jerseyNumber}` : "-"}
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    {player.user.profileImage ? (
                                      <img src={player.user.profileImage} alt={player.user.name}
                                        className="w-7 h-7 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                        {player.user.name.charAt(0)}
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-gray-900 text-xs">{player.user.name}</p>
                                      <div className="flex gap-1">
                                        {player.isCaptain && <span className="text-xs text-yellow-600">C</span>}
                                        {player.isViceCaptain && <span className="text-xs text-blue-600">VC</span>}
                                        {player.isWicketkeeper && <span className="text-xs text-purple-600">WK</span>}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className="text-xs text-gray-500">{player.role.replace(/_/g, " ")}</span>
                                </td>
                                <td className="px-3 py-2 text-center text-xs text-gray-600">{stats?.matchesPlayed || 0}</td>
                                <td className="px-3 py-2 text-center text-xs font-semibold text-gray-900">{stats?.runs || 0}</td>
                                <td className="px-3 py-2 text-center text-xs font-semibold text-gray-900">{stats?.wickets || 0}</td>
                              </tr>
                            );
                          })}
                          {team.players.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                                No players in squad yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Upcoming matches */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-bold text-gray-900 mb-3">Upcoming Matches</h3>
                    {upcomingMatches.length === 0 ? (
                      <p className="text-sm text-gray-400">No upcoming matches</p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingMatches.slice(0, 5).map((m) => (
                          <div key={m.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {m.isHome ? "vs" : "@"} {m.opponent}
                              </p>
                              <p className="text-xs text-gray-400">{m.leagueName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={m.status} />
                              {["LIVE", "INNINGS_BREAK", "TOSS"].includes(m.status) && (
                                <Link href={`/matches/${m.id}`}
                                  className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded hover:bg-red-200 transition-colors">
                                  Live
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Leagues */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-bold text-gray-900 mb-3">Leagues</h3>
                    {team.leagues.length === 0 ? (
                      <p className="text-sm text-gray-400">Not enrolled in any league</p>
                    ) : (
                      <div className="space-y-2">
                        {team.leagues.map((tl) => (
                          <Link
                            key={tl.id}
                            href={`/leagues/${tl.league.id}`}
                            className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900">{tl.league.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                tl.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                                tl.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>{tl.status}</span>
                              {tl.league.season && <span className="text-xs text-gray-400">Season {tl.league.season}</span>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </main>
      <Footer />
    </div>
  );
}
