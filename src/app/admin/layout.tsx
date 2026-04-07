"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart2, Building2, CalendarDays, LayoutDashboard, MapPinned, Megaphone, Menu, Shield, Trophy, UserCheck, Users } from "lucide-react";
import { getRoleLabel } from "@/lib/roles";
import { canAccessAdminArea } from "@/lib/permissions";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leagues", label: "Leagues", icon: Trophy },
  { href: "/admin/teams", label: "Teams", icon: Shield },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/matches", label: "Matches", icon: CalendarDays },
  { href: "/admin/venues", label: "Venues", icon: MapPinned },
  { href: "/admin/officials", label: "Officials", icon: UserCheck },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/users", label: "Users", icon: Building2 },
  { href: "/admin/reports", label: "Reports", icon: BarChart2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!session || !canAccessAdminArea(session.user.role)) {
    return (
      <div className="min-h-screen bg-[color:var(--card-muted)] flex items-center justify-center p-4">
        <div className="page-shell text-center rounded-[2rem] p-10 max-w-sm w-full">
          <div className="w-16 h-16 bg-[color:var(--card-muted)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-7 w-7 text-[color:var(--secondary)]" />
          </div>
          <h2 className="text-2xl font-bold text-[color:var(--color-ink)] mb-2">Access Denied</h2>
          <p className="text-[color:var(--color-ink-soft)] mb-5 text-sm">You need admin privileges to access this area.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-[color:var(--primary)] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#185a41] transition-colors">
            Login as Admin →
          </Link>
        </div>
      </div>
    );
  }

  const currentPage = navItems.find(
    (i) => pathname === i.href || (i.href !== "/admin" && pathname.startsWith(i.href))
  );

  return (
    <div className="flex h-screen bg-[#06131f]">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:relative z-40 w-64 h-full flex flex-col transition-transform duration-300`}
        style={{ background: "#102433" }}
      >
        {/* Top accent */}
        <div className="h-0.5 bg-gradient-to-r from-[color:var(--primary)] via-[#c79a3b] to-[color:var(--primary)]" />

        {/* Logo */}
        <div className="px-4 py-4 border-b border-[#17364e]">
          <Link href="/home" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-[color:var(--primary)] rounded-lg flex items-center justify-center text-xl">
              <Trophy className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">CricketLeague</p>
              <p className="text-[10px] text-[#c79a3b] tracking-widest uppercase">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* User card */}
        <div className="px-3 pt-4 pb-2">
          <div className="bg-[#17364e] rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-[color:var(--primary)] rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{session.user.name}</p>
              <p className="text-xs text-[#9a8569]">{getRoleLabel(session.user.role)}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] text-[#9a8569] font-semibold uppercase tracking-widest px-3 py-2">Navigation</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[color:var(--primary)] text-white shadow-sm"
                    : "text-[#d6cab7] hover:bg-[#17364e] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="px-3 pb-4 border-t border-[#17364e] pt-3 space-y-1">
          <Link
            href="/home"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[#d6cab7] hover:bg-[#17364e] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="border-b border-white/10 bg-[#0d2030] px-4 sm:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            className="lg:hidden p-2 hover:bg-[#17364e] text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="text-[#4ae183] hover:text-white font-medium transition-colors">
              Admin
            </Link>
            {currentPage && currentPage.href !== "/admin" && (
              <>
                <svg className="w-3.5 h-3.5 text-[#9a8569]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-white font-semibold">{currentPage.label}</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/admin/matches/new"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#4ae183] hover:bg-[#6bfe9c] text-[#003919] text-xs font-semibold px-3.5 py-2 transition-colors uppercase tracking-[0.14em]"
            >
              + New Match
            </Link>
            <div className="w-8 h-8 bg-[#4ae183] flex items-center justify-center text-xs font-bold text-[#003919]">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#0a1724] p-4 md:p-6">
          {children}
        </main>

        <div className="border-t border-white/10 bg-[#0d2030] px-4 sm:px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
          Management console
        </div>
      </div>
    </div>
  );
}
