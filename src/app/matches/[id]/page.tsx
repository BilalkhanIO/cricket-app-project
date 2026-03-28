import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CircleAlert,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import PublicShell from "@/components/layout/PublicShell";
import LiveCommentary from "./LiveCommentary";

export const dynamic = "force-dynamic";

async function getMatch(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: {
      league: { select: { id: true, name: true, season: true, oversPerInnings: true } },
      homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      venue: true,
      scorer: { select: { name: true } },
      officials: true,
      awards: {
        where: { awardType: "MAN_OF_MATCH" },
        include: {
          player: {
            include: {
              user: { select: { name: true } },
              team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
            },
          },
        },
        take: 1,
      },
      playingXIs: {
        include: {
          player: {
            include: { user: { select: { name: true } } },
          },
        },
        orderBy: { battingOrder: "asc" },
      },
      innings: {
        include: {
          team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          battingScores: {
            include: {
              player: { include: { user: { select: { name: true } } } },
            },
            orderBy: { battingOrder: "asc" },
          },
          bowlingScores: {
            include: {
              player: { include: { user: { select: { name: true } } } },
            },
            orderBy: [{ wickets: "desc" }, { economy: "asc" }],
          },
          overs: {
            orderBy: { overNumber: "asc" },
            include: { balls: { orderBy: { ballNumber: "asc" } } },
          },
        },
        orderBy: { inningsNumber: "asc" },
      },
    },
  });
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getStatusTone(status: string) {
  if (status === "LIVE" || status === "INNINGS_BREAK") return "bg-[#93000a] text-[#ffdad6]";
  if (status === "COMPLETED") return "bg-[#4ae183] text-[#003919]";
  if (status === "TOSS") return "bg-[#c8c8b0] text-[#303221]";
  return "bg-[#12324d] text-[#d4e3ff]";
}

function getInning(match: any, teamId: string) {
  return match.innings.find((inning: any) => inning.teamId === teamId);
}

function formatScore(inning: any) {
  if (!inning) return "--";
  return `${inning.totalRuns}/${inning.totalWickets}`;
}

