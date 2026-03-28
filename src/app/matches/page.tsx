import prisma from "@/lib/prisma";
import PublicShell from "@/components/layout/PublicShell";
import MatchesClient from "./MatchesClient";

export const dynamic = "force-dynamic";

async function getMatches(filters: { teamId?: string; leagueId?: string }) {
  return prisma.match.findMany({
    where: {
      ...(filters.leagueId && { leagueId: filters.leagueId }),
      ...(filters.teamId && {
        OR: [{ homeTeamId: filters.teamId }, { awayTeamId: filters.teamId }],
      }),
    },
    include: {
      homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      venue: { select: { name: true, city: true } },
      league: { select: { id: true, name: true } },
      innings: {
        select: {
          inningsNumber: true,
          teamId: true,
          totalRuns: true,
          totalWickets: true,
          totalOvers: true,
          isCompleted: true,
        },
      },
    },
    orderBy: { matchDate: "asc" },
  });
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ teamId?: string; leagueId?: string }>;
}) {
  const { teamId, leagueId } = await searchParams;
  const allMatches = await getMatches({ teamId, leagueId });

  const [team, league] = await Promise.all([
    teamId ? prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }) : null,
    leagueId ? prisma.league.findUnique({ where: { id: leagueId }, select: { name: true } }) : null,
  ]);

  const liveCount = allMatches.filter((match) => match.status === "LIVE").length;
  const upcomingCount = allMatches.filter((match) => match.status === "UPCOMING").length;

  const title = team ? `${team.name} Matches` : league ? `${league.name} Matches` : "Matches";
  const description = team
    ? `Filtered match centre for ${team.name}, including live scorelines, upcoming fixtures, and completed results.`
    : league
      ? `Filtered match centre for ${league.name}, including live scorelines, upcoming fixtures, and completed results.`
      : "Follow live scorelines, upcoming fixtures, and completed results from one unified scoreboard.";

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
              Matchday desk
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div className="space-y-5">
                <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1] sm:text-base">{description}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { value: allMatches.length, label: "Total" },
                  { value: liveCount, label: "Live" },
                  { value: upcomingCount, label: "Upcoming" },
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

        <MatchesClient allMatches={allMatches} />
      </div>
    </PublicShell>
  );
}
