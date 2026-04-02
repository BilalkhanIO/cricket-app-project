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
                  League Ops
                  <span className="block text-[#4ae183]">Dashboard</span>
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1] sm:text-base">
                  League coordination, scheduling readiness, venue coverage, and public communications.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: overview.leagues, label: "Leagues" },
                  { value: overview.matches, label: "Active Ops" },
                  { value: overview.venues, label: "Venues" },
                  { value: overview.announcements, label: "Announcements" },
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
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-white/10 bg-[#001c3a]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">Operational Access</h2>
              </div>
              <div className="px-5 py-5">
                <p className="text-sm leading-7 text-[#9bb2d1]">
                  This role can access the admin workspace, create leagues, manage fixtures, support match officials, and operate season workflows.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/admin/leagues"
                    className="bg-[#4ae183] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#00142b] transition hover:bg-white"
                  >
                    Manage Leagues
                  </Link>
                  <Link
                    href="/admin/matches"
                    className="border border-white/10 bg-[#1b3656] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#d4e3ff] transition hover:bg-[#0b2747]"
                  >
                    Match Operations
                  </Link>
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-[#001c3a]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">Current Limitation</h2>
              </div>
              <div className="px-5 py-5">
                <p className="text-sm leading-7 text-[#9bb2d1]">
                  League staff is now permissioned for core operations, but fine-grained assignment to specific leagues is still not modeled in the database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
