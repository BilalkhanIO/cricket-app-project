"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface League {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  matchFormat: string;
  season: string;
  startDate: Date | string;
  endDate: Date | string;
  maxTeams: number;
  admin: { name: string };
  _count: { teams: number; matches: number };
}

const STATUS_OPTIONS = ["ALL", "ACTIVE", "REGISTRATION", "COMPLETED", "DRAFT"];
const FORMAT_OPTIONS = ["ALL", "T20", "ODI", "TEST", "T10"];

export default function LeaguesClient({ leagues }: { leagues: League[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formatFilter, setFormatFilter] = useState("ALL");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leagues.filter((l) => {
      const matchesSearch = !q || l.name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || l.status === statusFilter;
      const matchesFormat = formatFilter === "ALL" || l.matchFormat === formatFilter;
      return matchesSearch && matchesStatus && matchesFormat;
    });
  }, [leagues, search, statusFilter, formatFilter]);

  const grouped = {
    ACTIVE: filtered.filter((l) => l.status === "ACTIVE"),
    REGISTRATION: filtered.filter((l) => l.status === "REGISTRATION"),
    COMPLETED: filtered.filter((l) => l.status === "COMPLETED"),
    DRAFT: filtered.filter((l) => l.status === "DRAFT"),
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
            placeholder="Search leagues by name..."
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
        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#769FCD] bg-white"
        >
          {FORMAT_OPTIONS.map((f) => (
            <option key={f} value={f}>{f === "ALL" ? "All Formats" : f}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">{filtered.length} league{filtered.length !== 1 ? "s" : ""} found</p>

      {filtered.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Leagues Found</h3>
            <p className="text-gray-500">Try adjusting your search or filter.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([status, items]) =>
            items.length > 0 ? (
              <section key={status}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  {status === "ACTIVE" && "🟢"}
                  {status === "REGISTRATION" && "📝"}
                  {status === "COMPLETED" && "✅"}
                  {status === "DRAFT" && "📋"}
                  {status.replace("_", " ")} Leagues
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((league) => (
                    <Link key={league.id} href={`/leagues/${league.id}`}>
                      <Card hoverable className="h-full">
                        <CardBody>
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 bg-[#D6E6F2] rounded-xl flex items-center justify-center text-2xl">
                              🏆
                            </div>
                            <StatusBadge status={league.status} />
                          </div>
                          <h3 className="font-bold text-gray-900 mb-1">{league.name}</h3>
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {league.description || `${league.matchFormat} format · ${league.season}`}
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-gray-50 rounded-lg p-2">
                              <div className="font-bold text-gray-900">{league._count.teams}</div>
                              <div className="text-gray-500">Teams</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <div className="font-bold text-gray-900">{league._count.matches}</div>
                              <div className="text-gray-500">Matches</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <div className="font-bold text-gray-900">{league.maxTeams}</div>
                              <div className="text-gray-500">Max Teams</div>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-gray-500">
                            <span>{formatDate(league.startDate)} – {formatDate(league.endDate)}</span>
                          </div>
                        </CardBody>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
