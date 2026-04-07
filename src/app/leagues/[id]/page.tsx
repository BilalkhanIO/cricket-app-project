import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Camera,
  CircleAlert,
  LayoutGrid,
  Megaphone,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { getQualificationSlotsForPool, getQualificationStatus } from "@/lib/pools";
import { formatDate, formatDateTime } from "@/lib/utils";
import PublicShell from "@/components/layout/PublicShell";
import ShareButton from "@/components/ui/ShareButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const league = await prisma.league.findUnique({
    where: { id },
    select: { name: true, season: true, matchFormat: true, description: true },
  });
  if (!league) return { title: "League Not Found — CricketLeague" };

  const title = `${league.name} ${league.season} — CricketLeague`;
  const description = league.description || `${league.matchFormat ?? "Cricket"} tournament — standings, fixtures, teams, and stats for ${league.name} ${league.season}.`;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  // Use standings snapshot as OG image (more data-rich than generic league card)
  const ogImage = `${baseUrl}/api/og/standings/${id}`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

async function getLeague(id: string) {
  return prisma.league.findUnique({
    where: { id },
    include: {
      admin: { select: { name: true } },
      parentLeague: { select: { id: true, name: true } },
      seasons: {
        select: { id: true, name: true, season: true, status: true, year: true },
        orderBy: [{ year: "desc" }, { createdAt: "desc" }],
        take: 6,
      },
      teams: {
        include: {
          team: {
            include: {
              manager: { select: { name: true } },
              _count: { select: { players: true } },
            },
          },
        },
        where: { status: { in: ["ACTIVE", "APPROVED"] } },
      },
      matches: {
        include: {
          homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
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
        orderBy: { matchDate: "asc" },
      },
      pointsTable: {
        include: {
          team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
        },
        orderBy: [{ points: "desc" }, { netRunRate: "desc" }],
      },
      announcements: {
        where: { isPublic: true },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      sponsors: {
        orderBy: [{ tier: "asc" }, { name: "asc" }],
      },
      awards: {
        include: {
          player: {
            include: {
              user: { select: { name: true } },
              team: { select: { shortName: true, jerseyColor: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      _count: {
        select: {
          announcements: true,
          awards: true,
          matches: true,
          media: true,
          playerRegistrations: true,
          sponsors: true,
          teams: true,
        },
      },
    },
  });
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getFixtureSectionTitle(match: any) {
  if (match.groupName && match.stage) {
    return `${match.groupName} · ${formatLabel(match.stage)}`;
  }

  if (match.groupName) {
    return match.groupName;
  }

  if (match.stage) {
    return formatLabel(match.stage);
  }

  return "Overall schedule";
}

function getFormGuide(teamId: string, matches: any[]) {
  const completedMatches = matches
    .filter((match) => match.status === "COMPLETED" && (match.homeTeamId === teamId || match.awayTeamId === teamId))
    .slice(-5);

  return completedMatches.map((match) => {
    if (!match.winnerTeamId) return "T";
    return match.winnerTeamId === teamId ? "W" : "L";
  });
}

function getInning(match: any, teamId: string) {
  return match.innings.find((inning: any) => inning.teamId === teamId);
}

function formatScore(inning: any) {
  if (!inning) return "--";
  return `${inning.totalRuns}/${inning.totalWickets}`;
}

function getStatusTone(status: string) {
  if (status === "ACTIVE") return "bg-[#4ae183] text-[#003919]";
  if (status === "REGISTRATION") return "bg-[#c8c8b0] text-[#303221]";
  if (status === "COMPLETED") return "bg-[#1b3656] text-[#d4e3ff]";
  return "bg-[#12324d] text-[#9bb2d1]";
}

function MatchBoard({ match }: { match: any }) {
  const homeInning = getInning(match, match.homeTeamId);
  const awayInning = getInning(match, match.awayTeamId);

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block border border-white/10 bg-[#001c3a] p-5 transition hover:bg-[#0b2747]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">
            {match.status === "LIVE" ? "Live match" : match.status === "COMPLETED" ? "Final result" : "Scheduled fixture"}
          </p>
          {(match.groupName || match.stage) ? (
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#4ae183]">
              {[match.groupName, match.stage].filter(Boolean).join(" · ").replace(/_/g, " ")}
            </p>
          ) : null}
          <p className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
            {match.homeTeam.shortName} vs {match.awayTeam.shortName}
          </p>
        </div>
        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(match.status)}`}>
          {formatLabel(match.status)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="border border-white/10 bg-[#00142b] px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9bb2d1]">{match.homeTeam.name}</p>
          <p className="mt-2 font-[var(--font-display)] text-3xl font-black text-white">{formatScore(homeInning)}</p>
        </div>
        <div className="border border-white/10 bg-[#00142b] px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9bb2d1]">{match.awayTeam.name}</p>
          <p className="mt-2 font-[var(--font-display)] text-3xl font-black text-white">{formatScore(awayInning)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#9bb2d1] sm:flex-row sm:items-center sm:justify-between">
        <span>{match.status === "UPCOMING" ? formatDateTime(match.matchDate) : match.result || formatDateTime(match.matchDate)}</span>
        <span>{match.venue ? `${match.venue.name}, ${match.venue.city}` : "Venue pending"}</span>
      </div>
    </Link>
  );
}

export default async function LeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const league = await getLeague(id);
  if (!league) notFound();

  const liveMatches = league.matches.filter((match) => match.status === "LIVE");
  const upcomingMatches = league.matches.filter((match) => ["UPCOMING", "TOSS"].includes(match.status));
  const completedMatches = league.matches.filter((match) => match.status === "COMPLETED");
  const enrichedPointsTable = league.pointsTable.map((row) => ({
    ...row,
    formGuide: getFormGuide(row.teamId, league.matches as any[]),
  }));
  const groupedPointsTable = enrichedPointsTable.reduce<Record<string, typeof enrichedPointsTable>>((accumulator, row) => {
    const key = row.group || "Overall";
    if (!accumulator[key]) accumulator[key] = [];
    accumulator[key].push(row);
    return accumulator;
  }, {});
  const groupedStandingsWithQualification = Object.fromEntries(
    Object.entries(groupedPointsTable).map(([groupName, rows]) => [
      groupName,
      rows.map((row, index) => ({
        ...row,
        qualificationStatus: getQualificationStatus(index, rows.length, groupName, league.poolConfigJson),
      })),
    ])
  );
  const groupedTeams = league.teams.reduce<Record<string, typeof league.teams>>((accumulator, row) => {
    const key = row.group || "Overall";
    if (!accumulator[key]) accumulator[key] = [];
    accumulator[key].push(row);
    return accumulator;
  }, {});
  const groupedUpcomingMatches = upcomingMatches.reduce<Record<string, typeof upcomingMatches>>((accumulator, match) => {
    const key = getFixtureSectionTitle(match);
    if (!accumulator[key]) accumulator[key] = [];
    accumulator[key].push(match);
    return accumulator;
  }, {});
  const groupedCompletedMatches = completedMatches
    .slice()
    .reverse()
    .reduce<Record<string, typeof completedMatches>>((accumulator, match) => {
      const key = getFixtureSectionTitle(match);
      if (!accumulator[key]) accumulator[key] = [];
      accumulator[key].push(match);
      return accumulator;
    }, {});

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "standings", label: "Standings" },
    { id: "fixtures", label: "Fixtures" },
    { id: "teams", label: "Teams" },
    { id: "records", label: "Awards" },
    { id: "bulletin", label: "Bulletin" },
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
              League hub
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(league.status)}`}>
                      {formatLabel(league.status)}
                    </span>
                    <span className="bg-[#12324d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                      {league.matchFormat}
                    </span>
                    <span className="bg-[#12324d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                      {formatLabel(league.tournamentType)}
                    </span>
                  </div>
                  <ShareButton label="Share league" />
                </div>

                <div>
                  <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                    {league.name}
                  </h1>
                  <p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-[#c8c8b0]">
                    {league.season} · {league.year}
                    {league.parentLeague ? ` · ${league.parentLeague.name}` : ""}
                  </p>
                </div>

                <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1] sm:text-base">
                  {league.description ||
                    `${league.matchFormat ? league.matchFormat + " tournament" : "Cricket league"} — ${league.season}. Live fixtures, standings, results, stats, and team information.`}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/matches?leagueId=${league.id}`}
                    className="bg-[#4ae183] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-[#003919] transition hover:bg-[#6bfe9c]"
                  >
                    Open fixtures
                  </Link>
                  <Link
                    href={`/leagues/${league.id}/media`}
                    className="bg-[#1b3656] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-[#234669]"
                  >
                    Media gallery
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { value: league._count.teams, label: "Teams" },
                  { value: league._count.matches, label: "Matches" },
                  { value: liveMatches.length, label: "Live" },
                  { value: league.teams.reduce((sum, teamLeague) => sum + teamLeague.team._count.players, 0), label: "Squad players" },
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
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Window</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {formatDate(league.startDate)} to {formatDate(league.endDate)}
                </p>
              </div>
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Phase</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {league.status === "REGISTRATION" ? "Setup in progress" : formatLabel(league.status)}
                </p>
              </div>
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Competition desk</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">{league.admin.name}</p>
              </div>
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">League family</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {league.parentLeague ? league.parentLeague.name : "Standalone"}
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
                Competition
                <span className="block text-[#4ae183]">overview</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: CalendarDays, label: "Schedule span", value: `${formatDate(league.startDate)} to ${formatDate(league.endDate)}` },
                  { icon: LayoutGrid, label: "Overs per innings", value: `${league.oversPerInnings} overs` },
                  { icon: ShieldCheck, label: "Squad and XI", value: `${league.squadSizeLimit} squad · ${league.playingXISize} XI` },
                  { icon: Users, label: "Points model", value: `${league.pointsPerWin} win · ${league.pointsPerTie} tie · ${league.pointsPerNoResult} NR` },
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
                Season
                <span className="block text-[#c8c8b0]">lineage</span>
              </h2>
              <div className="border border-white/10 bg-[#001c3a] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">Current branch</p>
                <p className="mt-2 font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                  {league.parentLeague ? `${league.parentLeague.name} / ${league.season}` : league.season}
                </p>
                <p className="mt-3 text-sm leading-7 text-[#9bb2d1]">
                  {league.parentLeague
                    ? `This league runs as a season under ${league.parentLeague.name}.`
                    : "This competition is operating as a standalone league season."}
                </p>

                {league.seasons.length > 0 && (
                  <div className="mt-5 grid gap-3">
                    {league.seasons.map((season) => (
                      <Link
                        key={season.id}
                        href={`/leagues/${season.id}`}
                        className="flex items-center justify-between gap-4 border border-white/10 bg-[#00142b] px-4 py-4 transition hover:bg-[#0b2747]"
                      >
                        <div>
                          <p className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">
                            {season.name}
                          </p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                            {season.season} · {season.year}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(season.status)}`}>
                          {formatLabel(season.status)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section id="standings" className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Table
                <span className="block text-[#4ae183]">standings</span>
              </h2>
            </div>

            {enrichedPointsTable.length === 0 ? (
              <div className="mt-6 border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                Standings will appear once league results are recorded.
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {Object.entries(groupedStandingsWithQualification).map(([groupName, rows]) => (
                  <div key={groupName} className="overflow-x-auto border border-white/10 bg-[#001c3a]">
                    <div className="border-b border-white/10 bg-[#08203d] px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#4ae183]">
                      {groupName}
                    </div>
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-white/10 bg-[#00142b] text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                        <tr>
                          <th className="px-4 py-4 text-left">Team</th>
                          <th className="px-3 py-4 text-center">M</th>
                          <th className="px-3 py-4 text-center">W</th>
                          <th className="px-3 py-4 text-center">L</th>
                          <th className="px-3 py-4 text-center">T</th>
                          <th className="px-3 py-4 text-center">Pts</th>
                          <th className="px-3 py-4 text-center">NRR</th>
                          <th className="px-3 py-4 text-center">Status</th>
                          <th className="px-4 py-4 text-left">Form</th>
                        </tr>
                      </thead>
                      <tbody>
                    {rows.map((row, index) => (
                      <tr key={row.id} className="border-b border-white/10 last:border-b-0">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 items-center justify-center text-xs font-black text-white"
                              style={{ backgroundColor: row.team.jerseyColor || "#1b3656" }}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <Link href={`/teams/${row.teamId}`} className="font-bold uppercase tracking-[0.08em] text-white">
                                {row.team.name}
                              </Link>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                                {row.team.shortName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-center font-bold text-[#d4e3ff]">{row.matchesPlayed}</td>
                        <td className="px-3 py-4 text-center font-bold text-[#4ae183]">{row.wins}</td>
                        <td className="px-3 py-4 text-center font-bold text-[#ffb4ab]">{row.losses}</td>
                        <td className="px-3 py-4 text-center font-bold text-[#c8c8b0]">{row.ties}</td>
                        <td className="px-3 py-4 text-center font-[var(--font-display)] text-2xl font-black text-white">{row.points}</td>
                        <td className="px-3 py-4 text-center font-bold text-[#d4e3ff]">
                          {row.netRunRate > 0 ? "+" : ""}
                          {row.netRunRate.toFixed(3)}
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span
                            className={`px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                              row.qualificationStatus === "Qualified"
                                ? "bg-[#4ae183] text-[#003919]"
                                : "bg-[#12324d] text-[#d4e3ff]"
                            }`}
                          >
                            {row.qualificationStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            {row.formGuide.map((result: string, formIndex: number) => (
                              <span
                                key={`${row.id}-${formIndex}`}
                                className={`flex h-6 w-6 items-center justify-center text-[10px] font-black ${
                                  result === "W"
                                    ? "bg-[#4ae183] text-[#003919]"
                                    : result === "L"
                                      ? "bg-[#93000a] text-[#ffdad6]"
                                      : "bg-[#c8c8b0] text-[#303221]"
                                }`}
                              >
                                {result}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                      </tbody>
                    </table>
                    <div className="border-t border-white/10 bg-[#00142b] px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                      Qualification marker uses current standings order.{" "}
                      {`${getQualificationSlotsForPool(groupName, league.poolConfigJson)} `}
                      teams shown as qualified in this pool.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="fixtures" className="mt-14 grid gap-6 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-1">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Matchday
                <span className="block text-[#c8c8b0]">centre</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {[
                  { label: "Live", value: liveMatches.length },
                  { label: "Upcoming", value: upcomingMatches.length },
                  { label: "Completed", value: completedMatches.length },
                ].map((item) => (
                  <div key={item.label} className="border border-white/10 bg-[#001c3a] p-4">
                    <p className="font-[var(--font-display)] text-3xl font-black text-white">{item.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 xl:col-span-2">
              {liveMatches.length > 0 && (
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#4ae183]">Live now</p>
                  <div className="grid gap-4">{liveMatches.map((match) => <MatchBoard key={match.id} match={match} />)}</div>
                </div>
              )}

              <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#c8c8b0]">Upcoming fixtures</p>
                {upcomingMatches.length > 0 ? (
                  <div className="space-y-5">
                    {Object.entries(groupedUpcomingMatches).map(([sectionTitle, matches]) => (
                      <div key={sectionTitle}>
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">
                          {sectionTitle}
                        </p>
                        <div className="grid gap-4">
                          {matches.slice(0, 5).map((match) => <MatchBoard key={match.id} match={match} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                    No upcoming fixtures have been scheduled yet.
                  </div>
                )}
              </div>

              <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">Recent results</p>
                {completedMatches.length > 0 ? (
                  <div className="space-y-5">
                    {Object.entries(groupedCompletedMatches).map(([sectionTitle, matches]) => (
                      <div key={sectionTitle}>
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">
                          {sectionTitle}
                        </p>
                        <div className="grid gap-4">
                          {matches.slice(0, 5).map((match) => <MatchBoard key={match.id} match={match} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                    Results will appear once completed matches are locked in.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section id="teams" className="mt-14 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                  Teams
                  <span className="block text-[#4ae183]">in the field</span>
                </h2>
              </div>

              {league.teams.length === 0 ? (
                <div className="mt-6 border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                  No teams have been assigned to this league yet.
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {Object.entries(groupedTeams).map(([groupName, teams]) => (
                    <div key={groupName}>
                      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#4ae183]">{groupName}</p>
                      <div className="grid gap-4 md:grid-cols-2">
                  {teams.map((teamLeague) => (
                    <Link
                      key={teamLeague.teamId}
                      href={`/teams/${teamLeague.teamId}`}
                      className="block border border-white/10 bg-[#001c3a] p-5 transition hover:bg-[#0b2747]"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="flex h-12 w-12 items-center justify-center text-sm font-black text-white"
                          style={{ backgroundColor: teamLeague.team.jerseyColor || "#1b3656" }}
                        >
                          {teamLeague.team.shortName}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                            {teamLeague.team.name}
                          </p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                            Managed by {teamLeague.team.manager.name}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="border border-white/10 bg-[#00142b] px-3 py-3">
                          <p className="font-[var(--font-display)] text-2xl font-black text-white">
                            {teamLeague.team._count.players}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Players</p>
                        </div>
                        <div className="border border-white/10 bg-[#00142b] px-3 py-3">
                          <p className="font-[var(--font-display)] text-2xl font-black text-white">
                            {getFormGuide(teamLeague.teamId, league.matches as any[]).join("") || "--"}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Recent form</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Operations
                <span className="block text-[#c8c8b0]">desk</span>
              </h2>

              <div className="border border-white/10 bg-[#001c3a] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">Rules snapshot</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Powerplay", value: `${league.powerplayOvers} overs` },
                    { label: "Super over", value: league.superOverEnabled ? "Enabled" : "Disabled" },
                    { label: "Match format", value: league.matchFormat },
                    { label: "Tournament type", value: formatLabel(league.tournamentType) },
                    { label: "Minimum overs", value: `${league.minimumOversForResult} overs` },
                    { label: "Tie rule", value: league.tieRule || "Standard" },
                  ].map((item) => (
                    <div key={item.label} className="border border-white/10 bg-[#00142b] px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{item.label}</p>
                      <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/10 bg-[#001c3a] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">Sponsors and media</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Trophy, value: league._count.sponsors, label: "Sponsors" },
                    { icon: Camera, value: league._count.media, label: "Media" },
                    { icon: Megaphone, value: league._count.announcements, label: "Notices" },
                  ].map((item) => (
                    <div key={item.label} className="border border-white/10 bg-[#00142b] px-4 py-4">
                      <item.icon className="h-5 w-5 text-[#4ae183]" />
                      <p className="mt-4 font-[var(--font-display)] text-3xl font-black text-white">{item.value}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="records" className="mt-14 grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Awards
                <span className="block text-[#4ae183]">and honours</span>
              </h2>

              {league.awards.length === 0 ? (
                <div className="border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                  Awards and honours will appear once the competition records them.
                </div>
              ) : (
                <div className="grid gap-4">
                  {league.awards.map((award) => (
                    <div key={award.id} className="border border-white/10 bg-[#001c3a] p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#c8c8b0]">
                        {formatLabel(award.awardType)}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                            {award.player?.user.name || "League award"}
                          </p>
                          {award.description && (
                            <p className="mt-2 text-sm leading-7 text-[#9bb2d1]">{award.description}</p>
                          )}
                        </div>
                        {award.player?.team && (
                          <div
                            className="flex h-12 w-12 items-center justify-center text-sm font-black text-white"
                            style={{ backgroundColor: award.player.team.jerseyColor || "#1b3656" }}
                          >
                            {award.player.team.shortName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Sponsors
                <span className="block text-[#c8c8b0]">and partners</span>
              </h2>

              {league.sponsors.length === 0 ? (
                <div className="border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                  No sponsors are listed publicly for this league yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {league.sponsors.map((sponsor) => (
                    <div key={sponsor.id} className="border border-white/10 bg-[#001c3a] p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">
                        {sponsor.tier || "League partner"}
                      </p>
                      <p className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                        {sponsor.name}
                      </p>
                      {sponsor.website ? (
                        <a
                          href={sponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block text-xs font-black uppercase tracking-[0.18em] text-[#4ae183] underline"
                        >
                          Visit sponsor
                        </a>
                      ) : (
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">
                          Public partner listing
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section id="bulletin" className="mt-14 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                League
                <span className="block text-[#4ae183]">bulletin</span>
              </h2>

              {league.announcements.length === 0 ? (
                <div className="border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                  No public announcements are available yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {league.announcements.map((announcement) => (
                    <div key={announcement.id} className="border border-white/10 bg-[#001c3a] p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4ae183]">Notice</p>
                      <p className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                        {announcement.title}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[#9bb2d1]">{announcement.content}</p>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#7f9abd]">
                        <span>{announcement.author.name}</span>
                        <span>{formatDate(announcement.createdAt)}</span>
                      </div>
                    </div>
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
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">What you can do</p>
                <div className="mt-4 grid gap-3">
                  {[
                    { href: `/matches?leagueId=${league.id}`, label: "View all league matches", icon: CalendarDays },
                    { href: `/stats?leagueId=${league.id}`, label: "Open league statistics", icon: Trophy },
                    { href: `/leagues/${league.id}/media`, label: "Browse media gallery", icon: Camera },
                  ].map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-center justify-between gap-4 border border-white/10 bg-[#00142b] px-4 py-4 transition hover:bg-[#0b2747]"
                    >
                      <div className="flex items-center gap-3">
                        <action.icon className="h-5 w-5 text-[#4ae183]" />
                        <span className="text-sm font-bold uppercase tracking-[0.14em] text-white">{action.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border border-white/10 bg-[#4ae183] p-6 text-[#003919]">
                <div className="flex items-start gap-3">
                  <CircleAlert className="mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight">
                      Matchday ready
                    </p>
                    <p className="mt-3 text-sm font-medium leading-6">
                      Follow standings, match boards, season lineage, awards, and public league updates from one complete league page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
