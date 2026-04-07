"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, ChevronDown, LayoutGrid, Menu, Search, Shield, User, X } from "lucide-react";
import { getDashboardLinkForRole, getRoleLabel } from "@/lib/roles";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface SearchResults {
  leagues: { id: string; name: string; season: string; status: string }[];
  teams: { id: string; name: string; shortName: string; homeCity: string | null }[];
  players: { id: string; playerRole: string | null; user: { name: string }; team: { shortName: string } | null }[];
  matches: { id: string; status: string; homeTeam: { shortName: string }; awayTeam: { shortName: string }; league: { name: string } }[];
}

const navLinks = [
  { href: "/home", label: "Home" },
  { href: "/leagues", label: "Leagues" },
  { href: "/matches", label: "Matches" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/stats", label: "Statistics" },
  { href: "/venues", label: "Venues" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const dashboardLink = session ? getDashboardLinkForRole(session.user.role) : null;
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const isActive = (href: string) =>
    href === "/home" ? pathname === "/home" || pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(event.target as Node)) setUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults(null); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setSearchResults(await res.json());
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 280);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
  };

  const totalResults = searchResults
    ? searchResults.leagues.length + searchResults.teams.length + searchResults.players.length + searchResults.matches.length
    : 0;

  useEffect(() => {
    if (!session) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch {}
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getNotifLabel = (type: string) => {
    const labels: Record<string, string> = {
      MATCH_COMPLETED: "Match",
      MATCH_STARTED: "Start",
      WICKET_ALERT: "Wicket",
      RESULT_DECLARED: "Result",
      TOSS_UPDATE: "Toss",
      ANNOUNCEMENT: "News",
      FIXTURE_PUBLISHED: "Fixture",
      INNINGS_BREAK: "Break",
    };
    return labels[type] || "Update";
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/10 transition-all duration-200 ${
        scrolled
          ? "bg-[rgba(0,20,43,0.94)] shadow-[0_18px_40px_rgba(0,8,20,0.32)] backdrop-blur-xl"
          : "bg-[rgba(0,20,43,0.78)] backdrop-blur-lg"
      }`}
    >
      <div className="border-b border-white/10 bg-[rgba(15,34,51,0.72)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#9bb2d1] sm:px-6 lg:px-8">
          <span className="truncate">Matchday control room</span>
          <div className="flex items-center gap-4">
            <Link href="/matches" className="text-[#4ae183]">Live Centre</Link>
            <Link href="/stats" className="hidden sm:inline text-[#c8c8b0]">Records</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between gap-3 py-3">
          <Link href="/home" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/10 bg-[#1b3656] text-[#f4d58a]">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-[var(--font-display)] text-lg font-black uppercase tracking-tight text-white">
                CricketLeague
              </span>
              <span className="block truncate text-[10px] font-bold uppercase tracking-[0.24em] text-[#9bb2d1]">
                Matchday broadcast
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 text-sm font-black uppercase tracking-[0.18em] transition ${
                  isActive(link.href)
                    ? "bg-[#4ae183] text-[#002613]"
                    : "bg-[#001c3a] text-[#d4e3ff] hover:bg-[#0b2747] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {session ? (
              <>
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen((open) => !open)}
                    className="relative border border-white/10 bg-[#001c3a] p-3 text-[#d4e3ff] transition hover:bg-[#0b2747]"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#93000a] px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden border border-white/10 bg-[#071a31] shadow-[0_24px_50px_rgba(0,8,20,0.44)]">
                      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                        <div>
                          <p className="text-sm font-semibold text-white">Notifications</p>
                          <p className="text-xs text-[#9bb2d1]">
                            {unreadCount > 0 ? `${unreadCount} unread updates` : "All caught up"}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4ae183]">
                            Mark read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-10 text-center text-sm text-[#9bb2d1]">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((notif) => (
                            <div key={notif.id} className="border-b border-white/5 px-4 py-4 last:border-b-0">
                              <div className="inline-flex bg-[#12324d] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#4ae183]">
                                {getNotifLabel(notif.type)}
                              </div>
                              <p className="mt-3 text-sm font-semibold text-white">{notif.title}</p>
                              <p className="mt-1 text-xs leading-6 text-[#9bb2d1]">{notif.message}</p>
                              <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-[#c8c8b0]">
                                {formatTime(notif.createdAt)}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="border-t border-white/10 px-4 py-3">
                        <Link href="/notifications" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4ae183]">
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative hidden sm:block" ref={userRef}>
                  <button
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className="flex items-center gap-3 border border-white/10 bg-[#001c3a] px-2 py-1.5 text-left transition hover:bg-[#0b2747]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center bg-[#14304e] text-sm font-bold text-[#f4d58a]">
                      {session.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-semibold leading-tight text-white">
                        {session.user.name.split(" ")[0]}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#9bb2d1]">
                        {getRoleLabel(session.user.role)}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-[#9bb2d1] transition ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-3 w-64 overflow-hidden border border-white/10 bg-[#071a31] shadow-[0_24px_50px_rgba(0,8,20,0.44)]">
                      <div className="border-b border-white/10 px-4 py-4">
                        <p className="text-sm font-semibold text-white">{session.user.name}</p>
                        <p className="mt-1 text-xs text-[#9bb2d1]">{session.user.email}</p>
                        <span className="mt-3 inline-flex rounded-full bg-[#12324d] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#4ae183]">
                          {getRoleLabel(session.user.role)}
                        </span>
                      </div>
                      <div className="p-2">
                        <Link
                          href={dashboardLink || "/profile"}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-[#d4e3ff] transition hover:bg-[#0b2747]"
                        >
                          <LayoutGrid className="h-4 w-4 text-[#4ae183]" />
                          Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-[#d4e3ff] transition hover:bg-[#0b2747]"
                        >
                          <User className="h-4 w-4 text-[#4ae183]" />
                          My Profile
                        </Link>
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold text-[#ffb4ab] transition hover:bg-[#0b2747]"
                        >
                          <X className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  className="border border-white/10 bg-[#001c3a] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#d4e3ff] transition hover:bg-[#0b2747]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-[#4ae183] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#002613] transition hover:bg-[#6bfe9c]"
                >
                  Join
                </Link>
              </div>
            )}

            {/* Search button */}
            <div className="relative" ref={searchRef}>
              <button
                onClick={searchOpen ? closeSearch : openSearch}
                aria-label="Search"
                className="border border-white/10 bg-[#001c3a] p-3 text-[#d4e3ff] transition hover:bg-[#0b2747]"
              >
                {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>

              {searchOpen && (
                <div className="absolute right-0 mt-3 w-[min(26rem,calc(100vw-2rem))] overflow-hidden border border-white/10 bg-[#071a31] shadow-[0_24px_50px_rgba(0,8,20,0.44)]">
                  <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                    <Search className="h-4 w-4 shrink-0 text-[#9bb2d1]" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search leagues, teams, players…"
                      className="w-full bg-transparent text-sm text-white placeholder:text-[#9bb2d1]/60 focus:outline-none"
                    />
                    {searchLoading && <span className="h-3 w-3 shrink-0 animate-spin rounded-full border border-[#4ae183] border-t-transparent" />}
                  </div>

                  {searchResults && totalResults === 0 && searchQuery.length >= 2 && (
                    <div className="px-4 py-6 text-center text-sm text-[#9bb2d1]">No results for &ldquo;{searchQuery}&rdquo;</div>
                  )}

                  {searchResults && totalResults > 0 && (
                    <div className="max-h-96 overflow-y-auto">
                      {searchResults.leagues.length > 0 && (
                        <div>
                          <p className="border-b border-white/5 bg-[#001c3a] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">Leagues</p>
                          {searchResults.leagues.map((l) => (
                            <Link key={l.id} href={`/leagues/${l.id}`} onClick={closeSearch}
                              className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 hover:bg-[#0b2747]">
                              <span className="text-sm font-bold text-white">{l.name} <span className="text-[#9bb2d1]">{l.season}</span></span>
                              <span className={`shrink-0 px-2 py-0.5 text-[10px] font-black uppercase ${l.status === "ACTIVE" ? "bg-[#4ae183]/20 text-[#4ae183]" : "bg-[#12324d] text-[#9bb2d1]"}`}>{l.status}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.teams.length > 0 && (
                        <div>
                          <p className="border-b border-white/5 bg-[#001c3a] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">Teams</p>
                          {searchResults.teams.map((t) => (
                            <Link key={t.id} href={`/teams/${t.id}`} onClick={closeSearch}
                              className="flex items-center gap-3 border-b border-white/5 px-4 py-3 hover:bg-[#0b2747]">
                              <span className="text-sm font-bold text-white">{t.name}</span>
                              {t.homeCity && <span className="text-xs text-[#9bb2d1]">{t.homeCity}</span>}
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.players.length > 0 && (
                        <div>
                          <p className="border-b border-white/5 bg-[#001c3a] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">Players</p>
                          {searchResults.players.map((p) => (
                            <Link key={p.id} href={`/players/${p.id}`} onClick={closeSearch}
                              className="flex items-center gap-3 border-b border-white/5 px-4 py-3 hover:bg-[#0b2747]">
                              <span className="text-sm font-bold text-white">{p.user.name}</span>
                              <span className="text-xs text-[#9bb2d1]">{p.team?.shortName ?? "—"} · {p.playerRole ?? "Player"}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.matches.length > 0 && (
                        <div>
                          <p className="border-b border-white/5 bg-[#001c3a] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">Matches</p>
                          {searchResults.matches.map((m) => (
                            <Link key={m.id} href={`/matches/${m.id}`} onClick={closeSearch}
                              className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 hover:bg-[#0b2747] last:border-b-0">
                              <span className="text-sm font-bold text-white">{m.homeTeam.shortName} vs {m.awayTeam.shortName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#9bb2d1]">{m.league.name}</span>
                                {m.status === "LIVE" && <span className="h-1.5 w-1.5 animate-pulse bg-[#93000a]" />}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              className="border border-white/10 bg-[#001c3a] p-3 text-[#d4e3ff] transition hover:bg-[#0b2747] lg:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 py-4 lg:hidden">
            <div className="grid gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-4 text-sm font-black uppercase tracking-[0.18em] transition ${
                    isActive(link.href)
                      ? "bg-[#4ae183] text-[#002613]"
                      : "bg-[#001c3a] text-[#d4e3ff]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 border border-white/10 bg-[rgba(255,255,255,0.04)] p-3">
              {session ? (
                <div className="space-y-2">
                  <div className="px-2 py-1">
                    <p className="text-sm font-semibold text-white">{session.user.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#9bb2d1]">
                      {getRoleLabel(session.user.role)}
                    </p>
                  </div>
                  <Link
                    href={dashboardLink || "/profile"}
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#d4e3ff] hover:bg-[#0b2747]"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#d4e3ff] hover:bg-[#0b2747]"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block w-full px-3 py-3 text-left text-sm font-black uppercase tracking-[0.16em] text-[#ffb4ab] hover:bg-[#0b2747]"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="border border-white/10 bg-[#001c3a] px-4 py-3 text-center text-sm font-black uppercase tracking-[0.16em] text-[#d4e3ff]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="bg-[#4ae183] px-4 py-3 text-center text-sm font-black uppercase tracking-[0.16em] text-[#002613]"
                  >
                    Join
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
