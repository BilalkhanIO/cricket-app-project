import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import PublicShell from "@/components/layout/PublicShell";
import PublicMatchTabs from "./PublicMatchTabs";
import ShareButton from "@/components/ui/ShareButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      matchFormat: true,
      status: true,
      result: true,
      matchDate: true,
      homeTeam: { select: { shortName: true, name: true } },
      awayTeam: { select: { shortName: true, name: true } },
      league: { select: { name: true, season: true } },
    },
  });
  if (!match) return { title: "Match Not Found — CricketLeague" };

  const vs = `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`;
  const title = `${vs} — ${match.league.name} ${match.league.season}`;
  const description = match.result
    ? `${match.result} | ${match.matchFormat} | ${match.league.name} ${match.league.season}`
    : `${match.status === "LIVE" ? "LIVE NOW" : match.matchFormat} | ${match.homeTeam.name} v ${match.awayTeam.name} | ${match.league.name}`;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  // Use MOM card for completed matches (richer social image), fallback to match card
  const ogImage = match.status === "COMPLETED"
    ? `${baseUrl}/api/og/mom/${id}`
    : `${baseUrl}/api/og/match/${id}`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

async function getMatch(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: {
      league: { select: { id: true, name: true, season: true, oversPerInnings: true } },
      homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      venue: true,
      scorer: { select: { name: true } },
      officials: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
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
              bowler: { include: { user: { select: { name: true } } } },
              fielder: { include: { user: { select: { name: true } } } },
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

function describeBall(ball: any) {
  if (ball.isWicket) return `Wicket · ${formatLabel(ball.wicketType || "OUT")}`;
  if (ball.isSix) return "Six runs";
  if (ball.isBoundary) return "Four runs";
  if (ball.isExtra) return `${formatLabel(ball.extraType || "EXTRA")} · ${ball.extraRuns}`;
  if (ball.runs === 0) return "Dot ball";
  return `${ball.runs} run${ball.runs === 1 ? "" : "s"}`;
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  const homeInning1 = match.innings.find((inning) => inning.inningsNumber === 1 && inning.teamId === match.homeTeamId);
  const homeInning2 = match.innings.find((inning) => inning.inningsNumber === 2 && inning.teamId === match.homeTeamId);
  const awayInning1 = match.innings.find((inning) => inning.inningsNumber === 1 && inning.teamId === match.awayTeamId);
  const awayInning2 = match.innings.find((inning) => inning.inningsNumber === 2 && inning.teamId === match.awayTeamId);
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

  const liveBatters = activeInnings?.battingScores.filter((batter) => !batter.isOut) || [];
  const currentOver =
    activeInnings?.overs.length && !activeInnings.overs[activeInnings.overs.length - 1].isCompleted
      ? activeInnings.overs[activeInnings.overs.length - 1]
      : null;
  const lastCompletedOver =
    activeInnings?.overs
      .slice()
      .reverse()
      .find((over) => over.isCompleted) || null;
  const currentBowler =
    currentOver?.bowlerId ? activeInnings?.bowlingScores.find((bowler) => bowler.playerId === currentOver.bowlerId) : null;
  const lastOverBowler =
    lastCompletedOver?.bowlerId ? activeInnings?.bowlingScores.find((bowler) => bowler.playerId === lastCompletedOver.bowlerId) : null;
  const ballHistory = activeInnings
    ? activeInnings.overs.flatMap((over) => over.balls.map((ball) => ({ ...ball, overNumber: over.overNumber }))).slice(-18).reverse()
    : [];

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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(match.status)}`}>
                  {formatLabel(match.status)}
                </span>
                <Link href={`/leagues/${match.league.id}`} className="bg-[#12324d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d4e3ff]">
                  {match.league.name}
                </Link>
              {match.groupName ? (
                <span className="bg-[#08203d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#4ae183]">
                  {match.groupName}
                </span>
              ) : null}
                {match.stage ? (
                  <span className="bg-[#12324d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#c8c8b0]">
                    {formatLabel(match.stage)}
                  </span>
                ) : null}
              </div>
              <ShareButton label="Share match" />
            </div>

            <div className="mt-6 space-y-5">
              <div className="space-y-5">
                <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
                  <div className="space-y-2">
                    <div className="flex items-end gap-4">
                      <p className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
                        {match.homeTeam.shortName}
                      </p>
                      <div>
                        <p className="font-[var(--font-display)] text-4xl font-black text-white">
                          {formatScore(homeInning1)}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                          {homeInning1 ? `${homeInning1.totalOvers.toFixed(1)}/${match.overs} ov` : `--/${match.overs} ov`}
                        </p>
                      </div>
                    </div>
                    {homeInning2 && <p className="font-[var(--font-display)] text-2xl font-black text-[#c8c8b0]">{formatScore(homeInning2)}</p>}
                  </div>

                  <div className="text-center">
                    <p className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-[#4ae183]">VS</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-end gap-4">
                      <p className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
                        {match.awayTeam.shortName}
                      </p>
                      <div>
                        <p className="font-[var(--font-display)] text-4xl font-black text-white">
                          {formatScore(awayInning1)}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                          {awayInning1 ? `${awayInning1.totalOvers.toFixed(1)}/${match.overs} ov` : `--/${match.overs} ov`}
                        </p>
                      </div>
                    </div>
                    {awayInning2 && <p className="font-[var(--font-display)] text-2xl font-black text-[#c8c8b0]">{formatScore(awayInning2)}</p>}
                  </div>
                </div>

                {match.result && (
                  <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1]">{match.result}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-4">
                {[
                  { value: match.overs, label: "Overs" },
                  { value: match.innings.length, label: "Innings" },
                  { value: match.playingXIs.length, label: "XI entries" },
                  { value: match.officials.length + (match.scorer ? 1 : 0), label: "Officials" },
                ].map((stat) => (
                  <div key={stat.label} className="min-w-[88px]">
                    <p className="font-[var(--font-display)] text-2xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-4">
                {[
                  { label: "Schedule", value: formatDateTime(match.matchDate) },
                  { label: "Venue", value: match.venue ? `${match.venue.name}, ${match.venue.city}` : "Venue pending" },
                  {
                  label: "Toss",
                  value: match.tossWinnerId
                    ? `${match.tossWinnerId === match.homeTeamId ? match.homeTeam.shortName : match.awayTeam.shortName} chose ${match.tossDecision}`
                    : "Pending",
                },
                { label: "Live rates", value: currentRunRate ? `CRR ${currentRunRate}${requiredRunRate ? ` · RRR ${requiredRunRate}` : ""}` : "Not live" },
              ].map((item) => (
                <div key={item.label} className="min-w-[180px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">{item.label}</p>
                  <p className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:py-12">
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr_0.9fr]">
            <div className="border border-white/10 bg-[#001c3a] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Batters on ground</p>
              <div className="mt-4 space-y-4">
                {liveBatters.length > 0 ? (
                  liveBatters.map((batter) => (
                    <div key={batter.id} className="border border-white/10 bg-[#00142b] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                            {batter.player.user.name}
                          </p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Not out</p>
                        </div>
                        <p className="font-[var(--font-display)] text-3xl font-black text-white">{batter.runs}</p>
                      </div>
                      <p className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-[#d4e3ff]">
                        {batter.balls} balls · {batter.fours} fours · {batter.sixes} sixes
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#9bb2d1]">No active batters recorded yet.</p>
                )}
              </div>
            </div>

            <div className="border border-white/10 bg-[#001c3a] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Bowling control</p>
              <div className="mt-4 space-y-4">
                <div className="border border-white/10 bg-[#00142b] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Current bowler</p>
                  {currentBowler ? (
                    <>
                      <p className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                        {currentBowler.player.user.name}
                      </p>
                      <p className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-[#d4e3ff]">
                        {currentBowler.overs.toFixed(1)} overs · {currentBowler.runs} runs · {currentBowler.wickets} wickets
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-[#9bb2d1]">Over not started.</p>
                  )}
                </div>
                <div className="border border-white/10 bg-[#00142b] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Last over bowler</p>
                  {lastOverBowler ? (
                    <>
                      <p className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                        {lastOverBowler.player.user.name}
                      </p>
                      <p className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-[#d4e3ff]">
                        Over {lastCompletedOver?.overNumber} · {lastOverBowler.overs.toFixed(1)} overs · {lastOverBowler.runs} runs · {lastOverBowler.wickets} wickets
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-[#9bb2d1]">No completed over yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-[#001c3a] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Match records</p>
              <div className="mt-4 grid gap-3">
                {[
                  { icon: CalendarDays, label: "Format", value: `${match.matchFormat} · ${match.overs} overs` },
                  { icon: Users, label: "League season", value: `${match.league.name} · ${match.league.season}` },
                  { icon: ShieldCheck, label: "Scorer", value: match.scorer?.name || "Not assigned" },
                  { icon: Trophy, label: "Result", value: match.result || "In progress" },
                ].map((item) => (
                  <div key={item.label} className="border border-white/10 bg-[#00142b] p-4">
                    <item.icon className="h-5 w-5 text-[#4ae183]" />
                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">{item.label}</p>
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">{item.value}</p>
                  </div>
                ))}
              </div>

            </div>
          </section>

          <section className="mt-14 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Ball
                <span className="block text-[#c8c8b0]">history</span>
              </h2>
              {activeInnings && (
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                  {activeInnings.team.shortName} innings {activeInnings.inningsNumber}
                </p>
              )}
            </div>
            <div className="border border-white/10 bg-[#001c3a]">
              <div className="space-y-0">
                {ballHistory.length > 0 ? (
                  ballHistory.map((ball) => (
                    <div key={ball.id} className="flex items-center gap-4 border-b border-white/10 px-5 py-4 last:border-b-0">
                      <BallDot ball={ball} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold uppercase tracking-[0.14em] text-white">
                          Over {ball.overNumber}.{ball.ballNumber}
                        </p>
                        <p className="mt-1 text-sm text-[#d4e3ff]">{describeBall(ball)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-6 text-sm text-[#9bb2d1]">No ball history recorded yet.</div>
                )}
              </div>
            </div>
          </section>

          <PublicMatchTabs match={match as any} />
        </div>
      </div>
    </PublicShell>
  );
}
