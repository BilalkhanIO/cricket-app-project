"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, LayoutGrid, Search, ShieldCheck, Trophy, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface League {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  matchFormat: string;
  season: string;
  year: number;
  tournamentType: string;
  playerRegistrationStatus: string;
  startDate: Date | string;
  endDate: Date | string;
  registrationOpenDate?: Date | string | null;
  registrationCloseDate?: Date | string | null;
  maxTeams: number;
  admin: { name: string };
  parentLeague?: { id: string; name: string } | null;
  _count: {
    teams: number;
    matches: number;
    seasons: number;
    playerRegistrations: number;
  };
}

const STATUS_OPTIONS = ["ALL", "ACTIVE", "REGISTRATION", "COMPLETED", "DRAFT"];
const FORMAT_OPTIONS = ["ALL", "T20", "ODI", "TEST", "T10"];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getStatusTone(status: string) {
  if (status === "ACTIVE") return "bg-[#4ae183] text-[#003919]";
  if (status === "REGISTRATION") return "bg-[#c8c8b0] text-[#303221]";
  if (status === "COMPLETED") return "bg-[#1b3656] text-[#d4e3ff]";
  return "bg-[#12324d] text-[#9bb2d1]";
}

function getRegistrationCopy(league: League) {
  if (league.status === "REGISTRATION") {
    return league.registrationCloseDate
      ? `Closes ${formatDate(league.registrationCloseDate)}`
      : "Registration open";
  }

  if (league.playerRegistrationStatus === "OPEN") {
    return league.registrationCloseDate
      ? `Players open until ${formatDate(league.registrationCloseDate)}`
      : "Players can register";
  }

  return "Registration closed";
}

