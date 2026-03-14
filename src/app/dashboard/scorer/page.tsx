import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = 'force-dynamic';

async function getScorerData(userId: string) {
  const matches = await prisma.match.findMany({
    where: { scorerId: userId },
    include: {
      homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      league: { select: { id: true, name: true } },
      venue: { select: { name: true, city: true } },
      innings: {
        include: { team: { select: { shortName: true } } },
        orderBy: { inningsNumber: "asc" },
      },
    },
    orderBy: { matchDate: "desc" },
    take: 50,
  });
  return matches;
}

export default async function ScorerDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "LEAGUE_ADMIN", "SCORER"].includes(session.user.role)) {
    redirect("/login");
  }

  const matches = await getScorerData(session.user.id);

  const live = matches.filter((m) => m.status === "LIVE" || m.status === "INNINGS_BREAK");
  const upcoming = matches.filter((m) => m.status === "UPCOMING" || m.status === "TOSS");
  const completed = matches.filter((m) => m.status === "COMPLETED");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Scorer Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {session.user.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Live Now", value: live.length, color: "bg-red-50 border-red-200 text-red-700", dot: true },
            { label: "Upcoming", value: upcoming.length, color: "bg-blue-50 border-blue-200 text-blue-700", dot: false },
            { label: "Completed", value: completed.length, color: "bg-[#F7FBFC] border-[#B9D7EA] text-[#769FCD]", dot: false },
          ].map((s) => (
            <div key={s.label} className={`border rounded-xl p-4 text-center ${s.color}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                {s.dot && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                <div className="text-3xl font-bold">{s.value}</div>
              </div>
              <div className="text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Live / Active Matches */}
        {live.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              Active Matches
            </h2>
            <div className="space-y-3">
              {live.map((m) => (
                <MatchCard key={m.id} match={m} highlight />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Upcoming Matches</h2>
            <div className="space-y-3">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Completed</h2>
            <div className="space-y-3">
              {completed.slice(0, 10).map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}

        {matches.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🏏</div>
            <p className="text-lg font-medium">No matches assigned yet</p>
            <p className="text-sm mt-1">Contact your league admin to get assigned to a match</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function MatchCard({ match, highlight = false }: { match: any; highlight?: boolean }) {
  const inn1 = match.innings.find((i: any) => i.inningsNumber === 1);
  const inn2 = match.innings.find((i: any) => i.inningsNumber === 2);
  const canScore = ["LIVE", "INNINGS_BREAK", "UPCOMING", "TOSS"].includes(match.status);

  return (
    <div className={`bg-white rounded-xl border ${highlight ? "border-red-200 shadow-md" : "border-gray-200"} p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">
              {match.homeTeam.shortName} vs {match.awayTeam.shortName}
            </span>
            <StatusBadge status={match.status} />
          </div>
          <p className="text-xs text-gray-500">
            {match.league.name} · {formatDateTime(match.matchDate)}
            {match.venue && ` · ${match.venue.city}`}
          </p>
          {/* Live score */}
          {(inn1 || inn2) && (
            <div className="flex gap-4 mt-2 text-sm">
              {inn1 && (
                <span>
                  <span className="font-medium" style={{ color: match.homeTeam.jerseyColor || undefined }}>
                    {inn1.team.shortName}:
                  </span>
                  <span className="font-bold ml-1">{inn1.totalRuns}/{inn1.totalWickets}</span>
                  <span className="text-gray-400 ml-1">({inn1.totalOvers.toFixed(1)})</span>
                </span>
              )}
              {inn2 && (
                <span>
                  <span className="font-medium" style={{ color: match.awayTeam.jerseyColor || undefined }}>
                    {inn2.team.shortName}:
                  </span>
                  <span className="font-bold ml-1">{inn2.totalRuns}/{inn2.totalWickets}</span>
                  <span className="text-gray-400 ml-1">({inn2.totalOvers.toFixed(1)})</span>
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 ml-4">
          {canScore && (
            <Link
              href={`/scorer/${match.id}`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors text-center ${
                highlight
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {match.status === "UPCOMING" || match.status === "TOSS" ? "Start Scoring" : "Continue Scoring"}
            </Link>
          )}
          {match.status === "UPCOMING" && (
            <Link
              href={`/admin/matches/${match.id}/playing-xi`}
              className="px-4 py-2 bg-[#F7FBFC] border border-[#B9D7EA] text-[#769FCD] rounded-lg text-sm font-medium hover:bg-[#D6E6F2] text-center transition-colors"
            >
              Set Playing XI
            </Link>
          )}
          <Link
            href={`/matches/${match.id}`}
            className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-100 text-center transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
