"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/admin",               label: "Dashboard",     icon: "📊" },
  { href: "/admin/leagues",       label: "Leagues",       icon: "🏆" },
  { href: "/admin/teams",         label: "Teams",         icon: "👕" },
  { href: "/admin/players",       label: "Players",       icon: "🏏" },
  { href: "/admin/matches",       label: "Matches",       icon: "📅" },
  { href: "/admin/venues",        label: "Venues",        icon: "🏟️" },
  { href: "/admin/announcements", label: "Announcements", icon: "📢" },
  { href: "/admin/users",         label: "Users",         icon: "👥" },
];

const roleLabel = (role: string) => {
  const map: Record<string, string> = {
    SUPER_ADMIN: "Super Admin", LEAGUE_ADMIN: "League Admin",
  };
  return map[role] || role;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!session || !["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role)) {
    return (
      <div className="min-h-screen bg-[#F7FBFC] flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl border border-[#B9D7EA] shadow-lg p-10 max-w-sm w-full">
          <div className="w-16 h-16 bg-[#D6E6F2] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-[#1B3A5C] mb-2">Access Denied</h2>
          <p className="text-[#4A7098] mb-5 text-sm">You need admin privileges to access this area.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-[#769FCD] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#5A8BBE] transition-colors">
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
    <div className="flex h-screen bg-[#F7FBFC]">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:relative z-40 w-64 h-full flex flex-col transition-transform duration-300`}
        style={{ background: "#1B3A5C" }}
      >
        {/* Top accent */}
        <div className="h-0.5 bg-gradient-to-r from-[#769FCD] via-[#B9D7EA] to-[#769FCD]" />

        {/* Logo */}
        <div className="px-4 py-4 border-b border-[#2D5484]">
          <Link href="/home" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-[#769FCD] rounded-lg flex items-center justify-center text-xl">🏏</div>
            <div>
              <p className="font-bold text-sm text-white">CricketLeague</p>
              <p className="text-[10px] text-[#769FCD] tracking-widest uppercase">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* User card */}
        <div className="px-3 pt-4 pb-2">
          <div className="bg-[#2D5484] rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#769FCD] rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{session.user.name}</p>
              <p className="text-xs text-[#B9D7EA]">{roleLabel(session.user.role)}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] text-[#4A7098] font-semibold uppercase tracking-widest px-3 py-2">Navigation</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[#769FCD] text-white shadow-sm"
                    : "text-[#B9D7EA] hover:bg-[#2D5484] hover:text-white"
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="px-3 pb-4 border-t border-[#2D5484] pt-3 space-y-1">
          <Link
            href="/home"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[#B9D7EA] hover:bg-[#2D5484] hover:text-white transition-colors"
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
        <header className="bg-white border-b border-[#D6E6F2] px-4 sm:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-[#F7FBFC] text-[#1B3A5C] transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="text-[#769FCD] hover:text-[#1B3A5C] font-medium transition-colors">
              Admin
            </Link>
            {currentPage && currentPage.href !== "/admin" && (
              <>
                <svg className="w-3.5 h-3.5 text-[#B9D7EA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-[#1B3A5C] font-semibold">{currentPage.label}</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/admin/matches/new"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#769FCD] hover:bg-[#5A8BBE] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
            >
              + New Match
            </Link>
            <div className="w-8 h-8 bg-[#769FCD] rounded-full flex items-center justify-center text-xs font-bold text-white">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
