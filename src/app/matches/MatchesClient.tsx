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

export default function MatchesClient({ allMatches }: { allMatches: Match[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
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
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">{filtered.length} match{filtered.length !== 1 ? "es" : ""} found</p>

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
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: team.jerseyColor || "#16a34a" }}
                                  />
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
  );
}
