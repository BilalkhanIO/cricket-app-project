import Link from "next/link";
import prisma from "@/lib/prisma";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import PublicShell from "@/components/layout/PublicShell";
import { CalendarDays, LayoutGrid, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

async function getHomeData() {
  try {
    const [
      liveMatches,
      upcomingMatches,
      recentResults,
      activeLeagues,
      setupLeagues,
      announcements,
      topBatters,
      topBowlers,
      topSixers,
      totalTeams,
      totalPlayers,
      totalMatches,
    ] = await Promise.all([
      prisma.match.findMany({
        where: { status: { in: ["LIVE", "INNINGS_BREAK", "TOSS"] } },
        include: {
          homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          league: { select: { id: true, name: true } },
          venue: { select: { name: true, city: true } },
          innings: {
            select: {
              inningsNumber: true,
              teamId: true,
              totalRuns: true,
              totalWickets: true,
              totalOvers: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.match.findMany({
        where: { status: { in: ["UPCOMING", "TOSS"] } },
        include: {
          homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          venue: { select: { name: true, city: true } },
          league: { select: { id: true, name: true } },
        },
        orderBy: { matchDate: "asc" },
        take: 4,
      }),
      prisma.match.findMany({
        where: { status: "COMPLETED" },
        include: {
          homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          league: { select: { id: true, name: true } },
          innings: {
            select: {
              teamId: true,
              totalRuns: true,
              totalWickets: true,
              totalOvers: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      prisma.league.findMany({
        where: { status: "ACTIVE" },
        include: { _count: { select: { teams: true, matches: true } } },
        orderBy: { startDate: "asc" },
        take: 6,
      }),
      prisma.league.findMany({
        where: { status: { in: ["REGISTRATION", "DRAFT"] } },
        select: {
          id: true,
          name: true,
          season: true,
          registrationCloseDate: true,
          registrationOpenDate: true,
          maxTeams: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.announcement.findMany({
        where: { isPublic: true },
        include: {
          author: { select: { name: true } },
          league: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.playerStats.findMany({
        where: { leagueId: OVERALL_LEAGUE_KEY, runs: { gt: 0 } },
        orderBy: [{ runs: "desc" }, { average: "desc" }],
        take: 1,
        include: {
          player: {
            include: {
              user: { select: { name: true } },
              team: { select: { shortName: true, jerseyColor: true } },
            },
          },
        },
      }),
      prisma.playerStats.findMany({
        where: { leagueId: OVERALL_LEAGUE_KEY, wickets: { gt: 0 } },
        orderBy: [{ wickets: "desc" }, { economy: "asc" }],
        take: 1,
        include: {
          player: {
            include: {
              user: { select: { name: true } },
              team: { select: { shortName: true, jerseyColor: true } },
            },
          },
        },
      }),
      prisma.playerStats.findMany({
        where: { leagueId: OVERALL_LEAGUE_KEY, sixes: { gt: 0 } },
        orderBy: [{ sixes: "desc" }, { strikeRate: "desc" }],
        take: 1,
        include: {
          player: {
            include: {
              user: { select: { name: true } },
              team: { select: { shortName: true, jerseyColor: true } },
            },
          },
        },
      }),
      prisma.team.count(),
      prisma.player.count(),
      prisma.match.count(),
    ]);

    return {
      liveMatch: liveMatches[0] ?? null,
      moreLiveMatches: liveMatches.slice(1),
      upcomingMatches,
      recentResults,
      activeLeagues,
      setupLeagues,
      announcements,
      topBatter: topBatters[0] ?? null,
      topBowler: topBowlers[0] ?? null,
      topSixer: topSixers[0] ?? null,
      totalTeams,
      totalPlayers,
      totalMatches,
    };
  } catch (error) {
    console.error("Home data load failed:", error);
    return {
      liveMatch: null,
      moreLiveMatches: [],
      upcomingMatches: [],
      recentResults: [],
      activeLeagues: [],
      setupLeagues: [],
      announcements: [],
      topBatter: null,
      topBowler: null,
      topSixer: null,
      totalTeams: 0,
      totalPlayers: 0,
      totalMatches: 0,
    };
  }
}

function getInning(match: any, teamId: string) {
  return match?.innings.find((inning: any) => inning.teamId === teamId);
}

function formatScore(innings: any) {
  if (!innings) return "--";
  return `${innings.totalRuns}/${innings.totalWickets}`;
}

function TeamBadge({ team, reversed = false }: { team: any; reversed?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${reversed ? "flex-row-reverse text-right" : ""}`}>
      <div
        className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-[#1b3656] text-sm font-bold text-white"
        style={{ boxShadow: `inset 0 0 0 1px ${team.jerseyColor || "#4ae183"}55` }}
      >
        {team.shortName.charAt(0)}
      </div>
      <span className="font-[var(--font-display)] text-lg font-bold uppercase tracking-tight text-white">
        {team.shortName}
      </span>
    </div>
  );
}

function ResultStrip({ match }: { match: any }) {
  const homeInning = getInning(match, match.homeTeamId);
  const awayInning = getInning(match, match.awayTeamId);

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group block bg-[#001c3a] p-5 transition hover:bg-[#0b2747]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">
            {match.league.name}
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <TeamBadge team={match.homeTeam} />
              <p className="font-[var(--font-display)] text-2xl font-black text-white">
                {formatScore(homeInning)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <TeamBadge team={match.awayTeam} />
              <p className="font-[var(--font-display)] text-2xl font-black text-white">
                {formatScore(awayInning)}
              </p>
            </div>
          </div>
        </div>
        <span className="bg-[#1b3656] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d4e3ff]">
          Result
        </span>
      </div>
      <p className="mt-4 border-t border-white/10 pt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#c8c8b0]">
        {match.result || "Completed"}
      </p>
    </Link>
  );
}

export default async function HomePage() {
  const {
    liveMatch,
    moreLiveMatches,
    upcomingMatches,
    recentResults,
    activeLeagues,
    setupLeagues,
    announcements,
    topBatter,
    topBowler,
    topSixer,
    totalTeams,
    totalPlayers,
    totalMatches,
  } = await getHomeData();

  const homeInning = liveMatch ? getInning(liveMatch, liveMatch.homeTeamId) : null;
  const awayInning = liveMatch ? getInning(liveMatch, liveMatch.awayTeamId) : null;
  const liveOvers = Math.max(homeInning?.totalOvers ?? 0, awayInning?.totalOvers ?? 0);
  const liveTarget = homeInning && awayInning ? Math.max(homeInning.totalRuns, awayInning.totalRuns) + 1 : null;

  return (
    <PublicShell mainClassName="overflow-hidden">
      <div className="bg-[#00142b] text-[#d4e3ff]">
        <section className="relative flex min-h-[34rem] flex-col justify-end overflow-hidden bg-[#00142b] px-4 pb-8 pt-10 sm:px-6 lg:min-h-[38rem]">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(74,225,131,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,225,131,0.06) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(27,54,86,0.95),transparent_52%),linear-gradient(180deg,rgba(0,20,43,0.28),#00142b_72%)]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-20 grayscale" />

          <div className="relative z-10 mx-auto w-full max-w-screen-xl">
            <div className="inline-flex items-center gap-2 bg-[#93000a] px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-[#ffdad6]">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              {liveMatch ? "Live now" : "Matchday mode"}
            </div>

            {liveMatch ? (
              <div className="mt-6 space-y-5">
                <div className="border-l-4 border-[#4ae183] pl-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h1 className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
                        {liveMatch.homeTeam.shortName}
                      </h1>
                      <p className="font-[var(--font-display)] text-5xl font-black text-[#4ae183] sm:text-6xl">
                        {formatScore(homeInning)}
                      </p>
                    </div>
                    <div className="text-right">
                      <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-[#9bb2d1] sm:text-4xl">
                        {liveMatch.awayTeam.shortName}
                      </h2>
                      <p className="font-[var(--font-display)] text-4xl font-black text-[#c4c6cf] sm:text-5xl">
                        {formatScore(awayInning)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-[var(--font-display)] text-lg font-bold uppercase tracking-[0.12em] text-[#c8c8b0]">
                    Overs: {Number(liveOvers).toFixed(1)}
                  </p>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9bb2d1]">
                    {liveTarget ? `Target: ${liveTarget}` : liveMatch.league.name}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/matches/${liveMatch.id}`}
                    className="bg-[#4ae183] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-[#003919] transition hover:bg-[#6bfe9c]"
                  >
                    Watch live
                  </Link>
                  <Link
                    href={`/matches/${liveMatch.id}`}
                    className="bg-[#c8c8b0] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-[#303221] transition hover:bg-[#d8d8c2]"
                  >
                    Scorecard
                  </Link>
                </div>

                <div className="grid gap-3 border border-white/10 bg-[rgba(1,32,64,0.86)] p-4 sm:grid-cols-2">
                  <TeamBadge team={liveMatch.homeTeam} />
                  <TeamBadge team={liveMatch.awayTeam} reversed />
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">
                    {liveMatch.league.name}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#9bb2d1] sm:text-right">
                    {liveMatch.venue ? `${liveMatch.venue.name}, ${liveMatch.venue.city}` : "Venue pending"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 max-w-2xl space-y-5">
                <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                  Live cricket,
                  <span className="block text-[#4ae183]">broadcast like a league brand</span>
                </h1>
                <p className="max-w-xl text-base leading-7 text-[#9bb2d1]">
                  Fixtures, standings, results, player leaders, and public league notices arranged in one complete matchday home.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/matches"
                    className="bg-[#4ae183] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-[#003919] transition hover:bg-[#6bfe9c]"
                  >
                    Open fixtures
                  </Link>
                  <Link
                    href="/register"
                    className="bg-[#1b3656] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-[#234669]"
                  >
                    Join the league
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="px-4 pt-10 sm:px-6 lg:pt-12">
          <div className="mx-auto grid max-w-screen-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: totalMatches, label: "Matches logged" },
              { value: activeLeagues.length, label: "Active leagues" },
              { value: totalTeams, label: "Teams on system" },
              { value: totalPlayers, label: "Players tracked" },
            ].map((item) => (
              <div key={item.label} className="border border-white/10 bg-[#001c3a] px-4 py-4">
                <p className="font-[var(--font-display)] text-3xl font-black text-white">{item.value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {moreLiveMatches.length > 0 && (
          <section className="mt-8 px-4 sm:px-6">
            <div className="mx-auto max-w-screen-xl">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse bg-[#93000a]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#ffdad6]">
                    Also live now
                  </p>
                </div>
                <Link href="/matches" className="text-[10px] font-black uppercase tracking-[0.18em] text-[#4ae183] hover:underline">
                  All matches
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {moreLiveMatches.map((match) => {
                  const hInn = getInning(match, match.homeTeamId);
                  const aInn = getInning(match, match.awayTeamId);
                  return (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="flex items-center justify-between gap-4 border border-[#93000a]/50 bg-[#001c3a] p-4 transition hover:bg-[#0b2747]"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{match.league.name}</p>
                        <p className="mt-1 font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">
                          {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                        </p>
                      </div>
                      <div className="flex-none text-right">
                        <p className="font-[var(--font-display)] text-lg font-black text-white">{formatScore(hInn)}</p>
                        <p className="font-[var(--font-display)] text-base font-black text-[#9bb2d1]">{formatScore(aInn)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="mt-16 px-4 sm:px-6 lg:mt-20">
          <div className="mx-auto grid max-w-screen-xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                  Upcoming
                  <span className="block text-[#4ae183]">Fixtures</span>
                </h2>
                <Link href="/matches" className="text-xs font-bold uppercase tracking-[0.22em] text-[#4ae183] underline">
                  View all
                </Link>
              </div>

              {upcomingMatches.length === 0 ? (
                <div className="bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">No upcoming fixtures scheduled yet.</div>
              ) : (
                upcomingMatches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="group relative block bg-[#001c3a] p-5 transition hover:bg-[#0b2747] sm:p-6"
                  >
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#4ae183] opacity-50 transition group-hover:opacity-100" />
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-3">
                        <TeamBadge team={match.homeTeam} />
                        <span className="font-[var(--font-display)] text-xl font-black italic text-[#7f9abd]">VS</span>
                        <TeamBadge team={match.awayTeam} reversed />
                      </div>
                      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-[#9bb2d1]">
                          <CalendarDays className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-[0.18em]">
                            {formatDateTime(match.matchDate)}
                          </span>
                        </div>
                        <span className="bg-[#1b3656] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#d4e3ff]">
                          {match.venue ? `${match.venue.name}, ${match.venue.city}` : "Venue pending"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                  Final
                  <span className="block text-[#c8c8b0]">Results</span>
                </h2>
                <Link href="/matches" className="text-xs font-bold uppercase tracking-[0.22em] text-[#4ae183] underline">
                  Results
                </Link>
              </div>

              {recentResults.length === 0 ? (
                <div className="bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">Completed matches will show here once results are locked in.</div>
              ) : (
                recentResults.map((match) => <ResultStrip key={match.id} match={match} />)
              )}
            </div>
          </div>
        </section>

        <section className="mt-16 overflow-hidden lg:mt-20">
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
            <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              League
              <span className="block text-[#c8c8b0]">Leaders</span>
            </h2>
          </div>

          <div className="mt-8 flex gap-4 overflow-x-auto px-4 pb-4 sm:px-6">
            {topBatter && (
              <Link
                href={`/players/${topBatter.playerId}`}
                className="relative block w-72 flex-none overflow-hidden bg-[#1b3656] p-6"
              >
                <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-[#4ae183]">Orange cap</p>
                <h3 className="font-[var(--font-display)] text-3xl font-black uppercase leading-none tracking-tight text-white">
                  {topBatter.player.user.name}
                </h3>
                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <p className="font-[var(--font-display)] text-5xl font-black text-white">{topBatter.runs}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">Runs scored</p>
                  </div>
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 text-lg font-bold text-white"
                    style={{ backgroundColor: topBatter.player.team?.jerseyColor || "#4ae183" }}
                  >
                    {topBatter.player.team?.shortName?.charAt(0) || "P"}
                  </div>
                </div>
              </Link>
            )}

            {topBowler && (
              <Link
                href={`/players/${topBowler.playerId}`}
                className="relative block w-72 flex-none overflow-hidden bg-[#c8c8b0] p-6 text-[#303221]"
              >
                <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-[#303221]">Purple cap</p>
                <h3 className="font-[var(--font-display)] text-3xl font-black uppercase leading-none tracking-tight">
                  {topBowler.player.user.name}
                </h3>
                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <p className="font-[var(--font-display)] text-5xl font-black">{topBowler.wickets}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#474836]">Wickets taken</p>
                  </div>
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-black/10 text-lg font-bold text-white"
                    style={{ backgroundColor: topBowler.player.team?.jerseyColor || "#1b3656" }}
                  >
                    {topBowler.player.team?.shortName?.charAt(0) || "P"}
                  </div>
                </div>
              </Link>
            )}

            {topSixer && (
              <Link
                href={`/players/${topSixer.playerId}`}
                className="relative block w-72 flex-none overflow-hidden bg-[#001c3a] p-6"
              >
                <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-[#7f9abd]">Power index</p>
                <h3 className="font-[var(--font-display)] text-3xl font-black uppercase leading-none tracking-tight text-white">
                  {topSixer.player.user.name}
                </h3>
                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <p className="font-[var(--font-display)] text-5xl font-black text-[#4ae183]">{topSixer.sixes}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">Sixes cleared</p>
                  </div>
                  <Trophy className="h-10 w-10 text-[#c8c8b0]" />
                </div>
              </Link>
            )}

            {activeLeagues.slice(0, 1).map((league) => (
              <Link key={league.id} href={`/leagues/${league.id}`} className="block w-72 flex-none bg-[#001c3a] p-6">
                <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-[#7f9abd]">Competition</p>
                <h3 className="font-[var(--font-display)] text-3xl font-black uppercase leading-none tracking-tight text-white">
                  {league.name}
                </h3>
                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <p className="font-[var(--font-display)] text-5xl font-black text-[#4ae183]">{league._count.teams}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">Teams active</p>
                  </div>
                  <Trophy className="h-10 w-10 text-[#c8c8b0]" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-screen-xl px-4 sm:px-6 lg:mt-20">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                  League
                  <span className="block text-[#4ae183]">Boards</span>
                </h2>
                <Link href="/leagues" className="text-xs font-bold uppercase tracking-[0.22em] text-[#4ae183] underline">
                  View all
                </Link>
              </div>

              {activeLeagues.length === 0 ? (
                <div className="bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">No active leagues are live right now.</div>
              ) : (
                activeLeagues.map((league) => (
                  <Link
                    key={league.id}
                    href={`/leagues/${league.id}`}
                    className="flex items-center justify-between gap-4 bg-[#001c3a] p-5 transition hover:bg-[#0b2747]"
                  >
                    <div>
                      <p className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                        {league.name}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">
                        {league._count.teams} teams · {league._count.matches} matches
                      </p>
                    </div>
                    <LayoutGrid className="h-5 w-5 text-[#4ae183]" />
                  </Link>
                ))
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                  Desk
                  <span className="block text-[#c8c8b0]">Notes</span>
                </h2>
                <Link href="/notifications" className="text-xs font-bold uppercase tracking-[0.22em] text-[#4ae183] underline">
                  More
                </Link>
              </div>

              {announcements.length === 0 ? (
                <div className="bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">Public announcements will show here.</div>
              ) : (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="bg-[#001c3a] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#4ae183]">Notice</p>
                      {announcement.league && (
                        <Link
                          href={`/leagues/${announcement.league.id}`}
                          className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c8c8b0]"
                        >
                          {announcement.league.name}
                        </Link>
                      )}
                    </div>
                    <h3 className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                      {announcement.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#9bb2d1]">{announcement.content}</p>
                    <div className="mt-4 flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.18em] text-[#7f9abd]">
                      <span>{announcement.author?.name || "Admin desk"}</span>
                      <span>{formatDate(announcement.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-screen-xl px-4 sm:px-6 lg:mt-20">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Competition
                <span className="block text-[#c8c8b0]">Setup</span>
              </h2>
              {setupLeagues.length === 0 ? (
                <div className="bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                  No leagues are currently in setup.
                </div>
              ) : (
                setupLeagues.map((league) => (
                  <Link
                    key={league.id}
                    href={`/leagues/${league.id}`}
                    className="block bg-[#001c3a] p-5 transition hover:bg-[#0b2747]"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4ae183]">
                      Setup board
                    </p>
                    <h3 className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                      {league.name}
                    </h3>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">
                      {league.season}
                    </p>
                  </Link>
                ))
              )}
            </div>

            <div className="bg-[#4ae183] p-8 text-center text-[#003919]">
              <div className="mx-auto max-w-xl">
                <h2 className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tight">
                  Join the
                  <span className="block">elite circle</span>
                </h2>
                <p className="mt-4 text-sm font-medium leading-6">
                  Create a league account, follow fixtures, manage teams, and publish matchday updates from one public-facing platform.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/register"
                    className="bg-[#003919] px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-[#4ae183] transition hover:bg-[#002f16]"
                  >
                    Join the league
                  </Link>
                  <Link
                    href="/stats"
                    className="bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-[#003919] transition hover:bg-[#eef7f1]"
                  >
                    Open stats
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
