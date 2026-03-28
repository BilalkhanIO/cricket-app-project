import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import PublicShell from "@/components/layout/PublicShell";

export const dynamic = "force-dynamic";

async function getTeam(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: {
      manager: { select: { name: true } },
      players: {
        include: {
          user: { select: { name: true, city: true } },
          playerStats: {
            where: { leagueId: OVERALL_LEAGUE_KEY },
            take: 1,
            orderBy: { updatedAt: "desc" },
          },
        },
        orderBy: [
          { isCaptain: "desc" },
          { isViceCaptain: "desc" },
          { jerseyNumber: "asc" },
        ],
      },
      leagues: {
        include: {
          league: {
            select: {
              id: true,
              name: true,
              season: true,
              year: true,
              status: true,
              matchFormat: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      pointsTables: {
        include: {
          league: { select: { id: true, name: true, season: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      homeMatches: {
        include: {
          league: { select: { id: true, name: true, season: true } },
          homeTeam: { select: { id: true, name: true, shortName: true } },
          awayTeam: { select: { id: true, name: true, shortName: true } },
          venue: { select: { name: true, city: true } },
          innings: { select: { teamId: true, totalRuns: true, totalWickets: true } },
        },
        orderBy: { matchDate: "desc" },
        take: 8,
      },
      awayMatches: {
        include: {
          league: { select: { id: true, name: true, season: true } },
          homeTeam: { select: { id: true, name: true, shortName: true } },
          awayTeam: { select: { id: true, name: true, shortName: true } },
          venue: { select: { name: true, city: true } },
          innings: { select: { teamId: true, totalRuns: true, totalWickets: true } },
        },
        orderBy: { matchDate: "desc" },
        take: 8,
      },
    },
  });
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getStatusTone(status: string) {
  if (status === "APPROVED") return "bg-[#4ae183] text-[#003919]";
  if (status === "PENDING") return "bg-[#c8c8b0] text-[#303221]";
  if (status === "REJECTED") return "bg-[#93000a] text-[#ffdad6]";
  return "bg-[#12324d] text-[#9bb2d1]";
}

function getMatchTone(status: string) {
  if (status === "LIVE") return "bg-[#93000a] text-[#ffdad6]";
  if (status === "COMPLETED") return "bg-[#4ae183] text-[#003919]";
  return "bg-[#12324d] text-[#d4e3ff]";
}

function getInning(match: any, teamId: string) {
  return match.innings.find((inning: any) => inning.teamId === teamId);
}

function formatScore(inning: any) {
  if (!inning) return "--";
  return `${inning.totalRuns}/${inning.totalWickets}`;
}

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await getTeam(id);
  if (!team) notFound();

  const matches = [...team.homeMatches, ...team.awayMatches]
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
    .slice(0, 8);

  const captain = team.players.find((player) => player.isCaptain);
  const wicketkeeper = team.players.find((player) => player.isWicketkeeper);
  const topRunScorer = [...team.players]
    .sort((a, b) => (b.playerStats[0]?.runs || 0) - (a.playerStats[0]?.runs || 0))[0];
  const topWicketTaker = [...team.players]
    .sort((a, b) => (b.playerStats[0]?.wickets || 0) - (a.playerStats[0]?.wickets || 0))[0];

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "squad", label: "Squad" },
    { id: "competitions", label: "Leagues" },
    { id: "fixtures", label: "Matches" },
  ];

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
              Team hub
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center text-lg font-black text-white sm:h-20 sm:w-20 sm:text-2xl"
                    style={{ backgroundColor: team.jerseyColor || "#1b3656" }}
                  >
                    {team.shortName}
                  </div>
                  <div>
                    <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                      {team.name}
                    </h1>
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-[#c8c8b0]">
                      {team.city || "City not listed"} · {team.shortName}
                    </p>
                  </div>
                </div>

                <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1] sm:text-base">
                  {team.description ||
                    `${team.name} public team board with squad details, competition entries, table form, and recent fixtures.`}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/players?teamId=${team.id}`}
                    className="bg-[#4ae183] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-[#003919] transition hover:bg-[#6bfe9c]"
                  >
                    Browse squad
                  </Link>
                  <Link
                    href={`/matches?teamId=${team.id}`}
                    className="bg-[#1b3656] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-[#234669]"
                  >
                    Open fixtures
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { value: team.players.length, label: "Squad" },
                  { value: team.leagues.length, label: "Leagues" },
                  { value: matches.length, label: "Recent matches" },
                  { value: team.pointsTables.length, label: "Tables" },
                ].map((stat) => (
                  <div key={stat.label} className="border border-white/10 bg-[#001c3a] px-4 py-4">
                    <p className="font-[var(--font-display)] text-3xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Manager</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {team.manager?.name || "Not assigned"}
                </p>
              </div>
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Captain</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {captain?.user.name || "Not assigned"}
                </p>
              </div>
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Wicketkeeper</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {wicketkeeper?.user.name || "Not assigned"}
                </p>
              </div>
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Sponsor</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {team.sponsorName || "Not listed"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sticky top-[72px] z-30 border-y border-white/10 bg-[rgba(0,20,43,0.94)] px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-screen-xl gap-2 overflow-x-auto">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="whitespace-nowrap bg-[#001c3a] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#d4e3ff] transition hover:bg-[#0b2747]"
              >
                {section.label}
              </a>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:py-12">
          <section id="overview" className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Team
                <span className="block text-[#4ae183]">overview</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, label: "Top run scorer", value: `${topRunScorer?.user.name || "N/A"} · ${topRunScorer?.playerStats[0]?.runs || 0}` },
                  { icon: Trophy, label: "Top wicket taker", value: `${topWicketTaker?.user.name || "N/A"} · ${topWicketTaker?.playerStats[0]?.wickets || 0}` },
                  { icon: Users, label: "Roster structure", value: `${team.players.filter((player) => player.isActive).length} active players` },
                  { icon: CalendarDays, label: "Competition entries", value: `${team.leagues.length} league registrations` },
                ].map((item) => (
                  <div key={item.label} className="border border-white/10 bg-[#001c3a] p-5">
                    <item.icon className="h-5 w-5 text-[#4ae183]" />
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">{item.label}</p>
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Table
                <span className="block text-[#c8c8b0]">performance</span>
              </h2>
              {team.pointsTables.length === 0 ? (
                <div className="border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                  Table performance will appear once the team records league results.
                </div>
              ) : (
                <div className="grid gap-4">
                  {team.pointsTables.map((table) => (
                    <div key={table.id} className="border border-white/10 bg-[#001c3a] p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                            {table.league.name}
                          </p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                            {table.league.season}
                          </p>
                        </div>
                        <p className="font-[var(--font-display)] text-3xl font-black text-white">{table.points}</p>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-3">
                        {[
                          { label: "Matches", value: table.matchesPlayed },
                          { label: "Wins", value: table.wins },
                          { label: "Losses", value: table.losses },
                          { label: "Ties", value: table.ties },
                          { label: "NRR", value: table.netRunRate.toFixed(3) },
                          { label: "Points", value: table.points },
                        ].map((item) => (
                          <div key={item.label} className="border border-white/10 bg-[#00142b] px-3 py-3">
                            <p className="font-[var(--font-display)] text-2xl font-black text-white">{item.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                              {item.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section id="squad" className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Squad
                <span className="block text-[#4ae183]">list</span>
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {team.players.map((player) => {
                const stats = player.playerStats[0];

                return (
                  <Link
                    key={player.id}
                    href={`/players/${player.id}`}
                    className="block border border-white/10 bg-[#001c3a] p-5 transition hover:bg-[#0b2747]"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center text-sm font-black text-white"
                        style={{ backgroundColor: team.jerseyColor || "#1b3656" }}
                      >
                        {player.jerseyNumber || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                            {player.user.name}
                          </p>
                          {player.isCaptain && <span className="bg-[#c8c8b0] px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#303221]">C</span>}
                          {player.isViceCaptain && <span className="bg-[#12324d] px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d4e3ff]">VC</span>}
                          {player.isWicketkeeper && <span className="bg-[#1b3656] px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">WK</span>}
                        </div>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                          {formatLabel(player.role)} · {player.battingHand} bat
                          {player.user.city ? ` · ${player.user.city}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {[
                        { label: "Runs", value: stats?.runs || 0 },
                        { label: "Wickets", value: stats?.wickets || 0 },
                        { label: "Matches", value: stats?.matchesPlayed || 0 },
                      ].map((item) => (
                        <div key={item.label} className="border border-white/10 bg-[#00142b] px-3 py-3">
                          <p className="font-[var(--font-display)] text-2xl font-black text-white">{item.value}</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section id="competitions" className="mt-14 grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                League
                <span className="block text-[#4ae183]">entries</span>
              </h2>

              {team.leagues.length === 0 ? (
                <div className="border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                  This team is not registered in any public leagues yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {team.leagues.map((teamLeague) => (
                    <Link
                      key={teamLeague.id}
                      href={`/leagues/${teamLeague.leagueId}`}
                      className="flex items-center justify-between gap-4 border border-white/10 bg-[#001c3a] p-5 transition hover:bg-[#0b2747]"
                    >
                      <div>
                        <p className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                          {teamLeague.league.name}
                        </p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                          {teamLeague.league.season} · {teamLeague.league.year} · {teamLeague.league.matchFormat}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(teamLeague.status)}`}>
                        {formatLabel(teamLeague.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Public
                <span className="block text-[#c8c8b0]">actions</span>
              </h2>

              <div className="border border-white/10 bg-[#001c3a] p-5">
                <div className="grid gap-3">
                  {[
                    { href: `/players?teamId=${team.id}`, label: "Open full squad" },
                    { href: `/matches?teamId=${team.id}`, label: "View all team matches" },
                    { href: `/stats?teamId=${team.id}`, label: "Open team statistics" },
                  ].map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="border border-white/10 bg-[#00142b] px-4 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#0b2747]"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="fixtures" className="mt-14">
            <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              Recent
              <span className="block text-[#4ae183]">match boards</span>
            </h2>

            {matches.length === 0 ? (
              <div className="mt-6 border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                Match boards will appear when fixtures are scheduled for this team.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {matches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="block border border-white/10 bg-[#001c3a] p-5 transition hover:bg-[#0b2747]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">
                          {match.league.name} · {match.league.season}
                        </p>
                        <p className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                          {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getMatchTone(match.status)}`}>
                        {formatLabel(match.status)}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="border border-white/10 bg-[#00142b] px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{match.homeTeam.name}</p>
                        <p className="mt-2 font-[var(--font-display)] text-3xl font-black text-white">
                          {formatScore(getInning(match, match.homeTeamId))}
                        </p>
                      </div>
                      <div className="border border-white/10 bg-[#00142b] px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{match.awayTeam.name}</p>
                        <p className="mt-2 font-[var(--font-display)] text-3xl font-black text-white">
                          {formatScore(getInning(match, match.awayTeamId))}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#9bb2d1] sm:flex-row sm:items-center sm:justify-between">
                      <span>{match.result || formatDateTime(match.matchDate)}</span>
                      <span>{match.venue ? `${match.venue.name}, ${match.venue.city}` : "Venue pending"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
