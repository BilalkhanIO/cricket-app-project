import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ShieldCheck, Trophy, Users } from "lucide-react";
import prisma from "@/lib/prisma";
import PublicShell from "@/components/layout/PublicShell";
import PlayerStatsCharts from "./PlayerStatsCharts";
import ShareButton from "@/components/ui/ShareButton";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const player = await prisma.player.findUnique({
    where: { id },
    select: {
      user: { select: { name: true, battingStyle: true, bowlingStyle: true } },
      team: { select: { name: true } },
      role: true,
    },
  });
  if (!player) return { title: "Player Not Found — CricketLeague" };

  const title = `${player.user.name} — ${player.team?.name ?? "Cricket"} | CricketLeague`;
  const parts = [player.role, player.user.battingStyle, player.user.bowlingStyle].filter(Boolean);
  const description = `${player.user.name} cricket profile${player.team ? ` · ${player.team.name}` : ""}${parts.length ? ` · ${parts.join(" · ")}` : ""}. Stats, match history, and records.`;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const ogImage = `${baseUrl}/api/og/player/${id}`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile", images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

async function getPlayer(id: string) {
  return prisma.player.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          profileImage: true,
          city: true,
          dateOfBirth: true,
          battingStyle: true,
          bowlingStyle: true,
        },
      },
      team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      playerStats: { orderBy: { updatedAt: "desc" } },
      battingScores: {
        include: {
          innings: {
            include: {
              match: {
                include: {
                  homeTeam: { select: { shortName: true } },
                  awayTeam: { select: { shortName: true } },
                  league: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { innings: { createdAt: "desc" } },
        take: 10,
      },
      bowlingScores: {
        include: {
          innings: {
            include: {
              match: {
                include: {
                  homeTeam: { select: { shortName: true } },
                  awayTeam: { select: { shortName: true } },
                  league: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { innings: { createdAt: "desc" } },
        take: 10,
      },
      awards: {
        include: {
          league: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

async function getLeagueNames(leagueIds: string[]) {
  if (leagueIds.length === 0) return new Map<string, string>();
  const leagues = await prisma.league.findMany({
    where: { id: { in: leagueIds } },
    select: { id: true, name: true },
  });
  return new Map(leagues.map((league) => [league.id, league.name]));
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const careerStats = player.playerStats.find((stats) => stats.leagueId === OVERALL_LEAGUE_KEY) || player.playerStats[0];
  const leagueStats = player.playerStats.filter((stats) => stats.leagueId && stats.leagueId !== OVERALL_LEAGUE_KEY);
  const leagueNames = await getLeagueNames(Array.from(new Set(leagueStats.map((stats) => stats.leagueId!).filter(Boolean))));

  const battingChartData = player.battingScores.slice().reverse().map((bat, index) => ({
    match: `M${index + 1}`,
    runs: bat.runs,
  }));
  const bowlingChartData = player.bowlingScores.slice().reverse().map((bowl, index) => ({
    match: `M${index + 1}`,
    wickets: bowl.wickets,
  }));

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "career", label: "Career" },
    { id: "league-stats", label: "Leagues" },
    { id: "recent", label: "Recent Form" },
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
              Player hub
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  {player.user.profileImage ? (
                    <img src={player.user.profileImage} alt={player.user.name} className="h-20 w-20 rounded-full object-cover border border-white/20" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1b3656] text-3xl font-black text-white">
                      {player.user.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                      {player.user.name}
                    </h1>
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-[#c8c8b0]">
                      {formatLabel(player.role)} · {player.battingHand} bat
                      {player.bowlingType ? ` · ${formatLabel(player.bowlingType)}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {player.isCaptain && <span className="bg-[#c8c8b0] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#303221]">Captain</span>}
                  {player.isViceCaptain && <span className="bg-[#12324d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d4e3ff]">Vice captain</span>}
                  {player.isWicketkeeper && <span className="bg-[#1b3656] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">Wicketkeeper</span>}
                  {player.jerseyNumber && <span className="bg-[#12324d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d4e3ff]">#{player.jerseyNumber}</span>}
                  {player.availabilityStatus && player.availabilityStatus !== "AVAILABLE" && (
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                      player.availabilityStatus === "INJURED"
                        ? "bg-[#93000a] text-[#ffdad6]"
                        : "bg-[#3a2e00] text-[#fbbf24]"
                    }`}>
                      {player.availabilityStatus.replace(/_/g, " ")}
                    </span>
                  )}
                  <ShareButton label="Share profile" />
                </div>

                <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1]">
                  {player.user.battingStyle || player.user.bowlingStyle
                    ? [player.user.battingStyle, player.user.bowlingStyle].filter(Boolean).join(" · ")
                    : `Career stats, match history, awards, and team information for ${player.user.name}.`}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {player.team ? (
                    <Link
                      href={`/teams/${player.team.id}`}
                      className="bg-[#4ae183] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-[#003919] transition hover:bg-[#6bfe9c]"
                    >
                      Open team
                    </Link>
                  ) : (
                    <div className="bg-[#12324d] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-[#d4e3ff]">
                      Free agent
                    </div>
                  )}
                  <Link
                    href="/stats"
                    className="bg-[#1b3656] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-[#234669]"
                  >
                    Open leaderboards
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { value: careerStats?.matchesPlayed || 0, label: "Matches" },
                  { value: careerStats?.runs || 0, label: "Runs" },
                  { value: careerStats?.wickets || 0, label: "Wickets" },
                  { value: player.awards.length, label: "Awards" },
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
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">City</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">{player.user.city || "Not listed"}</p>
              </div>
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Team</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">{player.team?.name || "Unassigned"}</p>
              </div>
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Batting style</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">{player.user.battingStyle || player.battingHand}</p>
              </div>
              <div className="border border-white/10 bg-[#001c3a] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f9abd]">Bowling style</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {player.user.bowlingStyle || player.bowlingType || "Not listed"}
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
          <section id="overview" className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Player
                <span className="block text-[#4ae183]">overview</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Trophy, label: "Best score", value: `${careerStats?.highestScore || 0}` },
                  { icon: ShieldCheck, label: "Best bowling", value: careerStats?.bestBowling || "-" },
                  { icon: Users, label: "Strike rate", value: `${careerStats?.strikeRate.toFixed(1) || "0.0"}` },
                  { icon: CalendarDays, label: "Bowling economy", value: `${careerStats?.economy.toFixed(2) || "0.00"}` },
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
                Awards
                <span className="block text-[#c8c8b0]">and honours</span>
              </h2>
              {player.awards.length === 0 ? (
                <div className="border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                  No public awards are listed for this player yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {player.awards.map((award) => (
                    <div key={award.id} className="border border-white/10 bg-[#001c3a] p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#c8c8b0]">{formatLabel(award.awardType)}</p>
                      <Link href={`/leagues/${award.league.id}`} className="mt-2 block font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                        {award.league.name}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {careerStats && (
            <section id="career" className="mt-14">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Career
                <span className="block text-[#4ae183]">numbers</span>
              </h2>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="border border-white/10 bg-[#001c3a] p-5">
                  <h3 className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">Batting</h3>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      { label: "Matches", value: careerStats.matchesPlayed },
                      { label: "Innings", value: careerStats.innings },
                      { label: "Runs", value: careerStats.runs },
                      { label: "Average", value: careerStats.average.toFixed(1) },
                      { label: "Strike rate", value: careerStats.strikeRate.toFixed(1) },
                      { label: "Highest", value: careerStats.highestScore },
                      { label: "Fours", value: careerStats.fours },
                      { label: "Sixes", value: careerStats.sixes },
                      { label: "Not outs", value: careerStats.notOuts },
                    ].map((item) => (
                      <div key={item.label} className="border border-white/10 bg-[#00142b] px-3 py-3">
                        <p className="font-[var(--font-display)] text-2xl font-black text-white">{item.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-white/10 bg-[#001c3a] p-5">
                  <h3 className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">Bowling and fielding</h3>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      { label: "Wickets", value: careerStats.wickets },
                      { label: "Overs", value: careerStats.oversBowled.toFixed(1) },
                      { label: "Economy", value: careerStats.economy.toFixed(2) },
                      { label: "Bowl avg", value: careerStats.bowlingAverage.toFixed(2) },
                      { label: "Bowl SR", value: careerStats.bowlingStrikeRate.toFixed(2) },
                      { label: "Maidens", value: careerStats.maidens },
                      { label: "Catches", value: careerStats.catches },
                      { label: "Run outs", value: careerStats.runOuts },
                      { label: "Stumpings", value: careerStats.stumpings },
                    ].map((item) => (
                      <div key={item.label} className="border border-white/10 bg-[#00142b] px-3 py-3">
                        <p className="font-[var(--font-display)] text-2xl font-black text-white">{item.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {(battingChartData.length > 1 || bowlingChartData.length > 1) && (
                <div className="mt-6">
                  <PlayerStatsCharts battingData={battingChartData} bowlingData={bowlingChartData} />
                </div>
              )}
            </section>
          )}

          <section id="league-stats" className="mt-14">
            <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              League
              <span className="block text-[#c8c8b0]">breakdown</span>
            </h2>

            {leagueStats.length === 0 ? (
              <div className="mt-6 border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
                League-by-league stats are not available yet.
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto border border-white/10 bg-[#001c3a]">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-white/10 bg-[#00142b] text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                    <tr>
                      <th className="px-4 py-4 text-left">League</th>
                      <th className="px-3 py-4 text-center">M</th>
                      <th className="px-3 py-4 text-center">Runs</th>
                      <th className="px-3 py-4 text-center">Avg</th>
                      <th className="px-3 py-4 text-center">SR</th>
                      <th className="px-3 py-4 text-center">W</th>
                      <th className="px-3 py-4 text-center">Eco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leagueStats
                      .slice()
                      .sort((a, b) => b.runs - a.runs || b.wickets - a.wickets)
                      .map((stats) => (
                        <tr key={stats.id} className="border-b border-white/10 last:border-b-0">
                          <td className="px-4 py-4 font-bold uppercase tracking-[0.06em] text-white">
                            {leagueNames.get(stats.leagueId || "") || "Unknown league"}
                          </td>
                          <td className="px-3 py-4 text-center text-[#d4e3ff]">{stats.matchesPlayed}</td>
                          <td className="px-3 py-4 text-center font-black text-white">{stats.runs}</td>
                          <td className="px-3 py-4 text-center text-[#d4e3ff]">{stats.average.toFixed(2)}</td>
                          <td className="px-3 py-4 text-center text-[#d4e3ff]">{stats.strikeRate.toFixed(2)}</td>
                          <td className="px-3 py-4 text-center font-black text-white">{stats.wickets}</td>
                          <td className="px-3 py-4 text-center text-[#d4e3ff]">{stats.economy.toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section id="recent" className="mt-14 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Recent
                <span className="block text-[#4ae183]">batting</span>
              </h2>
              {player.battingScores.length === 0 ? (
                <div className="border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">No recent batting entries.</div>
              ) : (
                <div className="grid gap-4">
                  {player.battingScores.map((bat) => (
                    <Link key={bat.id} href={`/matches/${bat.innings.matchId}`} className="block border border-white/10 bg-[#001c3a] p-5 transition hover:bg-[#0b2747]">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">
                        {bat.innings.match.league.name}
                      </p>
                      <p className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                        {bat.innings.match.homeTeam.shortName} vs {bat.innings.match.awayTeam.shortName}
                      </p>
                      <div className="mt-4 grid grid-cols-4 gap-3">
                        {[
                          { label: "Runs", value: bat.runs },
                          { label: "Balls", value: bat.balls },
                          { label: "4s", value: bat.fours },
                          { label: "6s", value: bat.sixes },
                        ].map((item) => (
                          <div key={item.label} className="border border-white/10 bg-[#00142b] px-3 py-3">
                            <p className="font-[var(--font-display)] text-2xl font-black text-white">{item.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                Recent
                <span className="block text-[#c8c8b0]">bowling</span>
              </h2>
              {player.bowlingScores.length === 0 ? (
                <div className="border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">No recent bowling entries.</div>
              ) : (
                <div className="grid gap-4">
                  {player.bowlingScores.map((bowl) => (
                    <Link key={bowl.id} href={`/matches/${bowl.innings.matchId}`} className="block border border-white/10 bg-[#001c3a] p-5 transition hover:bg-[#0b2747]">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">
                        {bowl.innings.match.league.name}
                      </p>
                      <p className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                        {bowl.innings.match.homeTeam.shortName} vs {bowl.innings.match.awayTeam.shortName}
                      </p>
                      <div className="mt-4 grid grid-cols-4 gap-3">
                        {[
                          { label: "Overs", value: bowl.overs.toFixed(1) },
                          { label: "Runs", value: bowl.runs },
                          { label: "Wickets", value: bowl.wickets },
                          { label: "Eco", value: bowl.overs > 0 ? (bowl.runs / bowl.overs).toFixed(2) : "-" },
                        ].map((item) => (
                          <div key={item.label} className="border border-white/10 bg-[#00142b] px-3 py-3">
                            <p className="font-[var(--font-display)] text-2xl font-black text-white">{item.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
