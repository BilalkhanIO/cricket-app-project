import Link from "next/link";
import prisma from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = 'force-dynamic';

async function getHomeData() {
  const [liveMatches, upcomingMatches, activeLeagues, announcements, recentResults, topBatters, topBowlers] =
    await Promise.all([
      prisma.match.findMany({
        where: { status: "LIVE" },
        include: {
          homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          league: { select: { name: true } },
          innings: {
            select: { inningsNumber: true, teamId: true, totalRuns: true, totalWickets: true, totalOvers: true },
          },
        },
        take: 4,
      }),
      prisma.match.findMany({
        where: { status: "UPCOMING" },
        include: {
          homeTeam: { select: { name: true, shortName: true, jerseyColor: true } },
          awayTeam: { select: { name: true, shortName: true, jerseyColor: true } },
          venue: { select: { name: true, city: true } },
          league: { select: { name: true } },
        },
        orderBy: { matchDate: "asc" },
        take: 6,
      }),
      prisma.league.findMany({
        where: { status: "ACTIVE" },
        include: { _count: { select: { teams: true, matches: true } } },
        take: 5,
      }),
      prisma.announcement.findMany({
        where: { isPublic: true },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.match.findMany({
        where: { status: "COMPLETED" },
        include: {
          homeTeam: { select: { name: true, shortName: true, jerseyColor: true } },
          awayTeam: { select: { name: true, shortName: true, jerseyColor: true } },
          league: { select: { name: true } },
          innings: { select: { teamId: true, totalRuns: true, totalWickets: true, totalOvers: true, inningsNumber: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      prisma.playerStats.findMany({
        where: { runs: { gt: 0 } },
        orderBy: { runs: "desc" },
        take: 5,
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
        where: { wickets: { gt: 0 } },
        orderBy: { wickets: "desc" },
        take: 5,
        include: {
          player: {
            include: {
              user: { select: { name: true } },
              team: { select: { shortName: true, jerseyColor: true } },
            },
          },
        },
      }),
    ]);

  return { liveMatches, upcomingMatches, activeLeagues, announcements, recentResults, topBatters, topBowlers };
}

function ScoreRow({ match, teamKey }: { match: any; teamKey: "homeTeam" | "awayTeam" }) {
  const team = match[teamKey];
  const inning = match.innings.find(
    (i: any) => i.teamId === (teamKey === "homeTeam" ? match.homeTeamId : match.awayTeamId)
  );
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ backgroundColor: team.jerseyColor || "#769FCD" }} />
        <span className="text-sm font-semibold text-[#1B3A5C]">{team.shortName}</span>
      </div>
      {inning ? (
        <span className="text-sm font-bold text-[#1B3A5C]">
          {inning.totalRuns}/{inning.totalWickets}
          <span className="text-[#4A7098] font-normal text-xs ml-1">({Number(inning.totalOvers).toFixed(1)})</span>
        </span>
      ) : (
        <span className="text-xs text-[#769FCD]">Yet to bat</span>
      )}
    </div>
  );
}

function getMatchResult(match: any) {
  if (match.result) return match.result;
  return null;
}

export default async function HomePage() {
  const { liveMatches, upcomingMatches, activeLeagues, announcements, recentResults, topBatters, topBowlers } =
    await getHomeData();

  const totalMatches = liveMatches.length + upcomingMatches.length + recentResults.length;

  return (
    <div className="min-h-screen bg-[#F7FBFC]">

      {/* ── Live Ticker ─────────────────────────────────────────────────────── */}
      {liveMatches.length > 0 && (
        <div className="bg-[#1B3A5C] border-b border-[#2D5484] py-2 overflow-hidden">
          <div className="flex items-center gap-4 px-4">
            <span className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-white rounded-full live-dot" />
              Live
            </span>
            <div className="overflow-hidden flex-1">
              <div className="ticker-track gap-12 text-xs text-[#B9D7EA]">
                {[...liveMatches, ...liveMatches].map((m, i) => {
                  const h = m.innings.find((inn: any) => inn.teamId === m.homeTeamId);
                  const a = m.innings.find((inn: any) => inn.teamId === m.awayTeamId);
                  return (
                    <span key={`${m.id}-${i}`} className="flex-shrink-0 mr-12">
                      <span className="text-white font-semibold">{m.homeTeam.shortName}</span>
                      {h ? ` ${h.totalRuns}/${h.totalWickets}` : " —"}
                      <span className="mx-2 text-[#769FCD]">vs</span>
                      <span className="text-white font-semibold">{m.awayTeam.shortName}</span>
                      {a ? ` ${a.totalRuns}/${a.totalWickets}` : " —"}
                      <span className="ml-3 text-[#769FCD]">· {m.league.name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-16 md:py-24"
        style={{ background: "linear-gradient(135deg, #1B3A5C 0%, #2D5484 55%, #769FCD 100%)" }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-8 right-16 text-[180px] leading-none select-none">🏏</div>
          <div className="absolute bottom-4 left-8 text-[100px] leading-none select-none">🏆</div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs text-[#D6E6F2] mb-5 backdrop-blur-sm">
                <span className="w-2 h-2 bg-[#769FCD] rounded-full live-dot" />
                Real-time Scoring Platform
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
                Cricket League<br />
                <span className="text-[#B9D7EA]">Management</span>
              </h1>
              <p className="text-[#D6E6F2] text-lg leading-relaxed mb-8 max-w-lg">
                Manage leagues, track live scores ball-by-ball, view comprehensive statistics, and follow your favorite teams — all in one professional platform.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/leagues" className="inline-flex items-center gap-2 bg-white text-[#1B3A5C] px-6 py-3 rounded-xl font-semibold hover:bg-[#D6E6F2] transition-colors shadow-lg">
                  🏆 Browse Leagues
                </Link>
                <Link href="/matches" className="inline-flex items-center gap-2 bg-[#769FCD] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#5A8BBE] transition-colors border border-white/20">
                  ⚡ Live Scores
                </Link>
                <Link href="/register" className="inline-flex items-center gap-2 bg-transparent text-white border border-white/40 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                  Get Started →
                </Link>
              </div>
            </div>

            {/* Right: stats cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "🏆", label: "Active Leagues",   value: activeLeagues.length, color: "#769FCD" },
                { icon: "⚡", label: "Live Now",          value: liveMatches.length,   color: "#EF4444" },
                { icon: "📅", label: "Upcoming Matches",  value: upcomingMatches.length, color: "#10B981" },
                { icon: "📣", label: "Announcements",     value: announcements.length, color: "#F59E0B" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl p-5 text-center">
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold text-white mb-0.5">{stat.value}</div>
                  <div className="text-[#B9D7EA] text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* ── Live Matches ──────────────────────────────────────────────────── */}
        {liveMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-bold text-[#1B3A5C] flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full live-dot" />
                  Live Matches
                </h2>
                <p className="text-sm text-[#4A7098] mt-0.5">{liveMatches.length} match{liveMatches.length !== 1 ? "es" : ""} in progress</p>
              </div>
              <Link href="/matches?status=LIVE" className="text-sm font-medium text-[#769FCD] hover:text-[#1B3A5C] flex items-center gap-1">
                View all <span>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveMatches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <div className="bg-white rounded-2xl border border-[#B9D7EA] shadow-sm card-lift overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-red-50 border-b border-red-100">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full live-dot" /> LIVE
                      </span>
                      <span className="text-[10px] text-[#4A7098] font-medium truncate max-w-[130px]">{match.league.name}</span>
                    </div>
                    <div className="px-4 py-3">
                      <ScoreRow match={match} teamKey="homeTeam" />
                      <div className="border-t border-[#F7FBFC] my-1" />
                      <ScoreRow match={match} teamKey="awayTeam" />
                    </div>
                    <div className="px-4 py-2 bg-[#F7FBFC] border-t border-[#D6E6F2]">
                      <span className="text-[10px] text-[#769FCD] font-medium">Tap for live updates →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming Matches ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-[#1B3A5C]">Upcoming Matches</h2>
              <p className="text-sm text-[#4A7098] mt-0.5">Scheduled fixtures</p>
            </div>
            <Link href="/matches" className="text-sm font-medium text-[#769FCD] hover:text-[#1B3A5C] flex items-center gap-1">
              View all <span>→</span>
            </Link>
          </div>

          {upcomingMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#B9D7EA] p-12 text-center">
              <div className="text-5xl mb-3">📅</div>
              <p className="text-[#4A7098]">No upcoming matches scheduled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <div className="bg-white rounded-2xl border border-[#B9D7EA] shadow-sm card-lift overflow-hidden h-full">
                    <div className="px-4 py-2.5 bg-[#F7FBFC] border-b border-[#D6E6F2]">
                      <span className="text-[10px] font-semibold text-[#769FCD] uppercase tracking-wider">{match.league.name}</span>
                    </div>
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 text-center">
                          <div className="w-10 h-10 rounded-full border-2 mx-auto mb-1.5 flex items-center justify-center text-lg font-bold text-white"
                            style={{ backgroundColor: match.homeTeam.jerseyColor || "#769FCD", borderColor: match.homeTeam.jerseyColor || "#769FCD" }}>
                            {match.homeTeam.shortName.charAt(0)}
                          </div>
                          <p className="text-sm font-semibold text-[#1B3A5C] line-clamp-1">{match.homeTeam.shortName}</p>
                        </div>
                        <div className="flex-shrink-0 text-center">
                          <span className="block text-xs font-bold text-[#769FCD] bg-[#D6E6F2] rounded-lg px-3 py-1">VS</span>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="w-10 h-10 rounded-full border-2 mx-auto mb-1.5 flex items-center justify-center text-lg font-bold text-white"
                            style={{ backgroundColor: match.awayTeam.jerseyColor || "#1B3A5C", borderColor: match.awayTeam.jerseyColor || "#1B3A5C" }}>
                            {match.awayTeam.shortName.charAt(0)}
                          </div>
                          <p className="text-sm font-semibold text-[#1B3A5C] line-clamp-1">{match.awayTeam.shortName}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#D6E6F2] space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-[#4A7098]">
                          <svg className="w-3.5 h-3.5 text-[#769FCD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {formatDateTime(match.matchDate)}
                        </div>
                        {match.venue && (
                          <div className="flex items-center gap-1.5 text-xs text-[#4A7098]">
                            <svg className="w-3.5 h-3.5 text-[#769FCD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {match.venue.city}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-[#4A7098]">
                          <svg className="w-3.5 h-3.5 text-[#769FCD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                          {match.matchFormat}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Top Performers ────────────────────────────────────────────────── */}
        {(topBatters.length > 0 || topBowlers.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-bold text-[#1B3A5C]">Top Performers</h2>
                <p className="text-sm text-[#4A7098] mt-0.5">Season leaders</p>
              </div>
              <Link href="/stats" className="text-sm font-medium text-[#769FCD] hover:text-[#1B3A5C] flex items-center gap-1">
                Full stats <span>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top Batters */}
              {topBatters.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#B9D7EA] shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#D6E6F2] bg-[#F7FBFC]">
                    <span className="text-xl">🏏</span>
                    <h3 className="font-bold text-[#1B3A5C] text-sm">Top Run Scorers</h3>
                  </div>
                  <div className="divide-y divide-[#F7FBFC]">
                    {topBatters.map((stat, idx) => (
                      <div key={stat.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F7FBFC] transition-colors">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          idx === 0 ? "bg-yellow-400 text-yellow-900" :
                          idx === 1 ? "bg-gray-300 text-gray-700" :
                          idx === 2 ? "bg-orange-300 text-orange-800" :
                          "bg-[#D6E6F2] text-[#4A7098]"
                        }`}>{idx + 1}</span>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: stat.player.team?.jerseyColor || "#769FCD" }}>
                          {stat.player.user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1B3A5C] truncate">{stat.player.user.name}</p>
                          <p className="text-xs text-[#4A7098]">{stat.player.team?.shortName || "—"}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold text-[#769FCD]">{stat.runs}</p>
                          <p className="text-[10px] text-[#4A7098]">runs</p>
                        </div>
                        <div className="text-right flex-shrink-0 hidden sm:block">
                          <p className="text-sm font-semibold text-[#1B3A5C]">{stat.average.toFixed(1)}</p>
                          <p className="text-[10px] text-[#4A7098]">avg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Bowlers */}
              {topBowlers.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#B9D7EA] shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#D6E6F2] bg-[#F7FBFC]">
                    <span className="text-xl">🎳</span>
                    <h3 className="font-bold text-[#1B3A5C] text-sm">Top Wicket Takers</h3>
                  </div>
                  <div className="divide-y divide-[#F7FBFC]">
                    {topBowlers.map((stat, idx) => (
                      <div key={stat.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F7FBFC] transition-colors">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          idx === 0 ? "bg-yellow-400 text-yellow-900" :
                          idx === 1 ? "bg-gray-300 text-gray-700" :
                          idx === 2 ? "bg-orange-300 text-orange-800" :
                          "bg-[#D6E6F2] text-[#4A7098]"
                        }`}>{idx + 1}</span>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: stat.player.team?.jerseyColor || "#1B3A5C" }}>
                          {stat.player.user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1B3A5C] truncate">{stat.player.user.name}</p>
                          <p className="text-xs text-[#4A7098]">{stat.player.team?.shortName || "—"}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold text-[#769FCD]">{stat.wickets}</p>
                          <p className="text-[10px] text-[#4A7098]">wkts</p>
                        </div>
                        <div className="text-right flex-shrink-0 hidden sm:block">
                          <p className="text-sm font-semibold text-[#1B3A5C]">{stat.economy.toFixed(1)}</p>
                          <p className="text-[10px] text-[#4A7098]">econ</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Recent Results + Active Leagues ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Results */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#1B3A5C]">Recent Results</h2>
                <p className="text-sm text-[#4A7098] mt-0.5">Latest completed matches</p>
              </div>
              <Link href="/matches?status=COMPLETED" className="text-sm font-medium text-[#769FCD] hover:text-[#1B3A5C] flex items-center gap-1">
                All results <span>→</span>
              </Link>
            </div>

            {recentResults.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#B9D7EA] p-10 text-center">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-[#4A7098] text-sm">No completed matches yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentResults.map((match) => {
                  const h = match.innings.find((i: any) => i.teamId === match.homeTeamId);
                  const a = match.innings.find((i: any) => i.teamId === match.awayTeamId);
                  return (
                    <Link key={match.id} href={`/matches/${match.id}`}>
                      <div className="bg-white rounded-2xl border border-[#B9D7EA] card-lift overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-[#F7FBFC] border-b border-[#D6E6F2]">
                          <span className="text-[10px] font-semibold text-[#769FCD] uppercase tracking-wider">{match.league.name}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">COMPLETED</span>
                        </div>
                        <div className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: match.homeTeam.jerseyColor || "#769FCD" }} />
                                  <span className="text-sm font-semibold text-[#1B3A5C]">{match.homeTeam.shortName}</span>
                                </div>
                                <span className="text-sm font-bold text-[#1B3A5C]">
                                  {h ? `${h.totalRuns}/${h.totalWickets}` : "—"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: match.awayTeam.jerseyColor || "#1B3A5C" }} />
                                  <span className="text-sm font-semibold text-[#1B3A5C]">{match.awayTeam.shortName}</span>
                                </div>
                                <span className="text-sm font-bold text-[#1B3A5C]">
                                  {a ? `${a.totalRuns}/${a.totalWickets}` : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                          {match.result && (
                            <p className="text-xs text-[#4A7098] mt-2 pt-2 border-t border-[#F7FBFC] line-clamp-1">{match.result}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Leagues */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#1B3A5C]">Active Leagues</h2>
                <p className="text-sm text-[#4A7098] mt-0.5">Ongoing tournaments</p>
              </div>
              <Link href="/leagues" className="text-sm font-medium text-[#769FCD] hover:text-[#1B3A5C] flex items-center gap-1">
                All <span>→</span>
              </Link>
            </div>

            {activeLeagues.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#B9D7EA] p-8 text-center">
                <p className="text-[#4A7098] text-sm">No active leagues.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeLeagues.map((league) => (
                  <Link key={league.id} href={`/leagues/${league.id}`}>
                    <div className="bg-white rounded-2xl border border-[#B9D7EA] card-lift p-4 flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#769FCD] rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {league.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1B3A5C] text-sm leading-tight line-clamp-1">{league.name}</p>
                        <p className="text-xs text-[#4A7098] mt-0.5">{league.season}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-[#769FCD] font-medium">
                          <span>👥 {league._count.teams} teams</span>
                          <span>🏏 {league._count.matches} matches</span>
                        </div>
                      </div>
                      <StatusBadge status={league.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Announcements ─────────────────────────────────────────────────── */}
        {announcements.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#1B3A5C]">Announcements</h2>
                <p className="text-sm text-[#4A7098] mt-0.5">Latest news &amp; updates</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {announcements.map((ann, i) => (
                <div key={ann.id} className="bg-white rounded-2xl border border-[#B9D7EA] shadow-sm p-5 flex flex-col">
                  <div className="w-10 h-10 bg-[#D6E6F2] rounded-xl flex items-center justify-center text-xl mb-3">
                    {i === 0 ? "📢" : i === 1 ? "🏆" : i === 2 ? "📅" : "🔔"}
                  </div>
                  <h3 className="font-semibold text-[#1B3A5C] text-sm mb-1.5 line-clamp-2">{ann.title}</h3>
                  <p className="text-xs text-[#4A7098] line-clamp-3 flex-1">{ann.content}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F7FBFC]">
                    <span className="text-[10px] text-[#769FCD] font-medium">{ann.author.name}</span>
                    <span className="text-[10px] text-[#B9D7EA]">{formatDate(ann.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── How It Works ──────────────────────────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-[#B9D7EA] shadow-sm p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#1B3A5C]">How It Works</h2>
            <p className="text-[#4A7098] mt-2">Get your cricket league up and running in minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { step: "01", icon: "📝", title: "Create Account",   desc: "Register as a league admin, team manager, or scorer." },
              { step: "02", icon: "🏆", title: "Setup League",     desc: "Configure your tournament format, rules, and schedule." },
              { step: "03", icon: "👥", title: "Add Teams",        desc: "Register teams, players, and assign roles." },
              { step: "04", icon: "⚡", title: "Go Live",          desc: "Start scoring matches and track live statistics." },
            ].map((item, idx) => (
              <div key={item.step} className="relative text-center">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#B9D7EA] to-transparent" />
                )}
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-[#D6E6F2] rounded-2xl text-3xl mb-4 mx-auto">
                  {item.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#769FCD] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-[#1B3A5C] mb-1.5">{item.title}</h3>
                <p className="text-sm text-[#4A7098] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────────────────────── */}
        <section
          className="rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1B3A5C 0%, #2D5484 60%, #769FCD 100%)" }}
        >
          <div className="absolute top-0 right-0 text-[120px] opacity-5 leading-none select-none pointer-events-none">🏏</div>
          <div className="relative">
            <h2 className="text-3xl font-bold mb-3">Ready to Get Started?</h2>
            <p className="text-[#B9D7EA] mb-7 max-w-lg mx-auto text-lg">
              Join thousands of cricket enthusiasts managing leagues on our platform.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 bg-white text-[#1B3A5C] px-7 py-3.5 rounded-xl font-bold hover:bg-[#D6E6F2] transition-colors shadow-lg">
                📝 Create Free Account
              </Link>
              <Link href="/leagues" className="inline-flex items-center gap-2 bg-[#769FCD] text-white px-7 py-3.5 rounded-xl font-bold hover:bg-[#5A8BBE] transition-colors border border-white/20">
                🏆 Browse Leagues
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
