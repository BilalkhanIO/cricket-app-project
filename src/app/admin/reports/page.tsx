import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getReportData() {
  const [
    totalLeagues,
    totalTeams,
    totalPlayers,
    totalMatches,
    completedMatches,
    liveMatches,
    upcomingMatches,
    topBatters,
    topBowlers,
    topSixers,
    matchOutcomes,
    leagueActivity,
    rawTeamPerformance,
    recentMatchReports,
  ] = await Promise.all([
    prisma.league.count(),
    prisma.team.count(),
    prisma.player.count(),
    prisma.match.count(),
    prisma.match.count({ where: { status: "COMPLETED" } }),
    prisma.match.count({ where: { status: { in: ["LIVE", "INNINGS_BREAK", "TOSS"] } } }),
    prisma.match.count({ where: { status: "UPCOMING" } }),

    // Top 10 run scorers (career)
    prisma.playerStats.findMany({
      where: { leagueId: null, runs: { gt: 0 } },
      orderBy: { runs: "desc" },
      take: 10,
      include: {
        player: {
          include: {
            user: { select: { name: true } },
            team: { select: { shortName: true } },
          },
        },
      },
    }),

    // Top 10 wicket takers (career)
    prisma.playerStats.findMany({
      where: { leagueId: null, wickets: { gt: 0 } },
      orderBy: { wickets: "desc" },
      take: 10,
      include: {
        player: {
          include: {
            user: { select: { name: true } },
            team: { select: { shortName: true } },
          },
        },
      },
    }),

    // Top 10 six hitters (career)
    prisma.playerStats.findMany({
      where: { leagueId: null, sixes: { gt: 0 } },
      orderBy: { sixes: "desc" },
      take: 10,
      include: {
        player: {
          include: {
            user: { select: { name: true } },
            team: { select: { shortName: true } },
          },
        },
      },
    }),

    // Match outcomes breakdown
    prisma.match.groupBy({
      by: ["winType"],
      where: { status: "COMPLETED", winType: { not: null } },
      _count: { id: true },
    }),

    // Leagues with most matches
    prisma.league.findMany({
      select: {
        id: true,
        name: true,
        season: true,
        status: true,
        _count: { select: { matches: true, teams: true } },
      },
      orderBy: { matches: { _count: "desc" } },
      take: 8,
    }),

    // Team performance — aggregate across all points tables
    prisma.team.findMany({
      where: {
        pointsTables: { some: { matchesPlayed: { gt: 0 } } },
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        jerseyColor: true,
        pointsTables: {
          select: { matchesPlayed: true, wins: true, losses: true, ties: true, noResults: true, points: true },
        },
      },
      orderBy: { name: "asc" },
      take: 20,
    }),

    // Recent completed match reports
    prisma.match.findMany({
      where: { status: "COMPLETED" },
      include: {
        homeTeam: { select: { shortName: true, jerseyColor: true } },
        awayTeam: { select: { shortName: true, jerseyColor: true } },
        league: { select: { name: true, season: true } },
        venue: { select: { name: true, city: true } },
        innings: {
          select: { inningsNumber: true, teamId: true, totalRuns: true, totalWickets: true, totalOvers: true },
        },
      },
      orderBy: { matchDate: "desc" },
      take: 10,
    }),
  ]);

  // Aggregate team records
  const teamPerformance = rawTeamPerformance
    .map((team) => {
      const played = team.pointsTables.reduce((s, r) => s + r.matchesPlayed, 0);
      const wins = team.pointsTables.reduce((s, r) => s + r.wins, 0);
      const losses = team.pointsTables.reduce((s, r) => s + r.losses, 0);
      const ties = team.pointsTables.reduce((s, r) => s + r.ties, 0);
      const noResults = team.pointsTables.reduce((s, r) => s + r.noResults, 0);
      return { id: team.id, name: team.name, shortName: team.shortName, jerseyColor: team.jerseyColor, played, wins, losses, ties, noResults };
    })
    .sort((a, b) => b.wins - a.wins || b.played - a.played);

  return {
    totals: { leagues: totalLeagues, teams: totalTeams, players: totalPlayers, matches: totalMatches },
    matchStatus: { completed: completedMatches, live: liveMatches, upcoming: upcomingMatches },
    topBatters,
    topBowlers,
    topSixers,
    matchOutcomes,
    leagueActivity,
    teamPerformance,
    recentMatchReports,
  };
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-white/10 bg-[#17364e] p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9a8569]">{label}</p>
      <p className="mt-2 font-[var(--font-display)] text-4xl font-black text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-[#9a8569]">{sub}</p>}
    </div>
  );
}