function BallDot({ ball }: { ball: any }) {
  const label = ball.isWicket ? "W" : ball.isExtra ? (ball.extraType?.charAt(0) || "E") : ball.runs;
  const className = ball.isWicket
    ? "bg-[#93000a] text-[#ffdad6]"
    : ball.isSix
      ? "bg-[#1b3656] text-white"
      : ball.isBoundary
        ? "bg-[#4ae183] text-[#003919]"
        : ball.isExtra
          ? "bg-[#c8c8b0] text-[#303221]"
          : ball.runs === 0
            ? "bg-[#12324d] text-[#d4e3ff]"
            : "bg-white text-[#00142b]";

  return <span className={`flex h-7 w-7 items-center justify-center text-[10px] font-black ${className}`}>{label}</span>;
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  const homeInning1 = match.innings.find((inning) => inning.inningsNumber === 1 && inning.teamId === match.homeTeamId);
  const homeInning2 = match.innings.find((inning) => inning.inningsNumber === 2 && inning.teamId === match.homeTeamId);
  const awayInning1 = match.innings.find((inning) => inning.inningsNumber === 1 && inning.teamId === match.awayTeamId);
  const awayInning2 = match.innings.find((inning) => inning.inningsNumber === 2 && inning.teamId === match.awayTeamId);
  const isLive = ["LIVE", "INNINGS_BREAK"].includes(match.status);
  const activeInnings = match.innings.find((inning) => !inning.isCompleted);
  const currentRunRate =
    activeInnings && activeInnings.totalBalls > 0 ? ((activeInnings.totalRuns / activeInnings.totalBalls) * 6).toFixed(2) : null;
  const targetRuns =
    activeInnings && activeInnings.inningsNumber === 2
      ? (match.innings.find((inning) => inning.inningsNumber === 1)?.totalRuns || 0) + 1
      : null;
  const requiredRunRate =
    activeInnings && activeInnings.inningsNumber === 2 && targetRuns
      ? (() => {
          const ballsLeft = match.overs * 6 - activeInnings.totalBalls;
          const runsLeft = targetRuns - activeInnings.totalRuns;
          return ballsLeft > 0 && runsLeft > 0 ? ((runsLeft / ballsLeft) * 6).toFixed(2) : null;
        })()
      : null;

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "innings", label: "Innings" },
    { id: "overs", label: "Over Log" },
    { id: "officials", label: "Officials" },
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
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(match.status)}`}>
                {formatLabel(match.status)}
              </span>
              <Link href={`/leagues/${match.league.id}`} className="bg-[#12324d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d4e3ff]">
                {match.league.name}
              </Link>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div className="space-y-5">
                <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
                  <div className="text-center sm:text-left">
                    <p className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
                      {match.homeTeam.shortName}
                    </p>
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-[#9bb2d1]">{match.homeTeam.name}</p>
                    <p className="mt-3 font-[var(--font-display)] text-4xl font-black text-white">
                      {formatScore(homeInning1)}
                    </p>
                    {homeInning2 && <p className="mt-1 font-[var(--font-display)] text-3xl font-black text-[#c8c8b0]">{formatScore(homeInning2)}</p>}
                  </div>

                  <div className="text-center">
                    <p className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-[#4ae183]">VS</p>
                  </div>

                  <div className="text-center sm:text-right">
                    <p className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
                      {match.awayTeam.shortName}
                    </p>
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-[#9bb2d1]">{match.awayTeam.name}</p>
                    <p className="mt-3 font-[var(--font-display)] text-4xl font-black text-white">
                      {formatScore(awayInning1)}
                    </p>
                    {awayInning2 && <p className="mt-1 font-[var(--font-display)] text-3xl font-black text-[#c8c8b0]">{formatScore(awayInning2)}</p>}
                  </div>
                </div>

                <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1]">
                  {match.result ||
                    `${match.matchFormat} fixture in ${match.league.name}. Follow scorecards, over history, playing XIs, officials, and live commentary from one public match hub.`}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/scorer/${match.id}`}
                    className="bg-[#4ae183] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-[#003919] transition hover:bg-[#6bfe9c]"
                  >
                    Open scoring panel
                  </Link>
                  <Link
                    href={`/leagues/${match.league.id}`}
                    className="bg-[#1b3656] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-[#234669]"
                  >
                    Back to league
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { value: match.overs, label: "Overs" },
                  { value: match.innings.length, label: "Innings" },
                  { value: match.playingXIs.length, label: "XI entries" },
                  { value: match.officials.length + (match.scorer ? 1 : 0), label: "Officials" },
                ].map((stat) => (
                  <div key={stat.label} className="border border-white/10 bg-[#001c3a] px-4 py-4">
                    <p className="font-[var(--font-display)] text-3xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Schedule</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">{formatDateTime(match.matchDate)}</p>
              </div>
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Venue</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {match.venue ? `${match.venue.name}, ${match.venue.city}` : "Venue pending"}
                </p>
              </div>
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Toss</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {match.tossWinnerId
                    ? `${match.tossWinnerId === match.homeTeamId ? match.homeTeam.shortName : match.awayTeam.shortName} chose ${match.tossDecision}`
                    : "Pending"}
                </p>
              </div>
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Live rates</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {currentRunRate ? `CRR ${currentRunRate}${requiredRunRate ? ` · RRR ${requiredRunRate}` : ""}` : "Not live"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sticky top-[72px] z-30 border-y border-white/10 bg-[rgba(0,20,43,0.94)] px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-screen-xl gap-2 overflow-x-auto">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="whitespace-nowrap bg-[#001c3a] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#d4e3ff] transition hover:bg-[#0b2747]">
                {section.label}
              </a>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:py-12">
          {isLive && match.innings.length > 0 && (
            <section className="mb-10">
              <LiveCommentary matchId={match.id} initialInnings={match.innings as any} />
            </section>
          )}

          <section id="overview" className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Match
                <span className="block text-[#4ae183]">overview</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: CalendarDays, label: "Format", value: `${match.matchFormat} · ${match.overs} overs` },
                  { icon: Users, label: "League season", value: `${match.league.name} · ${match.league.season}` },
                  { icon: ShieldCheck, label: "Target", value: targetRuns ? `${targetRuns}` : "Not set" },
                  { icon: Trophy, label: "Result", value: match.result || "In progress" },
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
                Playing
                <span className="block text-[#c8c8b0]">XIs</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[match.homeTeam, match.awayTeam].map((team) => {
                  const xi = match.playingXIs.filter((entry) => entry.teamId === team.id);

                  return (
                    <div key={team.id} className="border border-white/10 bg-[#001c3a] p-5">
                      <p className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">{team.name}</p>
                      <div className="mt-4 space-y-2">
                        {xi.length > 0 ? (
                          xi.map((entry, index) => (
                            <p key={entry.id} className="text-sm font-bold uppercase tracking-[0.08em] text-[#d4e3ff]">
                              {index + 1}. {entry.player.user.name}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-[#9bb2d1]">Playing XI not confirmed.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section id="innings" className="mt-14 space-y-8">
            <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              Innings
              <span className="block text-[#4ae183]">scorecards</span>
            </h2>

            {match.innings.map((innings) => (
              <div key={innings.id} className="space-y-4">
                <div className="border border-white/10 bg-[#001c3a] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">
                        Innings {innings.inningsNumber}
                      </p>
                      <p className="mt-2 font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                        {innings.team.name}
                      </p>
                    </div>
                    <p className="font-[var(--font-display)] text-4xl font-black text-white">
                      {innings.totalRuns}/{innings.totalWickets}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="border border-white/10 bg-[#001c3a]">
                    <div className="border-b border-white/10 px-5 py-4">
                      <h3 className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">Batting</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="border-b border-white/10 bg-[#00142b] text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                          <tr>
                            <th className="px-4 py-3 text-left">Batter</th>
                            <th className="px-3 py-3 text-center">R</th>
                            <th className="px-3 py-3 text-center">B</th>
                            <th className="px-3 py-3 text-center">4s</th>
                            <th className="px-3 py-3 text-center">6s</th>
                          </tr>
                        </thead>
                        <tbody>
                          {innings.battingScores.map((bat) => (
                            <tr key={bat.id} className="border-b border-white/10 last:border-b-0">
                              <td className="px-4 py-3">
                                <p className="font-bold uppercase tracking-[0.06em] text-white">{bat.player.user.name}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                                  {bat.isOut ? formatLabel(bat.wicketType || "OUT") : "Not out"}
                                </p>
                              </td>
                              <td className="px-3 py-3 text-center font-black text-white">{bat.runs}</td>
                              <td className="px-3 py-3 text-center text-[#d4e3ff]">{bat.balls}</td>
                              <td className="px-3 py-3 text-center text-[#d4e3ff]">{bat.fours}</td>
                              <td className="px-3 py-3 text-center text-[#d4e3ff]">{bat.sixes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border border-white/10 bg-[#001c3a]">
                    <div className="border-b border-white/10 px-5 py-4">
                      <h3 className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">Bowling</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="border-b border-white/10 bg-[#00142b] text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                          <tr>
                            <th className="px-4 py-3 text-left">Bowler</th>
                            <th className="px-3 py-3 text-center">O</th>
                            <th className="px-3 py-3 text-center">R</th>
                            <th className="px-3 py-3 text-center">W</th>
                            <th className="px-3 py-3 text-center">Eco</th>
                          </tr>
                        </thead>
                        <tbody>
                          {innings.bowlingScores.map((bowl) => (
                            <tr key={bowl.id} className="border-b border-white/10 last:border-b-0">
                              <td className="px-4 py-3 font-bold uppercase tracking-[0.06em] text-white">{bowl.player.user.name}</td>
                              <td className="px-3 py-3 text-center text-[#d4e3ff]">{bowl.overs.toFixed(1)}</td>
                              <td className="px-3 py-3 text-center text-[#d4e3ff]">{bowl.runs}</td>
                              <td className="px-3 py-3 text-center font-black text-white">{bowl.wickets}</td>
                              <td className="px-3 py-3 text-center text-[#d4e3ff]">{bowl.economy.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section id="overs" className="mt-14 space-y-6">
            <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              Over
              <span className="block text-[#c8c8b0]">history</span>
            </h2>

            {match.innings.map((innings) => (
              <div key={`${innings.id}-overs`} className="border border-white/10 bg-[#001c3a]">
                <div className="border-b border-white/10 px-5 py-4">
                  <p className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">{innings.team.name}</p>
                </div>
                <div className="space-y-0">
                  {innings.overs.length > 0 ? (
                    [...innings.overs].reverse().map((over) => (
                      <div key={over.id} className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7f9abd]">Over {over.overNumber}</p>
                          <p className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-white">
                            {over.runs} runs · {over.wickets} wickets
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {over.balls.map((ball) => (
                            <BallDot key={ball.id} ball={ball} />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-6 text-sm text-[#9bb2d1]">No over history recorded yet.</div>
                  )}
                </div>
              </div>
            ))}
          </section>

          <section id="officials" className="mt-14 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Match
                <span className="block text-[#4ae183]">officials</span>
              </h2>
              <div className="border border-white/10 bg-[#001c3a] p-5">
                <div className="space-y-3">
                  {match.officials.map((official) => (
                    <div key={official.id} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{official.role}</span>
                      <span className="text-sm font-bold uppercase tracking-[0.08em] text-white">{official.name}</span>
                    </div>
                  ))}
                  {match.scorer && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Scorer</span>
                      <span className="text-sm font-bold uppercase tracking-[0.08em] text-white">{match.scorer.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Match
                <span className="block text-[#c8c8b0]">notes</span>
              </h2>
              <div className="border border-white/10 bg-[#4ae183] p-6 text-[#003919]">
                <div className="flex items-start gap-3">
                  <CircleAlert className="mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight">Public match hub</p>
                    <p className="mt-3 text-sm font-medium leading-6">
                      This page now carries the full public match story: scoreboard, innings, over log, playing XIs, live commentary, and officials in one place.
                    </p>
                  </div>
                </div>
              </div>

              {match.awards[0]?.player && (
                <div className="border border-white/10 bg-[#001c3a] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#c8c8b0]">Man of the match</p>
                  <p className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                    {match.awards[0].player.user.name}
                  </p>
                  {match.awards[0].player.team && (
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-[#9bb2d1]">
                      {match.awards[0].player.team.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
