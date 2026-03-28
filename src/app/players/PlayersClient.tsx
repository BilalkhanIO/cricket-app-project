"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

interface Player {
  id: string;
  role: string;
  battingHand: string;
  user: { name: string; profileImage?: string | null; city?: string | null };
  team?: { id: string; name: string; shortName: string; jerseyColor: string | null } | null;
  playerStats: {
    runs: number;
    wickets: number;
    highestScore: number;
    average: number;
    economy: number;
    matchesPlayed: number;
  }[];
}

const ROLES = ["ALL", "BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default function PlayersClient({
  players,
  initialTeamFilter = "ALL",
  activeTeamName = null,
}: {
  players: Player[];
  initialTeamFilter?: string;
  activeTeamName?: string | null;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [teamFilter, setTeamFilter] = useState(initialTeamFilter);

  const teams = useMemo(() => {
    const map = new Map<string, string>();
    players.forEach((player) => {
      if (player.team) map.set(player.team.id, player.team.name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [players]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return players.filter((player) => {
      const matchesSearch =
        !query ||
        player.user.name.toLowerCase().includes(query) ||
        player.team?.name.toLowerCase().includes(query) ||
        player.user.city?.toLowerCase().includes(query);

      const matchesRole = roleFilter === "ALL" || player.role === roleFilter;
      const matchesTeam = teamFilter === "ALL" || player.team?.id === teamFilter;

      return matchesSearch && matchesRole && matchesTeam;
    });
  }, [players, roleFilter, search, teamFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, Player[]> = {};
    filtered.forEach((player) => {
      if (!groups[player.role]) groups[player.role] = [];
      groups[player.role].push(player);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 pb-16 pt-10 sm:px-6 lg:pb-20 lg:pt-12">
      <section className="border border-white/10 bg-[#001c3a] p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f9abd]" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={activeTeamName ? `Search ${activeTeamName} squad` : "Search by player, city, or team"}
              className="w-full border border-white/10 bg-[#00142b] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-[#7f9abd] focus:border-[#4ae183]"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="border border-white/10 bg-[#00142b] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white outline-none focus:border-[#4ae183]"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role === "ALL" ? "All roles" : formatLabel(role)}
              </option>
            ))}
          </select>

          <select
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            className="border border-white/10 bg-[#00142b] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white outline-none focus:border-[#4ae183]"
          >
            <option value="ALL">All teams</option>
            {teams.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
          <span>{filtered.length} visible</span>
          <span className="h-1 w-1 rounded-full bg-[#4ae183]" />
          <span>{filtered.filter((player) => player.role === "BATSMAN").length} batters</span>
          <span className="h-1 w-1 rounded-full bg-[#4ae183]" />
          <span>{filtered.filter((player) => player.role === "BOWLER").length} bowlers</span>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="mt-10 border border-white/10 bg-[#001c3a] px-6 py-12 text-center">
          <p className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">No players match</p>
          <p className="mt-3 text-sm text-[#9bb2d1]">Try another search or switch the role and team filters.</p>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {Object.entries(grouped).map(([role, rolePlayers]) => (
            <section key={role}>
              <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                {formatLabel(role)}
                <span className="block text-[#4ae183]">{rolePlayers.length} players</span>
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rolePlayers.map((player) => {
                  const stats = player.playerStats[0];

                  return (
                    <Link
                      key={player.id}
                      href={`/players/${player.id}`}
                      className="block border border-white/10 bg-[#001c3a] p-5 transition hover:bg-[#0b2747]"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="flex h-12 w-12 items-center justify-center text-lg font-black text-white"
                          style={{ backgroundColor: player.team?.jerseyColor || "#1b3656" }}
                        >
                          {player.user.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                            {player.user.name}
                          </p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                            {formatLabel(player.role)} · {player.battingHand} bat
                            {player.user.city ? ` · ${player.user.city}` : ""}
                          </p>
                        </div>
                      </div>

                      {player.team && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-[#12324d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d4e3ff]">
                          <span>{player.team.shortName}</span>
                          <span>{player.team.name}</span>
                        </div>
                      )}

                      <div className="mt-5 grid grid-cols-3 gap-3">
                        {role === "BOWLER"
                          ? [
                              { label: "Wickets", value: stats?.wickets || 0 },
                              { label: "Economy", value: stats?.economy.toFixed(1) || "0.0" },
                              { label: "Matches", value: stats?.matchesPlayed || 0 },
                            ].map((item) => (
                              <div key={item.label} className="border border-white/10 bg-[#00142b] px-3 py-3">
                                <p className="font-[var(--font-display)] text-2xl font-black text-white">{item.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{item.label}</p>
                              </div>
                            ))
                          : [
                              { label: "Runs", value: stats?.runs || 0 },
                              { label: "Highest", value: stats?.highestScore || 0 },
                              { label: "Average", value: stats?.average.toFixed(1) || "0.0" },
                            ].map((item) => (
                              <div key={item.label} className="border border-white/10 bg-[#00142b] px-3 py-3">
                                <p className="font-[var(--font-display)] text-2xl font-black text-white">{item.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{item.label}</p>
                              </div>
                            ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
