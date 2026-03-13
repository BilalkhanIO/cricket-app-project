"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  matchId?: string;
}

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: "/home",    label: "Home",       icon: "⚡" },
    { href: "/leagues", label: "Leagues",    icon: "🏆" },
    { href: "/matches", label: "Matches",    icon: "🏏" },
    { href: "/teams",   label: "Teams",      icon: "👥" },
    { href: "/players", label: "Players",    icon: "🌟" },
    { href: "/stats",   label: "Statistics", icon: "📊" },
  ];

  const getDashboardLink = () => {
    if (!session) return null;
    switch (session.user.role) {
      case "SUPER_ADMIN":
      case "LEAGUE_ADMIN": return "/admin";
      case "TEAM_MANAGER": return "/dashboard/team";
      case "SCORER":       return "/dashboard/scorer";
      case "PLAYER":       return "/dashboard/player";
      default:             return "/dashboard";
    }
  };

  const fetchNotifications = async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (session) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotifIcon = (type: string) => {
    const icons: Record<string, string> = {
      MATCH_COMPLETED: "🏆", MATCH_STARTED: "🏏", WICKET_ALERT: "🔴",
      RESULT_DECLARED: "✅", TOSS_UPDATE: "🪙", ANNOUNCEMENT: "📢",
      FIXTURE_PUBLISHED: "📅", INNINGS_BREAK: "☕",
    };
    return icons[type] || "🔔";
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const isActive = (href: string) =>
    href === "/home" ? pathname === "/home" || pathname === "/" : pathname.startsWith(href);

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      SUPER_ADMIN: "Super Admin", LEAGUE_ADMIN: "League Admin",
      TEAM_MANAGER: "Team Manager", SCORER: "Scorer",
      PLAYER: "Player", FAN: "Fan",
    };
    return map[role] || role;
  };

  return (
    <>
      {/* Top accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-[#769FCD] via-[#B9D7EA] to-[#769FCD]" />

      <nav
        className={`bg-[#1B3A5C] text-white sticky top-0 z-50 transition-shadow duration-200 ${
          scrolled ? "shadow-lg shadow-[#1B3A5C]/30" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/home" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-[#769FCD] rounded-lg flex items-center justify-center text-xl shadow-sm group-hover:bg-[#5A8BBE] transition-colors">
                🏏
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg leading-none text-white">CricketLeague</span>
                <span className="block text-[10px] text-[#B9D7EA] leading-none tracking-widest uppercase">Pro Platform</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 mx-0.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive(link.href)
                      ? "bg-[#769FCD] text-white shadow-sm"
                      : "text-[#B9D7EA] hover:bg-[#2D5484] hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-2">
              {session ? (
                <>
                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
                      className="relative p-2 rounded-lg text-[#B9D7EA] hover:bg-[#2D5484] hover:text-white transition-colors"
                      aria-label="Notifications"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-[#B9D7EA] text-gray-800 z-50 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-[#F7FBFC] border-b border-[#D6E6F2]">
                          <div>
                            <h3 className="font-semibold text-sm text-[#1B3A5C]">Notifications</h3>
                            {unreadCount > 0 && (
                              <p className="text-xs text-[#769FCD]">{unreadCount} unread</p>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-[#769FCD] hover:text-[#1B3A5C] font-medium">
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-[#F7FBFC]">
                          {notifications.length === 0 ? (
                            <div className="text-center py-8">
                              <div className="text-3xl mb-2">🔔</div>
                              <p className="text-gray-400 text-sm">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.slice(0, 10).map((notif) => (
                              <div
                                key={notif.id}
                                className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-[#F7FBFC] transition-colors ${
                                  !notif.isRead ? "bg-[#F7FBFC] border-l-2 border-l-[#769FCD]" : ""
                                }`}
                                onClick={() => setNotifications((prev) =>
                                  prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n)
                                )}
                              >
                                <span className="text-base flex-shrink-0 mt-0.5">{getNotifIcon(notif.type)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold ${!notif.isRead ? "text-[#1B3A5C]" : "text-gray-600"}`}>
                                    {notif.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{notif.message}</p>
                                  <p className="text-[10px] text-gray-400 mt-1">{formatTime(notif.createdAt)}</p>
                                </div>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 bg-[#769FCD] rounded-full flex-shrink-0 mt-1.5"></span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                        <div className="px-4 py-2 bg-[#F7FBFC] border-t border-[#D6E6F2]">
                          <Link href="/notifications" className="text-xs text-[#769FCD] hover:underline font-medium">
                            View all notifications →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="relative" ref={userRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#2D5484] transition-colors"
                    >
                      <div className="w-7 h-7 bg-[#769FCD] rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {session.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="text-sm font-medium leading-tight">{session.user.name.split(" ")[0]}</p>
                        <p className="text-[10px] text-[#B9D7EA] leading-tight">{roleLabel(session.user.role)}</p>
                      </div>
                      <svg className={`w-3.5 h-3.5 text-[#B9D7EA] transition-transform ${userMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-[#B9D7EA] overflow-hidden z-50">
                        <div className="px-4 py-3 bg-[#F7FBFC] border-b border-[#D6E6F2]">
                          <p className="font-semibold text-sm text-[#1B3A5C]">{session.user.name}</p>
                          <p className="text-xs text-[#769FCD] mt-0.5">{session.user.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-[#D6E6F2] text-[#1B3A5C] text-[10px] font-semibold rounded-full">
                            {roleLabel(session.user.role)}
                          </span>
                        </div>
                        <div className="py-1">
                          {getDashboardLink() && (
                            <Link href={getDashboardLink()!} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1B3A5C] hover:bg-[#F7FBFC] transition-colors" onClick={() => setUserMenuOpen(false)}>
                              <svg className="w-4 h-4 text-[#769FCD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                              Dashboard
                            </Link>
                          )}
                          <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1B3A5C] hover:bg-[#F7FBFC] transition-colors" onClick={() => setUserMenuOpen(false)}>
                            <svg className="w-4 h-4 text-[#769FCD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            My Profile
                          </Link>
                        </div>
                        <div className="py-1 border-t border-[#D6E6F2]">
                          <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-[#B9D7EA] hover:text-white hover:bg-[#2D5484] rounded-lg transition-colors">
                    Login
                  </Link>
                  <Link href="/register" className="px-4 py-2 text-sm font-semibold bg-[#769FCD] hover:bg-[#5A8BBE] text-white rounded-lg transition-colors shadow-sm">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-[#B9D7EA] hover:bg-[#2D5484] transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#2D5484] bg-[#1B3A5C]">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-[#769FCD] text-white"
                      : "text-[#B9D7EA] hover:bg-[#2D5484] hover:text-white"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-[#2D5484] px-4 py-3">
              {session ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 bg-[#769FCD] rounded-full flex items-center justify-center text-sm font-bold">
                      {session.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{session.user.name}</p>
                      <p className="text-xs text-[#B9D7EA]">{roleLabel(session.user.role)}</p>
                    </div>
                  </div>
                  {getDashboardLink() && (
                    <Link href={getDashboardLink()!} className="block px-3 py-2.5 text-sm text-[#B9D7EA] hover:bg-[#2D5484] rounded-lg" onClick={() => setMenuOpen(false)}>
                      Dashboard
                    </Link>
                  )}
                  <Link href="/profile" className="block px-3 py-2.5 text-sm text-[#B9D7EA] hover:bg-[#2D5484] rounded-lg" onClick={() => setMenuOpen(false)}>
                    My Profile
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-[#2D5484] rounded-lg">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-[#B9D7EA] border border-[#2D5484] rounded-lg hover:bg-[#2D5484]" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/register" className="flex-1 text-center px-4 py-2.5 text-sm font-semibold bg-[#769FCD] text-white rounded-lg hover:bg-[#5A8BBE]" onClick={() => setMenuOpen(false)}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
