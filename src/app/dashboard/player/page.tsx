import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";
import { canAccessPlayerDashboard } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

async function getPlayerData(userId: string) {
  const player = await prisma.player.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, profileImage: true, city: true } },
      team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      playerStats: { where: { leagueId: OVERALL_LEAGUE_KEY }, orderBy: { updatedAt: "desc" }, take: 1 },
      battingScores: {
        include: {
          innings: {
            include: {
              match: {
                include: {
                  homeTeam: { select: { shortName: true } },
                  awayTeam: { select: { shortName: true } },
                  league: { select: { name: true } },
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
                },
              },
            },
          },
        },
        orderBy: { innings: { createdAt: "desc" } },
        take: 10,
      },
      awards: {
        include: { league: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  return player;
}

export default async function PlayerDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || !canAccessPlayerDashboard(session.user.role)) redirect("/login");

  const player = await getPlayerData(session.user.id);

  if (!player) {
    return (
      <PublicShell mainClassName="overflow-hidden">
        <div className="flex min-h-[60vh] items-center justify-center bg-[#00142b] text-[#d4e3ff]">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9bb2d1]">Profile not found</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              No Player Profile Found
            </h2>
            <p className="mt-3 text-sm text-[#9bb2d1]">Ask your team manager or admin to create your player profile.</p>
          </div>
        </div>
      </PublicShell>
    );
  }

  const careerStats = player.playerStats[0];
  const totalRuns = player.battingScores.reduce((s, b) => s + b.runs, 0);
  const totalWickets = player.bowlingScores.reduce((s, b) => s + b.wickets, 0);
  const bestBat = player.battingScores.reduce((best, b) => b.runs > best ? b.runs : best, 0);

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
              Player Dashboard
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="flex items-center gap-5">
                {player.user.profileImage ? (
                  <img
                    src={player.user.profileImage}
                    alt={player.user.name}
                    className="h-20 w-20 flex-none border-2 border-white/20 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 flex-none items-center justify-center bg-[#1b3656] text-3xl font-black text-white">
                    {player.user.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
                      {player.user.name}
                    </h1>
                    {player.isCaptain && (
                      <span className="border border-yellow-400/40 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">Captain</span>
                    )}
                    {player.isViceCaptain && (
                      <span className="border border-blue-400/40 bg-blue-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">Vice Captain</span>
                    )}
                    {player.isWicketkeeper && (
                      <span className="border border-purple-400/40 bg-purple-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">Wicketkeeper</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#9bb2d1]">
                    <span className="uppercase tracking-[0.12em]">{player.role.replace(/_/g, " ")}</span>
                    <span>{player.battingHand} bat</span>
                    {player.jerseyNumber && <span>#{player.jerseyNumber}</span>}
                    {player.user.city && <span>{player.user.city}</span>}
                  </div>
                  {player.team && (
                    <Link href={`/teams/${player.team.id}`} className="mt-2 inline-flex items-center gap-2 border border-white/10 bg-[#001c3a] px-3 py-1 text-xs font-bold text-[#d4e3ff] transition hover:border-[#4ae183] hover:text-[#4ae183]">
                      <div className="h-2 w-2" style={{ backgroundColor: player.team.jerseyColor || "#4ae183" }} />
                      {player.team.name}
                    </Link>
                  )}
                </div>
              </div>
              <Link
                href={`/players/${player.id}`}
                className="border border-white/10 bg-[#001c3a] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#d4e3ff] transition hover:bg-[#0b2747]"
              >
                Public Profile →
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:py-12">
          {/* Quick stats */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Matches Played", value: careerStats?.matchesPlayed || player.battingScores.length },
              { label: "Total Runs", value: careerStats?.runs ?? totalRuns },
              { label: "Total Wickets", value: careerStats?.wickets ?? totalWickets },
              { label: "Highest Score", value: careerStats?.highestScore ?? bestBat },
            ].map((s) => (
              <div key={s.label} className="border border-white/10 bg-[#001c3a] px-4 py-4 text-center">
                <p className="font-[var(--font-display)] text-3xl font-black text-white">{s.value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Batting + Bowling */}
            <div className="space-y-6 lg:col-span-2">
              {player.battingScores.length > 0 && (
                <div className="border border-white/10 bg-[#001c3a]">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <h3 className="font-[var(--font-display)] text-lg font-black uppercase tracking-tight text-white">Recent Batting</h3>
                    <Link href={`/players/${player.id}`} className="text-[10px] font-black uppercase tracking-[0.18em] text-[#4ae183] hover:underline">
                      See all
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#0b2747] text-[10px] font-black uppercase tracking-[0.14em] text-[#9bb2d1]">
                          <th className="px-4 py-2 text-left">Match</th>
                          <th className="px-3 py-2 text-center">R</th>
                          <th className="px-3 py-2 text-center">B</th>
                          <th className="px-3 py-2 text-center">4s</th>
                          <th className="px-3 py-2 text-center">6s</th>
                          <th className="px-3 py-2 text-center">SR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {player.battingScores.slice(0, 8).map((bat) => (
                          <tr key={bat.id} className="transition hover:bg-[#0b2747]">
                            <td className="px-4 py-3 text-xs">
                              <Link href={`/matches/${bat.innings.matchId}`} className="font-bold text-[#d4e3ff] hover:text-[#4ae183]">
                                {bat.innings.match.homeTeam.shortName} vs {bat.innings.match.awayTeam.shortName}
                              </Link>
                              <p className="text-[#9bb2d1]">{bat.innings.match.league.name}</p>
                            </td>
                            <td className="px-3 py-3 text-center font-black text-white">{bat.runs}</td>
                            <td className="px-3 py-3 text-center text-[#9bb2d1]">{bat.balls}</td>
                            <td className="px-3 py-3 text-center text-[#9bb2d1]">{bat.fours}</td>
                            <td className="px-3 py-3 text-center text-[#9bb2d1]">{bat.sixes}</td>
                            <td className="px-3 py-3 text-center text-[#9bb2d1]">
                              {bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(0) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {player.bowlingScores.length > 0 && (
                <div className="border border-white/10 bg-[#001c3a]">
                  <div className="border-b border-white/10 px-5 py-4">
                    <h3 className="font-[var(--font-display)] text-lg font-black uppercase tracking-tight text-white">Recent Bowling</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#0b2747] text-[10px] font-black uppercase tracking-[0.14em] text-[#9bb2d1]">
                          <th className="px-4 py-2 text-left">Match</th>
                          <th className="px-3 py-2 text-center">O</th>
                          <th className="px-3 py-2 text-center">R</th>
                          <th className="px-3 py-2 text-center">W</th>
                          <th className="px-3 py-2 text-center">Eco</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {player.bowlingScores.slice(0, 8).map((bowl) => (
                          <tr key={bowl.id} className="transition hover:bg-[#0b2747]">
                            <td className="px-4 py-3 text-xs">
                              <Link href={`/matches/${bowl.innings.matchId}`} className="font-bold text-[#d4e3ff] hover:text-[#4ae183]">
                                {bowl.innings.match.homeTeam.shortName} vs {bowl.innings.match.awayTeam.shortName}
                              </Link>
                            </td>
                            <td className="px-3 py-3 text-center text-[#9bb2d1]">{bowl.overs.toFixed(1)}</td>
                            <td className="px-3 py-3 text-center text-[#9bb2d1]">{bowl.runs}</td>
                            <td className="px-3 py-3 text-center font-black text-white">{bowl.wickets}</td>
                            <td className="px-3 py-3 text-center text-[#9bb2d1]">
                              {bowl.overs > 0 ? (bowl.runs / bowl.overs).toFixed(2) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {careerStats && (
                <div className="border border-white/10 bg-[#001c3a]">
                  <div className="border-b border-white/10 px-5 py-4">
                    <h3 className="font-[var(--font-display)] text-lg font-black uppercase tracking-tight text-white">Career Stats</h3>
                  </div>
                  <div className="divide-y divide-white/5 px-5">
                    {[
                      { label: "Average", value: careerStats.average != null ? careerStats.average.toFixed(1) : "N/A" },
                      { label: "Strike Rate", value: careerStats.strikeRate != null ? careerStats.strikeRate.toFixed(1) : "N/A" },
                      { label: "Economy", value: careerStats.economy != null ? careerStats.economy.toFixed(2) : "N/A" },
                      { label: "Fours", value: careerStats.fours },
                      { label: "Sixes", value: careerStats.sixes },
                      { label: "Maidens", value: careerStats.maidens },
                      { label: "Catches", value: careerStats.catches },
                    ].map((s) => (
                      <div key={s.label} className="flex justify-between py-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{s.label}</span>
                        <span className="text-sm font-black text-white">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {player.awards.length > 0 && (
                <div className="border border-white/10 bg-[#001c3a]">
                  <div className="border-b border-white/10 px-5 py-4">
                    <h3 className="font-[var(--font-display)] text-lg font-black uppercase tracking-tight text-white">Awards</h3>
                  </div>
                  <div className="divide-y divide-white/5 px-5">
                    {player.awards.map((award) => (
                      <div key={award.id} className="flex items-center gap-3 py-3">
                        <span className="text-xl">
                          {award.awardType === "MAN_OF_MATCH" ? "🏅" : award.awardType === "BEST_BATSMAN" ? "🏏" : "⭐"}
                        </span>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-white">{award.awardType.replace(/_/g, " ")}</p>
                          <Link href={`/leagues/${award.league.id}`} className="text-[10px] text-[#4ae183] hover:underline">
                            {award.league.name}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
