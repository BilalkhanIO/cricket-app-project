import prisma from "@/lib/prisma";
import PublicShell from "@/components/layout/PublicShell";
import PlayersClient from "./PlayersClient";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getPlayers(teamId?: string) {
  return prisma.player.findMany({
    where: teamId ? { teamId } : undefined,
    include: {
      user: { select: { name: true, profileImage: true, city: true } },
      team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      playerStats: { where: { leagueId: OVERALL_LEAGUE_KEY }, take: 1 },
    },
    orderBy: { user: { name: "asc" } },
  });
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ teamId?: string }>;
}) {
  const { teamId } = await searchParams;
  const players = await getPlayers(teamId);
  const activeTeam =
    teamId && players.length > 0 && players[0].team?.id === teamId
      ? { id: players[0].team.id, name: players[0].team.name }
      : teamId
        ? await prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true } })
        : null;

  return (
    <PublicShell mainClassName="overflow-hidden">
      <div className="bg-[#00142b] text-[#d4e3ff]">
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
              Player registry
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div className="space-y-5">
                <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                  {activeTeam ? activeTeam.name : "Players"}
                  <span className="block text-[#4ae183]">
                    {activeTeam ? "full squad list" : "across the system"}
                  </span>
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1] sm:text-base">
                  {activeTeam
                    ? `Filtered public roster for ${activeTeam.name}. Browse the squad, jump into player profiles, and review role distribution and career output.`
                    : "Search the player pool, filter by role and team, and jump into complete player profiles with batting and bowling records."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { value: players.length, label: activeTeam ? "Squad size" : "Registered players" },
                  {
                    value: players.filter((player) => player.role === "BATSMAN" || player.role === "ALL_ROUNDER").length,
                    label: "Batting options",
                  },
                  {
                    value: players.filter((player) => player.role === "BOWLER" || player.role === "ALL_ROUNDER").length,
                    label: "Bowling options",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="border border-white/10 bg-[#001c3a] px-4 py-4">
                    <p className="font-[var(--font-display)] text-3xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <PlayersClient players={players} initialTeamFilter={teamId || "ALL"} activeTeamName={activeTeam?.name || null} />
      </div>
    </PublicShell>
  );
}
