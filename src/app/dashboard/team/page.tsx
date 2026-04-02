import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import { StatusBadge } from "@/components/ui/Badge";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";
import { canAccessTeamManagerDashboard } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

async function getTeamManagerData(userId: string) {
  const teams = await prisma.team.findMany({
    where: { managerId: userId },
    include: {
      players: {
        include: {
          user: { select: { name: true, profileImage: true, city: true } },
          playerStats: {
            where: { leagueId: OVERALL_LEAGUE_KEY },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
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
  if (!session || !canAccessTeamManagerDashboard(session.user.role)) {
    redirect("/login");
  }

  const teams = await getTeamManagerData(session.user.id);

  if (teams.length === 0) {
    return (
      <PublicShell mainClassName="overflow-hidden">
        <div className="flex min-h-[60vh] items-center justify-center bg-[#00142b] text-[#d4e3ff]">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9bb2d1]">Team Manager Dashboard</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              No Teams Found
            </h2>
            <p className="mt-3 text-sm text-[#9bb2d1]">
              You haven&apos;t been assigned as manager of any team yet.
            </p>
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell mainClassName="overflow-hidden">
      <div className="bg-[#00142b] text-[#d4e3ff]">
        {/* Header */}
        <section className="relative overflow-hidden px-4 pb-8 pt-10 sm:px-6 lg:pb-10 lg:pt-12">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(74,225,131,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,225,131,0.06) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(27,54,86,0.95),transparent_52%),linear-gradient(180deg,rgba(0,20,43,0.22),#00142b_76%)]" />

          <div className="relative mx-auto max-w-screen-xl">
            <div className="inline-flex items-center gap-2 bg-[#1b3656] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#d4e3ff]">
              Team Manager
            </div>
            <div className="mt-6">
              <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                My Teams
                <span className="block text-[#4ae183]">Dashboard</span>
              </h1>
              <p className="mt-4 text-sm text-[#9bb2d1]">Welcome back, {session.user.name}</p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:py-12 space-y-12">
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
            const liveCount = upcomingMatches.filter((m) => ["LIVE", "INNINGS_BREAK", "TOSS"].includes(m.status)).length;

            return (
              <div key={team.id}>
                {/* Team Header bar */}
                <div className="border border-white/10 bg-[#001c3a] mb-6">
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: team.jerseyColor || "#4ae183" }}
                  />
                  <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                    <div
                      className="flex h-16 w-16 flex-none items-center justify-center text-2xl font-black text-white"
                      style={{ backgroundColor: team.jerseyColor || "#1b3656" }}
                    >
                      {team.shortName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                        {team.name}
                      </h2>
                      <p className="mt-0.5 text-sm text-[#9bb2d1]">
                        {team.shortName}{team.city ? ` · ${team.city}` : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-[#9bb2d1]">
                        {captain && <span>C: {captain.user.name}</span>}
                        {viceCaptain && <span>· VC: {viceCaptain.user.name}</span>}
                        {wicketkeeper && <span>· WK: {wicketkeeper.user.name}</span>}
                      </div>
                    </div>
                    <div className="flex gap-6 text-center">
                      {[
                        { value: team.players.length, label: "Players" },
                        { value: team.leagues.length, label: "Leagues" },
                        { value: liveCount, label: "Live Now" },
                      ].map((s) => (
                        <div key={s.label}>
                          <p className="font-[var(--font-display)] text-2xl font-black text-white">{s.value}</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9bb2d1]">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/teams/${team.id}`}
                      className="border border-white/10 bg-[#1b3656] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#d4e3ff] transition hover:bg-[#0b2747]"
                    >
                      Public Profile →
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Squad */}
                  <div className="lg:col-span-2">
                    <div className="border border-white/10 bg-[#001c3a]">
                      <div className="border-b border-white/10 px-5 py-4">
                        <h3 className="font-[var(--font-display)] text-lg font-black uppercase tracking-tight text-white">
                          Squad ({team.players.length})
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-[#0b2747] text-[10px] font-black uppercase tracking-[0.14em] text-[#9bb2d1]">
                              <th className="px-4 py-2 text-left">#</th>
                              <th className="px-4 py-2 text-left">Player</th>
                              <th className="px-3 py-2 text-center">Role</th>
                              <th className="px-3 py-2 text-center">M</th>
                              <th className="px-3 py-2 text-center">R</th>
                              <th className="px-3 py-2 text-center">W</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {team.players.map((player) => {
                              const stats = player.playerStats[0];
                              return (
                                <tr key={player.id} className="transition hover:bg-[#0b2747]">
                                  <td className="px-4 py-3 text-xs text-[#9bb2d1]">
                                    {player.jerseyNumber ? `#${player.jerseyNumber}` : "-"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      {player.user.profileImage ? (
                                        <img
                                          src={player.user.profileImage}
                                          alt={player.user.name}
                                          className="h-7 w-7 flex-none object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-7 w-7 flex-none items-center justify-center bg-[#1b3656] text-xs font-black text-white">
                                          {player.user.name.charAt(0)}
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-xs font-bold text-white">{player.user.name}</p>
                                        <div className="flex gap-1">
                                          {player.isCaptain && <span className="text-[10px] font-black text-yellow-400">C</span>}
                                          {player.isViceCaptain && <span className="text-[10px] font-black text-blue-400">VC</span>}
                                          {player.isWicketkeeper && <span className="text-[10px] font-black text-purple-400">WK</span>}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9bb2d1]">
                                      {player.role.replace(/_/g, " ")}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-center text-xs text-[#9bb2d1]">{stats?.matchesPlayed || 0}</td>
                                  <td className="px-3 py-3 text-center text-xs font-black text-white">{stats?.runs || 0}</td>
                                  <td className="px-3 py-3 text-center text-xs font-black text-white">{stats?.wickets || 0}</td>
                                </tr>
                              );
                            })}
                            {team.players.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#9bb2d1]">
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
                    <div className="border border-white/10 bg-[#001c3a]">
                      <div className="border-b border-white/10 px-5 py-4">
                        <h3 className="font-[var(--font-display)] text-lg font-black uppercase tracking-tight text-white">Upcoming Matches</h3>
                      </div>
                      <div className="px-5 py-4">
                        {upcomingMatches.length === 0 ? (
                          <p className="text-sm text-[#9bb2d1]">No upcoming matches</p>
                        ) : (
                          <div className="space-y-4">
                            {upcomingMatches.slice(0, 5).map((m) => (
                              <div key={m.id} className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-bold text-white">
                                    {m.isHome ? "vs" : "@"} {m.opponent}
                                  </p>
                                  <p className="text-[10px] text-[#9bb2d1]">{m.leagueName}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={m.status} />
                                  {["LIVE", "INNINGS_BREAK", "TOSS"].includes(m.status) && (
                                    <Link
                                      href={`/matches/${m.id}`}
                                      className="bg-[#4ae183] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#00142b] transition hover:bg-white"
                                    >
                                      Live
                                    </Link>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border border-white/10 bg-[#001c3a]">
                      <div className="border-b border-white/10 px-5 py-4">
                        <h3 className="font-[var(--font-display)] text-lg font-black uppercase tracking-tight text-white">Leagues</h3>
                      </div>
                      <div className="px-5 py-4">
                        {team.leagues.length === 0 ? (
                          <p className="text-sm text-[#9bb2d1]">Not enrolled in any league</p>
                        ) : (
                          <div className="space-y-2">
                            {team.leagues.map((tl) => (
                              <Link
                                key={tl.id}
                                href={`/leagues/${tl.league.id}`}
                                className="block border border-white/5 bg-[#0b2747] px-4 py-3 transition hover:border-white/10 hover:bg-[#12324d]"
                              >
                                <p className="text-sm font-bold text-white">{tl.league.name}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className={`text-[10px] font-black uppercase tracking-[0.14em] ${
                                    tl.status === "ACTIVE" ? "text-[#4ae183]" :
                                    tl.status === "PENDING" ? "text-yellow-400" :
                                    "text-[#9bb2d1]"
                                  }`}>{tl.status}</span>
                                  {tl.league.season && (
                                    <span className="text-[10px] text-[#9bb2d1]">Season {tl.league.season}</span>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PublicShell>
  );
}
