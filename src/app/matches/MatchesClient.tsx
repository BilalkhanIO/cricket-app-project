"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

interface Match {
  id: string;
  status: string;
  matchFormat: string;
  overs: number;
  result?: string | null;
  matchDate: Date | string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: { id: string; name: string; shortName: string; jerseyColor: string | null };
  awayTeam: { id: string; name: string; shortName: string; jerseyColor: string | null };
  venue?: { name: string; city: string } | null;
  league: { id: string; name: string };
  innings: { inningsNumber: number; teamId: string; totalRuns: number; totalWickets: number; totalOvers: number; isCompleted: boolean }[];
}

const STATUS_OPTIONS = ["ALL", "LIVE", "UPCOMING", "COMPLETED", "INNINGS_BREAK", "ABANDONED"];

// ─── Calendar Helpers ──────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function CalendarView({ matches }: { matches: Match[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Group matches by day of this month/year
  const matchesByDay = useMemo(() => {
    const map: Record<number, Match[]> = {};
    matches.forEach((m) => {
      const d = new Date(m.matchDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(m);
      }
    });
    return map;
  }, [matches, year, month]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const selectedMatches = selectedDay ? (matchesByDay[selectedDay] || []) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#1B3A5C]">
            <button onClick={prevMonth} className="text-white hover:text-[#B9D7EA] p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-white font-bold text-lg">{MONTH_NAMES[month]} {year}</h2>
            <button onClick={nextMonth} className="text-white hover:text-[#B9D7EA] p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for first day offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 border-b border-r border-gray-50" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayMatches = matchesByDay[day] || [];
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              const isSelected = selectedDay === day;
              const hasLive = dayMatches.some(m => m.status === "LIVE" || m.status === "INNINGS_BREAK");

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={`h-16 border-b border-r border-gray-50 p-1 text-left transition-colors hover:bg-[#F7FBFC] ${
                    isSelected ? "bg-[#D6E6F2]" : ""
                  }`}
                >
                  <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    isToday ? "bg-[#769FCD] text-white" : "text-gray-700"
                  }`}>{day}</span>
                  {dayMatches.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      {dayMatches.slice(0, 2).map((m) => (
                        <div
                          key={m.id}
                          className={`text-[9px] rounded px-1 truncate font-medium leading-tight ${
                            m.status === "LIVE" ? "bg-red-100 text-red-700" :
                            m.status === "COMPLETED" ? "bg-[#D6E6F2] text-[#1B3A5C]" :
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {m.homeTeam.shortName} v {m.awayTeam.shortName}
                        </div>
                      ))}
                      {dayMatches.length > 2 && (
                        <div className="text-[9px] text-gray-400">+{dayMatches.length - 2} more</div>
                      )}
                    </div>
                  )}
                  {hasLive && !isSelected && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar: selected day matches */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-1">
              {selectedDay
                ? `${MONTH_NAMES[month]} ${selectedDay}`
                : "Select a date"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {selectedDay
                ? `${selectedMatches.length} match${selectedMatches.length !== 1 ? "es" : ""}`
                : "Click a date to see matches"}
            </p>

            {selectedMatches.length > 0 ? (
              <div className="space-y-3">
                {selectedMatches.map((m) => {
                  const inn1 = m.innings.find(i => i.inningsNumber === 1);
                  const inn2 = m.innings.find(i => i.inningsNumber === 2);
                  return (
                    <Link key={m.id} href={`/matches/${m.id}`}>
                      <div className="border border-gray-100 rounded-lg p-3 hover:bg-[#F7FBFC] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500">{m.league.name}</span>
                          <StatusBadge status={m.status} />
                        </div>
                        {[
                          { team: m.homeTeam, inn: inn1?.teamId === m.homeTeamId ? inn1 : inn2?.teamId === m.homeTeamId ? inn2 : null },
                          { team: m.awayTeam, inn: inn1?.teamId === m.awayTeamId ? inn1 : inn2?.teamId === m.awayTeamId ? inn2 : null },
                        ].map(({ team, inn }) => (
                          <div key={team.id} className="flex items-center justify-between py-0.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.jerseyColor || "#769FCD" }} />
                              <span className="text-sm font-medium text-gray-900">{team.shortName}</span>
                            </div>
                            {inn ? (
                              <span className="text-sm font-bold">{inn.totalRuns}/{inn.totalWickets}</span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        ))}
                        {m.result && (
                          <p className="text-xs text-[#769FCD] font-medium mt-1">{m.result}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(m.matchDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          {m.venue ? ` · ${m.venue.city}` : ""}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : selectedDay ? (
              <p className="text-sm text-gray-400 text-center py-6">No matches on this date</p>
            ) : null}
          </div>

          {/* Month summary */}
          <div className="bg-[#F7FBFC] border border-[#D6E6F2] rounded-xl p-4">
            <h3 className="font-semibold text-[#1B3A5C] mb-3 text-sm">This Month</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Total", value: Object.values(matchesByDay).flat().length, color: "text-gray-900" },
                { label: "Live", value: Object.values(matchesByDay).flat().filter(m => m.status === "LIVE").length, color: "text-red-600" },
                { label: "Done", value: Object.values(matchesByDay).flat().filter(m => m.status === "COMPLETED").length, color: "text-[#769FCD]" },
              ].map((s) => (
                <div key={s.label}>
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function MatchesClient({ allMatches }: { allMatches: Match[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [view, setView] = useState<"list" | "calendar">("list");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allMatches.filter((m) => {
      const matchesSearch =
        !q ||
        m.homeTeam.name.toLowerCase().includes(q) ||
        m.awayTeam.name.toLowerCase().includes(q) ||
        m.league.name.toLowerCase().includes(q) ||
        m.homeTeam.shortName.toLowerCase().includes(q) ||
        m.awayTeam.shortName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allMatches, search, statusFilter]);

  const groups: Record<string, Match[]> = {
    LIVE: filtered.filter((m) => m.status === "LIVE"),
    INNINGS_BREAK: filtered.filter((m) => m.status === "INNINGS_BREAK"),
    UPCOMING: filtered.filter((m) => m.status === "UPCOMING"),
    COMPLETED: filtered.filter((m) => m.status === "COMPLETED"),
    OTHER: filtered.filter((m) => ["ABANDONED", "DELAYED", "CANCELED"].includes(m.status)),
  };

  return (
    <>
      {/* Search, Filters and View Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by team or league name..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#769FCD] focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#769FCD] bg-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</option>
            ))}
          </select>
          {/* View Toggle */}
          <div className="flex rounded-xl border border-gray-300 overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                view === "list"
                  ? "bg-[#1B3A5C] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 transition-colors border-l border-gray-300 ${
                view === "calendar"
                  ? "bg-[#1B3A5C] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>
          </div>
        </div>
        {view === "list" && (
          <p className="text-sm text-gray-500 mb-4">{filtered.length} match{filtered.length !== 1 ? "es" : ""} found</p>
        )}
      </div>

      {/* Views */}
      {view === "calendar" ? (
        <CalendarView matches={filtered} />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="space-y-8">
            {Object.entries(groups).map(([status, matches]) =>
              matches.length > 0 ? (
                <section key={status}>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    {status === "LIVE" && <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
                    {status === "LIVE" ? "Live Matches" :
                     status === "INNINGS_BREAK" ? "Innings Break" :
                     status === "UPCOMING" ? "Upcoming Fixtures" :
                     status === "COMPLETED" ? "Recent Results" : "Other Matches"}
                    <span className="text-base font-normal text-gray-500">({matches.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matches.map((match) => {
                      const inn1 = match.innings.find((i) => i.inningsNumber === 1);
                      const inn2 = match.innings.find((i) => i.inningsNumber === 2);
                      return (
                        <Link key={match.id} href={`/matches/${match.id}`}>
                          <Card hoverable className="h-full">
                            <div className={`px-4 py-2 flex items-center justify-between border-b ${
                              match.status === "LIVE" ? "bg-red-50 border-red-100" :
                              match.status === "COMPLETED" ? "bg-[#F7FBFC] border-[#D6E6F2]" :
                              "bg-gray-50 border-gray-100"
                            }`}>
                              <span className="text-xs text-gray-500">{match.league.name}</span>
                              <StatusBadge status={match.status} />
                            </div>
                            <CardBody className="py-4">
                              <div className="space-y-3 mb-3">
                                {[
                                  { team: match.homeTeam, innings: inn1?.teamId === match.homeTeamId ? inn1 : inn2?.teamId === match.homeTeamId ? inn2 : null },
                                  { team: match.awayTeam, innings: inn1?.teamId === match.awayTeamId ? inn1 : inn2?.teamId === match.awayTeamId ? inn2 : null },
                                ].map(({ team, innings: inn }) => (
                                  <div key={team.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.jerseyColor || "#769FCD" }} />
                                      <span className="font-medium text-sm text-gray-900">{team.name}</span>
                                    </div>
                                    {inn ? (
                                      <span className="text-sm font-bold text-gray-900">
                                        {inn.totalRuns}/{inn.totalWickets}
                                        <span className="text-gray-400 font-normal text-xs ml-1">({inn.totalOvers.toFixed(1)})</span>
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">Yet to bat</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {match.result ? (
                                <div className="bg-[#F7FBFC] rounded-lg px-3 py-2 text-xs font-medium text-[#1B3A5C]">
                                  {match.result}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 space-y-1">
                                  <p>📅 {formatDateTime(match.matchDate)}</p>
                                  {match.venue && <p>📍 {match.venue.city}</p>}
                                  <p>🏏 {match.matchFormat} · {match.overs} overs</p>
                                </div>
                              )}
                            </CardBody>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ) : null
            )}
          </div>
          {filtered.length === 0 && (
            <Card>
              <CardBody className="text-center py-16">
                <div className="text-5xl mb-4">🏏</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Matches Found</h3>
                <p className="text-gray-500">Try adjusting your search or filter.</p>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
