import Link from "next/link";
import { ArrowUpRight, RadioTower, Shield, Trophy } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  const columns = [
    {
      title: "Platform",
      links: [
        { href: "/leagues", label: "Leagues" },
        { href: "/matches", label: "Matches" },
        { href: "/teams", label: "Teams" },
        { href: "/players", label: "Players" },
      ],
    },
    {
      title: "Insights",
      links: [
        { href: "/stats", label: "Leaderboards" },
        { href: "/stats?tab=batting", label: "Batting Tables" },
        { href: "/stats?tab=bowling", label: "Bowling Tables" },
        { href: "/notifications", label: "Match Alerts" },
      ],
    },
    {
      title: "Access",
      links: [
        { href: "/login", label: "Login" },
        { href: "/register", label: "Register" },
        { href: "/profile", label: "Profile" },
        { href: "/admin", label: "Admin Desk" },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#00142b] text-[#e8decd]">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(74,225,131,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,225,131,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(27,54,86,0.8),transparent_48%),linear-gradient(180deg,rgba(0,20,43,0.2),#00142b_74%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 py-10 sm:py-12 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-5">
            <Link href="/home" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border border-white/10 bg-[#1b3656] text-[#f4d58a]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-[var(--font-display)] text-lg font-black uppercase tracking-tight text-white">
                  CricketLeague
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9bb2d1]">
                  Broadcast footer
                </p>
              </div>
            </Link>

            <p className="max-w-md text-sm leading-7 text-[#9bb2d1]">
              Fixtures, live centres, public standings, and player records staged with the same broadcast atmosphere as the home experience.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "Live", label: "Centre" },
                { value: "T20+", label: "Formats" },
                { value: "Stats", label: "Records" },
              ].map((item) => (
                <div key={item.label} className="border border-white/10 bg-[#001c3a] px-3 py-3">
                  <p className="font-[var(--font-display)] text-xl font-black uppercase text-white">{item.value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#c8c8b0]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#4ae183]">{column.title}</h3>
              <ul className="mt-4 space-y-3 text-sm text-[#d4e3ff]">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.12em] transition hover:text-white">
                      <ArrowUpRight className="h-3.5 w-3.5 text-[#c8c8b0]" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-5 text-xs uppercase tracking-[0.18em] text-[#9bb2d1] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} CricketLeague App</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#4ae183]" />
              League tables
            </span>
            <span className="inline-flex items-center gap-2">
              <RadioTower className="h-4 w-4 text-[#4ae183]" />
              Live scoring
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
