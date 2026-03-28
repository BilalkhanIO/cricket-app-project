import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import PublicShell from "@/components/layout/PublicShell";
import { canAccessLeagueStaffDashboard } from "@/lib/permissions";
import { getRoleLabel } from "@/lib/roles";

export const dynamic = "force-dynamic";

async function getOverview() {
  const [leagues, matches, venues, announcements] = await Promise.all([
    prisma.league.count(),
    prisma.match.count({ where: { status: { in: ["UPCOMING", "LIVE", "TOSS", "INNINGS_BREAK"] } } }),
    prisma.venue.count(),
    prisma.announcement.count(),
  ]);

  return { leagues, matches, venues, announcements };
}

export default async function LeagueStaffDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || !canAccessLeagueStaffDashboard(session.user.role)) {
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
            <h1 className="mt-3 text-4xl font-bold">League Operations Dashboard</h1>
            <p className="mt-4 max-w-2xl text-sm text-[#d6d9df]">
              League coordination, scheduling readiness, venue coverage, and public communications.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Leagues", value: overview.leagues },
              { label: "Active Match Ops", value: overview.matches },
              { label: "Venues", value: overview.venues },
              { label: "Announcements", value: overview.announcements },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border bg-white p-5">
                <div className="text-3xl font-bold text-gray-900">{item.value}</div>
                <div className="mt-1 text-sm text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6">
              <h2 className="text-lg font-bold text-gray-900">Operational Access</h2>
              <p className="mt-2 text-sm text-gray-600">
                This role can access the admin workspace, create leagues, manage fixtures, support match officials, and operate season workflows.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/admin/leagues" className="rounded-xl bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white">
                  Manage Leagues
                </Link>
                <Link href="/admin/matches" className="rounded-xl bg-[color:var(--primary-dark)] px-4 py-2 text-sm font-semibold text-white">
                  Match Operations
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <h2 className="text-lg font-bold text-gray-900">Current Limitation</h2>
              <p className="mt-2 text-sm text-gray-600">
                League staff is now permissioned for core operations, but fine-grained assignment to specific leagues is still not modeled in the database.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