export default async function AdminReportsPage() {
  const data = await getReportData();
  const completionRate = data.totals.matches > 0
    ? Math.round((data.matchStatus.completed / data.totals.matches) * 100)
    : 0;

  return (
    <div className="space-y-8 text-[#d4e3ff]">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9a8569]">Admin</p>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-black uppercase tracking-tight text-white">Reports</h1>
        <p className="mt-2 text-sm text-[#9a8569]">Tournament-wide KPIs, player performance leaders, and match outcome breakdown.</p>
      </div>

      {/* Platform KPIs */}
      <section>
        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#9a8569]">Platform summary</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Leagues" value={data.totals.leagues} />
          <StatCard label="Teams" value={data.totals.teams} />
          <StatCard label="Players" value={data.totals.players} />
          <StatCard label="Matches" value={data.totals.matches} sub={`${completionRate}% completed`} />
        </div>
      </section>

      {/* Match status */}
      <section>
        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#9a8569]">Match status breakdown</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border border-[#4ae183]/30 bg-[#17364e] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4ae183]">Completed</p>
            <p className="mt-2 font-[var(--font-display)] text-4xl font-black text-white">{data.matchStatus.completed}</p>
          </div>
          <div className="border border-[#93000a]/40 bg-[#17364e] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ffdad6]">Live / Active</p>
            <p className="mt-2 font-[var(--font-display)] text-4xl font-black text-white">{data.matchStatus.live}</p>
          </div>
          <div className="border border-white/10 bg-[#17364e] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9a8569]">Upcoming</p>
            <p className="mt-2 font-[var(--font-display)] text-4xl font-black text-white">{data.matchStatus.upcoming}</p>
          </div>
        </div>
      </section>

      {/* Match outcomes */}
      {data.matchOutcomes.length > 0 && (
        <section>
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#9a8569]">Win type breakdown</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.matchOutcomes.map((outcome) => (
              <div key={outcome.winType ?? "unknown"} className="border border-white/10 bg-[#17364e] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9a8569]">
                  {(outcome.winType ?? "Unknown").replace(/_/g, " ")}
                </p>
                <p className="mt-2 text-2xl font-black text-white">{outcome._count.id}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top performers */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top batters */}
        <section className="border border-white/10 bg-[#102433]">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">Top Batters</p>
            <p className="text-[10px] text-[#9a8569]">Most career runs</p>
          </div>
          <div className="divide-y divide-white/5">
            {data.topBatters.length === 0 && (
              <p className="px-5 py-4 text-sm text-[#9a8569]">No data yet.</p>
            )}
            {data.topBatters.map((stat, i) => (
              <div key={stat.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 shrink-0 text-center text-[10px] font-black text-[#9a8569]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{stat.player.user.name}</p>
                  <p className="text-[10px] text-[#9a8569]">{stat.player.team?.shortName ?? "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#4ae183]">{stat.runs}</p>
                  <p className="text-[10px] text-[#9a8569]">{stat.innings} inn</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top bowlers */}
        <section className="border border-white/10 bg-[#102433]">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">Top Bowlers</p>
            <p className="text-[10px] text-[#9a8569]">Most career wickets</p>
          </div>
          <div className="divide-y divide-white/5">
            {data.topBowlers.length === 0 && (
              <p className="px-5 py-4 text-sm text-[#9a8569]">No data yet.</p>
            )}
            {data.topBowlers.map((stat, i) => (
              <div key={stat.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 shrink-0 text-center text-[10px] font-black text-[#9a8569]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{stat.player.user.name}</p>
                  <p className="text-[10px] text-[#9a8569]">{stat.player.team?.shortName ?? "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#4ae183]">{stat.wickets}w</p>
                  <p className="text-[10px] text-[#9a8569]">{stat.economy != null ? stat.economy.toFixed(2) : "—"} eco</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top six hitters */}
        <section className="border border-white/10 bg-[#102433]">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">Six Hitters</p>
            <p className="text-[10px] text-[#9a8569]">Most career sixes</p>
          </div>
          <div className="divide-y divide-white/5">
            {data.topSixers.length === 0 && (
              <p className="px-5 py-4 text-sm text-[#9a8569]">No data yet.</p>
            )}
            {data.topSixers.map((stat, i) => (
              <div key={stat.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 shrink-0 text-center text-[10px] font-black text-[#9a8569]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{stat.player.user.name}</p>
                  <p className="text-[10px] text-[#9a8569]">{stat.player.team?.shortName ?? "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#4ae183]">{stat.sixes} ×6</p>
                  <p className="text-[10px] text-[#9a8569]">{stat.fours} ×4</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* League activity */}
      {data.leagueActivity.length > 0 && (
        <section>
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#9a8569]">League activity</p>
          <div className="border border-white/10 bg-[#102433] overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/10 bg-[#0d2030] text-[10px] font-black uppercase tracking-[0.18em] text-[#9a8569]">
                <tr>
                  <th className="px-5 py-3 text-left">League</th>
                  <th className="px-4 py-3 text-center">Season</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Teams</th>
                  <th className="px-4 py-3 text-center">Matches</th>
                </tr>
              </thead>
              <tbody>
                {data.leagueActivity.map((league) => (
                  <tr key={league.id} className="border-b border-white/5 last:border-b-0">
                    <td className="px-5 py-3 font-bold text-white">{league.name}</td>
                    <td className="px-4 py-3 text-center text-[#9a8569]">{league.season}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${
                        league.status === "ACTIVE" ? "bg-[#4ae183]/20 text-[#4ae183]" : "bg-[#12324d] text-[#9a8569]"
                      }`}>
                        {league.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-[#d4e3ff]">{league._count.teams}</td>
                    <td className="px-4 py-3 text-center font-bold text-[#4ae183]">{league._count.matches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Team performance */}
      {data.teamPerformance.length > 0 && (
        <section>
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#9a8569]">Team performance</p>
          <div className="border border-white/10 bg-[#102433] overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/10 bg-[#0d2030] text-[10px] font-black uppercase tracking-[0.18em] text-[#9a8569]">
                <tr>
                  <th className="px-5 py-3 text-left">Team</th>
                  <th className="px-4 py-3 text-center">Played</th>
                  <th className="px-4 py-3 text-center">Won</th>
                  <th className="px-4 py-3 text-center">Lost</th>
                  <th className="px-4 py-3 text-center">Tied</th>
                  <th className="px-4 py-3 text-center">NR</th>
                  <th className="px-4 py-3 text-center">Win%</th>
                </tr>
              </thead>
              <tbody>
                {data.teamPerformance.map((team) => {
                  const winPct = team.played > 0 ? Math.round((team.wins / team.played) * 100) : 0;
                  return (
                    <tr key={team.id} className="border-b border-white/5 last:border-b-0">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-7 w-7 items-center justify-center text-[10px] font-black text-white"
                            style={{ backgroundColor: team.jerseyColor || "#1b3656" }}
                          >
                            {team.shortName?.slice(0, 2) || "??"}
                          </div>
                          <span className="font-bold text-white">{team.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-[#9a8569]">{team.played}</td>
                      <td className="px-4 py-3 text-center font-black text-[#4ae183]">{team.wins}</td>
                      <td className="px-4 py-3 text-center text-[#ffb4ab]">{team.losses}</td>
                      <td className="px-4 py-3 text-center text-[#c8c8b0]">{team.ties}</td>
                      <td className="px-4 py-3 text-center text-[#9a8569]">{team.noResults}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-black ${winPct >= 60 ? "text-[#4ae183]" : winPct >= 40 ? "text-[#d4e3ff]" : "text-[#ffb4ab]"}`}>
                          {winPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Recent match reports */}
      {data.recentMatchReports.length > 0 && (
        <section>
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#9a8569]">Recent match reports</p>
          <div className="space-y-3">
            {data.recentMatchReports.map((match) => {
              const homeInn = match.innings.find((i) => i.inningsNumber === 1);
              const awayInn = match.innings.find((i) => i.inningsNumber === 2);
              return (
                <div key={match.id} className="border border-white/10 bg-[#102433] px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3" style={{ backgroundColor: match.homeTeam.jerseyColor || "#1b3656" }} />
                        <span className="text-sm font-black uppercase tracking-[0.06em] text-white">{match.homeTeam.shortName}</span>
                        <span className="text-[#9a8569]">vs</span>
                        <div className="h-3 w-3" style={{ backgroundColor: match.awayTeam.jerseyColor || "#1b3656" }} />
                        <span className="text-sm font-black uppercase tracking-[0.06em] text-white">{match.awayTeam.shortName}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-[#9a8569]">
                        {match.league.name} · {match.league.season}
                        {match.venue ? ` · ${match.venue.name}, ${match.venue.city}` : ""}
                      </p>
                      {match.result && (
                        <p className="mt-1 text-xs font-bold text-[#4ae183]">{match.result}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {homeInn && (
                        <span className="text-xs font-bold text-[#d4e3ff]">
                          {match.homeTeam.shortName}: {homeInn.totalRuns}/{homeInn.totalWickets} ({homeInn.totalOvers} ov)
                        </span>
                      )}
                      {awayInn && (
                        <span className="text-xs font-bold text-[#d4e3ff]">
                          {match.awayTeam.shortName}: {awayInn.totalRuns}/{awayInn.totalWickets} ({awayInn.totalOvers} ov)
                        </span>
                      )}
                      {match.matchDate && (
                        <span className="text-[10px] text-[#9a8569]">
                          {new Date(match.matchDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
