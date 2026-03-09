"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/leagues", label: "Leagues", icon: "🏆" },
  { href: "/admin/teams", label: "Teams", icon: "👕" },
  { href: "/admin/players", label: "Players", icon: "🏏" },
  { href: "/admin/matches", label: "Matches", icon: "📅" },
  { href: "/admin/venues", label: "Venues", icon: "🏟️" },
  { href: "/admin/announcements", label: "Announcements", icon: "📢" },
  { href: "/admin/users", label: "Users", icon: "👥" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!session || !["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow p-10">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">You need admin privileges to access this page.</p>
          <Link href="/login" className="text-green-600 hover:underline font-medium">Login as Admin →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:relative z-40 w-64 h-full bg-green-900 text-white transition-transform duration-300`}>
        <div className="p-4 border-b border-green-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏏</span>
            <div>
              <p className="font-bold text-sm">CricketLeague</p>
              <p className="text-xs text-green-300">Admin Panel</p>
            </div>
          </div>
        </div>

        <div className="p-3">
          <div className="bg-green-800 rounded-xl p-3 mb-4">
            <p className="text-sm font-semibold truncate">{session.user.name}</p>
            <p className="text-xs text-green-300">{session.user.role}</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    isActive ? "bg-white/20 text-white font-medium" : "text-green-200 hover:bg-green-800 hover:text-white"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-4 left-0 right-0 px-3">
          <Link href="/home" className="flex items-center gap-2 px-3 py-2 text-green-300 hover:text-white text-sm rounded-xl hover:bg-green-800">
            ← Back to Site
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600">
              {navItems.find((i) => pathname === i.href || (i.href !== "/admin" && pathname.startsWith(i.href)))?.label || "Admin"}
            </span>
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