export default function LeaguesClient({ leagues }: { leagues: League[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formatFilter, setFormatFilter] = useState("ALL");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leagues.filter((league) => {
      const matchesSearch =
        !query ||
        league.name.toLowerCase().includes(query) ||
        league.season.toLowerCase().includes(query) ||
        league.admin.name.toLowerCase().includes(query) ||
        league.parentLeague?.name.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "ALL" || league.status === statusFilter;
      const matchesFormat = formatFilter === "ALL" || league.matchFormat === formatFilter;

      return matchesSearch && matchesStatus && matchesFormat;
    });
  }, [formatFilter, leagues, search, statusFilter]);

  const featuredActive = filtered.filter((league) => league.status === "ACTIVE").slice(0, 3);
  const openRegistration = filtered.filter(
    (league) => league.status === "REGISTRATION" || league.playerRegistrationStatus === "OPEN"
  );

  return (
    <div id="league-directory" className="mx-auto max-w-screen-xl px-4 pb-16 pt-10 sm:px-6 lg:pb-20 lg:pt-12">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
            Active
            <span className="block text-[#c8c8b0]">league boards</span>
          </h2>
          <p className="max-w-xl text-sm leading-7 text-[#9bb2d1]">
            Current competitions, season branches, and open entry campaigns arranged like a public control room instead of a plain list.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Trophy,
              value: filtered.filter((league) => league.status === "ACTIVE").length,
              label: "Running leagues",
            },
            {
              icon: Users,
              value: filtered.reduce((sum, league) => sum + league._count.teams, 0),
              label: "Registered teams",
            },
            {
              icon: ShieldCheck,
              value: openRegistration.length,
              label: "Entry windows",
            },
          ].map((item) => (
            <div key={item.label} className="border border-white/10 bg-[#001c3a] p-5">
              <item.icon className="h-5 w-5 text-[#4ae183]" />
              <p className="mt-4 font-[var(--font-display)] text-4xl font-black text-white">{item.value}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 border border-white/10 bg-[#001c3a] p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f9abd]" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by league, season, admin, or family"
              className="w-full border border-white/10 bg-[#00142b] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-[#7f9abd] focus:border-[#4ae183]"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-white/10 bg-[#00142b] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white outline-none focus:border-[#4ae183]"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All statuses" : formatLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={formatFilter}
            onChange={(event) => setFormatFilter(event.target.value)}
            className="border border-white/10 bg-[#00142b] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white outline-none focus:border-[#4ae183]"
          >
            {FORMAT_OPTIONS.map((format) => (
              <option key={format} value={format}>
                {format === "ALL" ? "All formats" : format}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
          <span>{filtered.length} visible</span>
          <span className="h-1 w-1 rounded-full bg-[#4ae183]" />
          <span>{featuredActive.length} featured active</span>
          <span className="h-1 w-1 rounded-full bg-[#4ae183]" />
          <span>{openRegistration.length} with open entry</span>
        </div>
      </section>

      {featuredActive.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              Featured
              <span className="block text-[#4ae183]">competitions</span>
            </h2>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {featuredActive.map((league) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="group border border-white/10 bg-[#1b3656] p-6 transition hover:bg-[#234669]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#c8c8b0]">
                      {league.matchFormat} · {league.season}
                    </p>
                    <h3 className="mt-2 font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                      {league.name}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(league.status)}`}>
                    {formatLabel(league.status)}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#d4e3ff]">
                  {league.description || `${formatLabel(league.tournamentType)} competition managed by ${league.admin.name}.`}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="border border-white/10 bg-[#001c3a] px-3 py-3">
                    <p className="font-[var(--font-display)] text-2xl font-black text-white">{league._count.teams}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Teams</p>
                  </div>
                  <div className="border border-white/10 bg-[#001c3a] px-3 py-3">
                    <p className="font-[var(--font-display)] text-2xl font-black text-white">{league._count.matches}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Matches</p>
                  </div>
                  <div className="border border-white/10 bg-[#001c3a] px-3 py-3">
                    <p className="font-[var(--font-display)] text-2xl font-black text-white">{league.maxTeams}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Capacity</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="registration-window" className="mt-12 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
            Registration
            <span className="block text-[#c8c8b0]">windows</span>
          </h2>
          <p className="text-sm leading-7 text-[#9bb2d1]">
            These seasons are currently accepting entries or have player registration enabled. League admins can run multiple seasons under one league family.
          </p>
        </div>

        <div className="space-y-3">
          {openRegistration.length === 0 ? (
            <div className="border border-white/10 bg-[#001c3a] p-6 text-sm text-[#9bb2d1]">
              No registration windows are open right now.
            </div>
          ) : (
            openRegistration.slice(0, 4).map((league) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="flex flex-col gap-4 border border-white/10 bg-[#001c3a] p-5 transition hover:bg-[#0b2747] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4ae183]">
                    {league.parentLeague ? `${league.parentLeague.name} season` : "Standalone season"}
                  </p>
                  <h3 className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                    {league.name}
                  </h3>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">
                    {getRegistrationCopy(league)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center sm:min-w-[12rem]">
                  <div className="border border-white/10 bg-[#00142b] px-3 py-3">
                    <p className="font-[var(--font-display)] text-2xl font-black text-white">{league._count.playerRegistrations}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Players</p>
                  </div>
                  <div className="border border-white/10 bg-[#00142b] px-3 py-3">
                    <p className="font-[var(--font-display)] text-2xl font-black text-white">{league._count.teams}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Teams</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-12">
        {filtered.length === 0 ? (
          <div className="border border-white/10 bg-[#001c3a] px-6 py-12 text-center">
            <p className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">No leagues match</p>
            <p className="mt-3 text-sm text-[#9bb2d1]">Try a broader search or switch the status and format filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((league) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="group flex h-full flex-col border border-white/10 bg-[#001c3a] p-5 transition hover:bg-[#0b2747]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">
                      {league.year} · {league.matchFormat} · {formatLabel(league.tournamentType)}
                    </p>
                    <h3 className="mt-2 font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                      {league.name}
                    </h3>
                  </div>
                  <span className={`shrink-0 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(league.status)}`}>
                    {formatLabel(league.status)}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#9bb2d1]">
                  {league.description ||
                    `${league.season} season managed by ${league.admin.name}. Entry, fixtures, standings, and records are available from the league board.`}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#c8c8b0]">
                  <span className="bg-[#1b3656] px-3 py-1">{league.season}</span>
                  {league.parentLeague && <span className="bg-[#12324d] px-3 py-1">{league.parentLeague.name}</span>}
                  {league._count.seasons > 0 && <span className="bg-[#12324d] px-3 py-1">{league._count.seasons} seasons</span>}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="border border-white/10 bg-[#00142b] px-3 py-3">
                    <p className="font-[var(--font-display)] text-2xl font-black text-white">{league._count.teams}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Teams</p>
                  </div>
                  <div className="border border-white/10 bg-[#00142b] px-3 py-3">
                    <p className="font-[var(--font-display)] text-2xl font-black text-white">{league._count.matches}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Matches</p>
                  </div>
                  <div className="border border-white/10 bg-[#00142b] px-3 py-3">
                    <p className="font-[var(--font-display)] text-2xl font-black text-white">{league.maxTeams}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Max</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#4ae183]" />
                    <span>
                      {formatDate(league.startDate)} to {formatDate(league.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#4ae183]" />
                    <span>{league.admin.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-[#4ae183]" />
                    <span>{getRegistrationCopy(league)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
