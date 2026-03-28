import Link from "next/link";
import prisma from "@/lib/prisma";
import PublicShell from "@/components/layout/PublicShell";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getStats(filters: { leagueId?: string; teamId?: string }) {
  const scopeLeagueId = filters.leagueId || OVERALL_LEAGUE_KEY;
  const playerFilter = filters.teamId ? { player: { teamId: filters.teamId } } : {};

  const [topBatters, topBowlers, topSixers, leagues] = await Promise.all([
    prisma.playerStats.findMany({
      where: { leagueId: scopeLeagueId, runs: { gt: 0 }, ...playerFilter },
      include: {
        player: {
          include: {
            user: { select: { name: true } },
            team: { select: { id: true, shortName: true, jerseyColor: true } },
          },
        },
      },
      orderBy: { runs: "desc" },
      take: 10,
    }),
    prisma.playerStats.findMany({
      where: { leagueId: scopeLeagueId, wickets: { gt: 0 }, ...playerFilter },
      include: {
        player: {
          include: {
            user: { select: { name: true } },
            team: { select: { id: true, shortName: true, jerseyColor: true } },
          },
        },
      },
      orderBy: { wickets: "desc" },
      take: 10,
    }),
    prisma.playerStats.findMany({
      where: { leagueId: scopeLeagueId, sixes: { gt: 0 }, ...playerFilter },
      include: {
        player: {
          include: {
            user: { select: { name: true } },
            team: { select: { id: true, shortName: true, jerseyColor: true } },
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

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ leagueId?: string; teamId?: string }>;
}) {
  const { leagueId, teamId } = await searchParams;
  const [{ topBatters, topBowlers, topSixers, leagues }, league, team] = await Promise.all([
    getStats({ leagueId, teamId }),
    leagueId ? prisma.league.findUnique({ where: { id: leagueId }, select: { id: true, name: true } }) : null,
    teamId ? prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true } }) : null,
  ]);

  const title = team ? `${team.name} Statistics` : league ? `${league.name} Statistics` : "Statistics & Leaderboards";
  const description = team
    ? `Filtered player leaderboards for ${team.name}.`
    : league
      ? `Filtered player leaderboards for ${league.name}.`
      : "Track the best batters, bowlers, and power hitters across the competition landscape.";

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
              Leaderboards
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div className="space-y-5">
                <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">{title}</h1>
                <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1] sm:text-base">{description}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { value: topBatters.length, label: "Batters" },
                  { value: topBowlers.length, label: "Bowlers" },
                  { value: topSixers.length, label: "Hitters" },
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

        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              { title: "Most Runs", stats: topBatters, valueKey: "runs", subKey: "average" },
              { title: "Most Wickets", stats: topBowlers, valueKey: "wickets", subKey: "economy" },
              { title: "Most Sixes", stats: topSixers, valueKey: "sixes", subKey: null },
            ].map((board) => (
              <div key={board.title} className="border border-white/10 bg-[#001c3a]">
                <div className="border-b border-white/10 px-5 py-4">
                  <h2 className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">{board.title}</h2>
                </div>
                {board.stats.length === 0 ? (
                  <div className="px-5 py-8 text-sm text-[#9bb2d1]">No data yet.</div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {board.stats.map((stat, index) => (
                      <Link key={stat.id} href={`/players/${stat.playerId}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#0b2747]">
                        <span className="flex h-7 w-7 items-center justify-center bg-[#12324d] text-xs font-black text-white">{index + 1}</span>
                        <div
                          className="flex h-9 w-9 items-center justify-center text-xs font-black text-white"
                          style={{ backgroundColor: stat.player.team?.jerseyColor || "#1b3656" }}
                        >
                          {stat.player.team?.shortName?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold uppercase tracking-[0.08em] text-white">{stat.player.user.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                            {stat.player.team?.shortName || "No team"} · {stat.matchesPlayed}M
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-[var(--font-display)] text-2xl font-black text-white">{(stat as any)[board.valueKey]}</p>
                          {board.subKey && (
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                              {board.subKey} {(stat as any)[board.subKey].toFixed(2)}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!teamId && leagues.length > 0 && (
            <div className="mt-10 space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Active
                <span className="block text-[#4ae183]">league boards</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {leagues.map((league) => (
                  <Link key={league.id} href={`/stats?leagueId=${league.id}`} className="border border-white/10 bg-[#001c3a] px-5 py-5 transition hover:bg-[#0b2747]">
                    <p className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">{league.name}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Open league-specific stats</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
