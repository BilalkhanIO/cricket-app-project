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
    <PublicShell>
      <div className="space-y-8 bg-gray-50 py-8">
        <section className="section-banner text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
            <p className="text-xs uppercase tracking-[0.28em] text-[#c8c8b0]">
              {getRoleLabel(session.user.role)}
            </p>
            <h1 className="mt-3 text-4xl font-bold">Officials Dashboard</h1>
            <p className="mt-4 max-w-2xl text-sm text-[#d6d9df]">
              Match awareness, official coverage, and competition readiness for umpires and referees.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[
              { label: "Upcoming Matches", value: overview.upcomingMatches },
              { label: "Live Matches", value: overview.liveMatches },
              { label: "Recorded Officials", value: overview.recordedOfficials },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border bg-white p-5">
                <div className="text-3xl font-bold text-gray-900">{item.value}</div>
                <div className="mt-1 text-sm text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Upcoming Match Window</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Official assignments are still stored as free-text match records, so this dashboard currently provides visibility rather than user-linked assignments.
                </p>
              </div>
              <Link href="/matches" className="rounded-xl bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white">
                Public Matches
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              {overview.recentMatches.map((match) => (
                <div key={match.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(match.matchDate).toLocaleString()} · {match.venue?.name || "Venue TBD"} · {match.venue?.city || "City TBD"}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {match.officials.length > 0 ? `${match.officials.length} officials recorded` : "No officials recorded"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
