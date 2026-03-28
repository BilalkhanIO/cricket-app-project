import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import PublicShell from "@/components/layout/PublicShell";
import { canAccessTeamStaffDashboard } from "@/lib/permissions";
import { getRoleLabel } from "@/lib/roles";

export const dynamic = "force-dynamic";

async function getOverview() {
  const [teams, liveMatches, activeLeagues] = await Promise.all([
    prisma.team.count(),
    prisma.match.count({ where: { status: { in: ["LIVE", "INNINGS_BREAK", "TOSS"] } } }),
    prisma.league.count({ where: { status: { in: ["REGISTRATION", "ACTIVE"] } } }),
  ]);

  return { teams, liveMatches, activeLeagues };
}

export default async function TeamStaffDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || !canAccessTeamStaffDashboard(session.user.role)) {
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
            <h1 className="mt-3 text-4xl font-bold">Team Staff Dashboard</h1>
            <p className="mt-4 max-w-2xl text-sm text-[#d6d9df]">
              Planning, scouting, squad support, and competition awareness for non-manager team roles.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[
              { label: "Teams in System", value: overview.teams },
              { label: "Live Matches", value: overview.liveMatches },
              { label: "Active Leagues", value: overview.activeLeagues },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border bg-white p-5">
                <div className="text-3xl font-bold text-gray-900">{item.value}</div>
                <div className="mt-1 text-sm text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6">
              <h2 className="text-lg font-bold text-gray-900">Role Scope</h2>
              <p className="mt-2 text-sm text-gray-600">
                This dashboard is intended for coaches, analysts, selectors, and owners. It gives them a stable landing page instead of routing them into manager-only flows.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/teams" className="rounded-xl bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white">
                  Browse Teams
                </Link>
                <Link href="/matches" className="rounded-xl bg-[color:var(--primary-dark)] px-4 py-2 text-sm font-semibold text-white">
                  Browse Matches
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <h2 className="text-lg font-bold text-gray-900">Current Limitation</h2>
              <p className="mt-2 text-sm text-gray-600">
                The data model still lacks direct coach, analyst, selector, and owner assignment to a specific team. This page is now role-safe, but deeper team-staff workflows still need schema support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
