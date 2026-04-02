"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import { getDashboardLinkForRole, getRoleLabel } from "@/lib/roles";

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <PublicShell mainClassName="overflow-hidden">
        <div className="flex min-h-[60vh] items-center justify-center bg-[#00142b] text-[#d4e3ff]">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9bb2d1]">Access required</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              Sign in to view profile
            </h2>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-block bg-[#4ae183] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#00142b] transition hover:bg-white"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </PublicShell>
    );
  }

  const workspaceLink = getDashboardLinkForRole(session.user.role);
  const workspaceLabel = session.user.role === "FAN" ? "My Profile" : `${getRoleLabel(session.user.role)} Workspace`;
  const roleActions: { href: string; label: string; accent?: boolean }[] = (() => {
    switch (session.user.role) {
      case "SUPER_ADMIN":
      case "LEAGUE_ADMIN":
        return [
          { href: workspaceLink, label: "Open Admin Workspace", accent: true },
          { href: "/admin/leagues/new", label: "Create League" },
        ];
      case "LEAGUE_STAFF":
        return [
          { href: workspaceLink, label: "Open Operations Workspace", accent: true },
          { href: "/admin/matches", label: "Match Operations" },
        ];
      case "SCORER":
        return [
          { href: workspaceLink, label: "Assigned Matches", accent: true },
          { href: "/matches", label: "Public Match Center" },
        ];
      case "TEAM_MANAGER":
        return [
          { href: workspaceLink, label: "Team Workspace", accent: true },
          { href: "/teams", label: "Browse Teams" },
        ];
      case "PLAYER":
        return [
          { href: workspaceLink, label: "Player Dashboard", accent: true },
          { href: "/stats", label: "Statistics" },
        ];
      case "TEAM_OWNER":
      case "COACH":
      case "SELECTOR":
      case "ANALYST":
      case "UMPIRE":
      case "MATCH_REFEREE":
        return [
          { href: workspaceLink, label: workspaceLabel, accent: true },
          { href: "/matches", label: "View Matches" },
        ];
      default:
        return [
          { href: "/matches", label: "View Matches", accent: true },
          { href: "/stats", label: "Statistics" },
        ];
    }
  })();

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
              My account
            </div>
            <div className="mt-6">
              <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                My<span className="block text-[#4ae183]">Profile</span>
              </h1>
            </div>
          </div>
        </section>

        {/* Profile Content */}
        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Identity card */}
            <div className="border border-white/10 bg-[#001c3a]">
              <div className="border-b border-white/10 px-5 py-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center bg-[#1b3656] text-3xl font-black text-white">
                  {session.user.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="mt-4 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                  {session.user.name}
                </h2>
                <p className="mt-1 text-sm text-[#9bb2d1]">{session.user.email}</p>
                <div className="mt-3">
                  <span className="inline-block bg-[#1b3656] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#4ae183]">
                    {session.user.role.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Role</p>
                <p className="mt-1 text-sm font-bold text-white">{getRoleLabel(session.user.role)}</p>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Account info */}
              <div className="border border-white/10 bg-[#001c3a]">
                <div className="border-b border-white/10 px-5 py-4">
                  <h3 className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">
                    Account Information
                  </h3>
                </div>
                <div className="divide-y divide-white/10">
                  {[
                    { label: "Full Name", value: session.user.name },
                    { label: "Email", value: session.user.email },
                    { label: "Role", value: session.user.role.replace(/_/g, " ") },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-5 py-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                        {item.label}
                      </span>
                      <span className="text-sm font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="border border-white/10 bg-[#001c3a]">
                <div className="border-b border-white/10 px-5 py-4">
                  <h3 className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">
                    Quick Links
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 p-5">
                  {roleActions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={`px-4 py-3 text-center text-sm font-black uppercase tracking-[0.12em] transition ${
                        action.accent
                          ? "bg-[#4ae183] text-[#00142b] hover:bg-white"
                          : "border border-white/10 bg-[#1b3656] text-[#d4e3ff] hover:bg-[#0b2747]"
                      }`}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
