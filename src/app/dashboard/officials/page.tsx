import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import PublicShell from "@/components/layout/PublicShell";
import { canAccessOfficialDashboard } from "@/lib/permissions";
import { getRoleLabel } from "@/lib/roles";

export const dynamic = "force-dynamic";

async function getOverview() {
  const [upcomingMatches, liveMatches, recordedOfficials] = await Promise.all([
    prisma.match.count({ where: { status: { in: ["UPCOMING", "TOSS"] } } }),
    prisma.match.count({ where: { status: { in: ["LIVE", "INNINGS_BREAK"] } } }),
    prisma.matchOfficial.count(),
  ]);

  const recentMatches = await prisma.match.findMany({
    where: { status: { in: ["UPCOMING", "LIVE", "TOSS"] } },
    include: {
      homeTeam: { select: { shortName: true } },
      awayTeam: { select: { shortName: true } },
      venue: { select: { city: true, name: true } },
      officials: true,
    },
    orderBy: { matchDate: "asc" },
    take: 8,
  });

  return { upcomingMatches, liveMatches, recordedOfficials, recentMatches };
}

export default async function OfficialsDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || !canAccessOfficialDashboard(session.user.role)) {
    redirect("/login");
  }

  const overview = await getOverview();

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
              {getRoleLabel(session.user.role)}
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div className="space-y-5">
                <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                  Officials
                  <span className="block text-[#4ae183]">Dashboard</span>
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1] sm:text-base">
                  Match awareness, official coverage, and competition readiness for umpires and referees.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: overview.upcomingMatches, label: "Upcoming" },
                  { value: overview.liveMatches, label: "Live Now" },
                  { value: overview.recordedOfficials, label: "Officials" },
                ].map((stat) => (
                  <div key={stat.label} className="border border-white/10 bg-[#001c3a] px-4 py-4 text-center">
                    <p className="font-[var(--font-display)] text-3xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:py-12">
          <div className="border border-white/10 bg-[#001c3a]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">
                  Upcoming Match Window
                </h2>
                <p className="mt-1 text-sm text-[#9bb2d1]">
                  Official assignments are still stored as free-text match records — this dashboard provides visibility rather than user-linked assignments.
                </p>
              </div>
              <Link
                href="/matches"
                className="shrink-0 border border-white/10 bg-[#1b3656] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#d4e3ff] transition hover:bg-[#0b2747]"
              >
                Public Matches
              </Link>
            </div>

            {overview.recentMatches.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[#9bb2d1]">No upcoming matches at the moment.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {overview.recentMatches.map((match) => (
                  <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-[#0b2747]">
                    <div>
                      <p className="font-bold text-white">
                        {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                      </p>
                      <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#9bb2d1]">
                        {new Date(match.matchDate).toLocaleString()} · {match.venue?.name || "Venue TBD"} · {match.venue?.city || "City TBD"}
                      </p>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.14em] ${match.officials.length > 0 ? "text-[#4ae183]" : "text-[#9bb2d1]"}`}>
                      {match.officials.length > 0 ? `${match.officials.length} officials recorded` : "No officials recorded"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
