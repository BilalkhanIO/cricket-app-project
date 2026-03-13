"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";

interface Player {
  id: string;
  role: string;
  battingHand: string;
  user: { name: string; profileImage?: string | null; city?: string | null };
  team?: { id: string; name: string; shortName: string; jerseyColor: string | null } | null;
  playerStats: { runs: number; wickets: number; highestScore: number; average: number; economy: number; matchesPlayed: number }[];
}

const ROLES = ["ALL", "BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"];

export default function PlayersClient({ players }: { players: Player[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [teamFilter, setTeamFilter] = useState("ALL");

  const teams = useMemo(() => {
    const teamMap = new Map<string, string>();
    players.forEach((p) => {
      if (p.team) teamMap.set(p.team.id, p.team.name);
    });
    return Array.from(teamMap.entries());
  }, [players]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return players.filter((p) => {
      const matchesSearch = !q || p.user.name.toLowerCase().includes(q);
      const matchesRole = roleFilter === "ALL" || p.role === roleFilter;
      const matchesTeam = teamFilter === "ALL" || p.team?.id === teamFilter;
      return matchesSearch && matchesRole && matchesTeam;
    });
  }, [players, search, roleFilter, teamFilter]);

  const grouped: Record<string, Player[]> = {};
  filtered.forEach((p) => {
    const role = roleFilter === "ALL" ? p.role : p.role;
    if (!grouped[role]) grouped[role] = [];
    grouped[role].push(p);
  });

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
            placeholder="Search by player name..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#769FCD] focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#769FCD] bg-white"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r === "ALL" ? "All Roles" : r.replace("_", " ")}</option>
          ))}
        </select>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#769FCD] bg-white"
        >
          <option value="ALL">All Teams</option>
          {teams.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">{filtered.length} player{filtered.length !== 1 ? "s" : ""} found</p>

      <div className="space-y-8">
        {Object.entries(grouped).map(([role, rolePlayers]) => (
          <section key={role}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {role === "BATSMAN" ? "🏏" : role === "BOWLER" ? "🎳" : role === "WICKETKEEPER" ? "🧤" : "⭐"}{" "}
              {role.replace("_", " ")}s ({rolePlayers.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rolePlayers.map((player) => {
                const stats = player.playerStats[0];
                return (
                  <Link key={player.id} href={`/players/${player.id}`}>
                    <Card hoverable className="h-full">
                      <CardBody>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-[#D6E6F2] flex items-center justify-center font-bold text-[#1B3A5C] text-lg">
                            {player.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{player.user.name}</p>
                            <p className="text-xs text-gray-500">{player.battingHand} bat</p>
                          </div>
                        </div>

                        {player.team && (
                          <div
                            className="flex items-center gap-2 px-2 py-1 rounded-full text-white text-xs mb-3"
                            style={{ backgroundColor: player.team.jerseyColor || "#16a34a" }}
                          >
                            <span>{player.team.shortName}</span>
                            <span>·</span>
                            <span>{player.team.name}</span>
                          </div>
                        )}

                        {stats && (
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            {role === "BOWLER" ? (
                              <>
                                <div className="bg-gray-50 rounded p-1.5">
                                  <div className="font-bold text-gray-900">{stats.wickets}</div>
                                  <div className="text-gray-400">Wkts</div>
                                </div>
                                <div className="bg-gray-50 rounded p-1.5">
                                  <div className="font-bold text-gray-900">{stats.economy.toFixed(1)}</div>
                                  <div className="text-gray-400">Eco</div>
                                </div>
                                <div className="bg-gray-50 rounded p-1.5">
                                  <div className="font-bold text-gray-900">{stats.matchesPlayed}</div>
                                  <div className="text-gray-400">M</div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="bg-gray-50 rounded p-1.5">
                                  <div className="font-bold text-gray-900">{stats.runs}</div>
                                  <div className="text-gray-400">Runs</div>
                                </div>
                                <div className="bg-gray-50 rounded p-1.5">
                                  <div className="font-bold text-gray-900">{stats.highestScore}</div>
                                  <div className="text-gray-400">HS</div>
                                </div>
                                <div className="bg-gray-50 rounded p-1.5">
                                  <div className="font-bold text-gray-900">{stats.average.toFixed(1)}</div>
                                  <div className="text-gray-400">Avg</div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardBody className="text-center py-16">
            <div className="text-5xl mb-4">🏏</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Players Found</h3>
            <p className="text-gray-500">Try adjusting your search or filter.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
