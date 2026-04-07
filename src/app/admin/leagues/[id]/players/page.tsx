"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TeamOption = {
  id: string;
  team: {
    id: string;
    name: string;
    shortName: string;
  };
  status: string;
};

type PlayerRegistration = {
  id: string;
  team: {
    id: string;
    name: string;
    shortName: string;
  } | null;
  player: {
    id: string;
    role: string;
    team: {
      id: string;
      name: string;
      shortName: string;
    } | null;
    user: {
      id: string;
      name: string;
      email: string;
      profileImage: string | null;
    };
  };
};

type LeaguePayload = {
  league: {
    id: string;
    name: string;
    season: string;
    year: number;
    parentLeague: { id: string; name: string; season: string; year: number } | null;
    teams: TeamOption[];
    playerRegistrations: PlayerRegistration[];
  };
};

export default function LeaguePlayerManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [league, setLeague] = useState<LeaguePayload["league"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadLeague = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leagues/${id}`);
      const data: LeaguePayload = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error || "Failed to load");
        return;
      }
      setLeague(data.league);
    } catch {
      setError("Failed to load league player management");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeague(); }, [id]);

  const assignableTeams = useMemo(
    () => (league?.teams || []).filter((team) => ["ACTIVE", "APPROVED"].includes(team.status)),
    [league]
  );

  const assignTeam = async (playerId: string, teamId: string) => {
    setBusyKey(`assign-${playerId}`);
    setError("");
    try {
      const res = await fetch(`/api/leagues/${id}/players/${playerId}/assign-team`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: teamId || null, status: teamId ? "APPROVED" : "PENDING" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to assign player to team"); return; }
      setLeague((current) =>
        current
          ? {
              ...current,
              playerRegistrations: current.playerRegistrations.map((item) =>
                item.player.id === playerId ? data.registration : item
              ),
            }
          : current
      );
    } catch {
      setError("Failed to assign player to team");
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-72 rounded bg-[#1b3656] animate-pulse" />
        <div className="h-72 rounded bg-[#001c3a] animate-pulse" />
      </div>
    );
  }

  if (!league) {
    return <div className="border border-red-500/30 bg-red-900/20 p-6 text-sm text-red-400">{error || "League not found"}</div>;
  }

  const assigned = league.playerRegistrations.filter((r) => r.team).length;

  return (
    <div className="space-y-6">
      <div className="border border-white/10 bg-[#001c3a] px-6 py-6">
        <Link href={`/admin/leagues/${id}`} className="text-xs font-black uppercase tracking-[0.18em] text-[#9bb2d1] hover:text-white">
          ← {league.name}
        </Link>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
          Player Squad
        </h1>
        <p className="mt-1 text-sm text-[#9bb2d1]">
          {league.parentLeague ? `${league.parentLeague.name} · ` : ""}
          {league.season} {league.year} — assign players to teams.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Total players", value: league.playerRegistrations.length },
          { label: "Assigned to team", value: assigned },
          { label: "Unassigned", value: league.playerRegistrations.length - assigned },
        ].map((item) => (
          <div key={item.label} className="border border-white/10 bg-[#001c3a] px-5 py-4">
            <p className="font-[var(--font-display)] text-3xl font-black text-white">{item.value}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{item.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="border border-white/10 bg-[#001c3a]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
            Squad assignment
          </h2>
          <p className="mt-1 text-sm text-[#9bb2d1]">
            Assign each player to a team in this competition.
          </p>
        </div>

        {league.playerRegistrations.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[#9bb2d1]">
            No players in this competition yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                  <th className="px-5 py-3 text-left">Player</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Base team</th>
                  <th className="px-5 py-3 text-left">Assign to team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {league.playerRegistrations.map((reg) => (
                  <tr key={reg.id} className="align-middle">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center bg-[#12324d] text-sm font-black text-white">
                          {reg.player.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold uppercase tracking-[0.08em] text-white">{reg.player.user.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9bb2d1]">{reg.player.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-[#9bb2d1]">
                      {reg.player.role.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-[#d4e3ff]">
                      {reg.player.team?.name || <span className="text-[#9bb2d1]">None</span>}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        className="w-full border border-white/10 bg-[#00142b] px-3 py-2 text-sm font-bold text-white focus:border-[#4ae183] focus:outline-none disabled:opacity-50"
                        value={reg.team?.id || ""}
                        disabled={busyKey === `assign-${reg.player.id}`}
                        onChange={(e) => assignTeam(reg.player.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {assignableTeams.map((t) => (
                          <option key={t.team.id} value={t.team.id}>
                            {t.team.name} ({t.team.shortName})
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
