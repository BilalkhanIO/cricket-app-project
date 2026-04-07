"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";

type LeagueTeamStatus = "ACTIVE" | "APPROVED" | "PENDING" | "WAITLISTED" | "REJECTED";

interface TeamRecord {
  id: string;
  name: string;
  shortName: string;
  jerseyColor: string | null;
  city?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  sponsorName?: string | null;
  manager: { name: string; email: string };
  _count: { players: number };
  leagues?: Array<{ status: LeagueTeamStatus; group: string | null }>;
}

interface TeamLeagueRecord {
  id: string;
  status: LeagueTeamStatus;
  group?: string | null;
  approvalNotes: string | null;
  registeredAt: string;
  approvedAt: string | null;
  team: TeamRecord;
}

const STATUS_STYLES: Record<LeagueTeamStatus, string> = {
  ACTIVE: "bg-[color:var(--card-muted)] text-[color:var(--color-ink)]",
  APPROVED: "bg-[color:var(--card-muted)] text-[color:var(--color-ink)]",
  PENDING: "bg-yellow-100 text-yellow-800",
  WAITLISTED: "bg-gray-100 text-gray-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function LeagueTeamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [leagueName, setLeagueName] = useState("");
  const [assignedTeams, setAssignedTeams] = useState<TeamLeagueRecord[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [groupDrafts, setGroupDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/leagues/${id}`).then((res) => res.json()),
      fetch("/api/teams").then((res) => res.json()),
    ])
      .then(([leagueData, teamsData]) => {
        setLeagueName(leagueData.league?.name || "");
        setAssignedTeams(leagueData.league?.teams || []);
        setAllTeams(teamsData.teams || []);
        setGroupDrafts(
          Object.fromEntries(
            (leagueData.league?.teams || []).map((item: TeamLeagueRecord) => [item.team.id, item.group || ""])
          )
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load league teams");
        setLoading(false);
      });
  }, [id]);

  const assignedTeamIds = useMemo(
    () => new Set(assignedTeams.map((item) => item.team.id)),
    [assignedTeams],
  );

  const normalizedSearch = search.trim().toLowerCase();

  const filteredAssigned = useMemo(() => {
    return assignedTeams.filter((item) => {
      if (!normalizedSearch) return true;
      return (
        item.team.name.toLowerCase().includes(normalizedSearch) ||
        item.team.shortName.toLowerCase().includes(normalizedSearch) ||
        item.team.manager.name.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [assignedTeams, normalizedSearch]);

  const availableTeams = useMemo(() => {
    return allTeams.filter((team) => {
      if (assignedTeamIds.has(team.id)) return false;
      if (!normalizedSearch) return true;
      return (
        team.name.toLowerCase().includes(normalizedSearch) ||
        team.shortName.toLowerCase().includes(normalizedSearch) ||
        team.manager.name.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [allTeams, assignedTeamIds, normalizedSearch]);

  const activeAssignments = assignedTeams.filter((item) =>
    ["ACTIVE", "APPROVED"].includes(item.status),
  ).length;
  const pendingAssignments = assignedTeams.filter((item) => item.status === "PENDING").length;

  const assignTeam = async (teamId: string) => {
    setProcessingId(teamId);
    setError("");
    try {
      const res = await fetch(`/api/leagues/${id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, action: "add", group: groupDrafts[teamId] || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to assign team");
        return;
      }

      const team = allTeams.find((item) => item.id === teamId);
      if (!team) return;

      setAssignedTeams((current) => [
        ...current.filter((item) => item.team.id !== teamId),
        {
          id: data.registration?.id || `${id}-${teamId}`,
          status: data.registration?.status || "ACTIVE",
          group: data.registration?.group || groupDrafts[teamId] || null,
          approvalNotes: data.registration?.approvalNotes || null,
          registeredAt: data.registration?.registeredAt || new Date().toISOString(),
          approvedAt: data.registration?.approvedAt || new Date().toISOString(),
          team,
        },
      ]);
    } finally {
      setProcessingId(null);
    }
  };

  const updateGroup = async (teamId: string) => {
    setProcessingId(teamId);
    setError("");
    try {
      const res = await fetch(`/api/leagues/${id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, action: "update-group", group: groupDrafts[teamId] || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update pool");
        return;
      }
      setAssignedTeams((current) =>
        current.map((item) =>
          item.team.id === teamId ? { ...item, group: data.registration?.group || groupDrafts[teamId] || null } : item
        )
      );
    } finally {
      setProcessingId(null);
    }
  };

  const removeTeam = async (teamId: string) => {
    setProcessingId(teamId);
    setError("");
    try {
      const res = await fetch(`/api/leagues/${id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, action: "remove" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to remove team");
        return;
      }
      setAssignedTeams((current) => current.filter((item) => item.team.id !== teamId));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-32 rounded-xl bg-gray-100" />
        <div className="h-64 rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/admin/leagues/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← {leagueName}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Team Assignment</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/teams/new`}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Create Team
          </Link>
          <Link
            href={`/admin/leagues/${id}/fixtures`}
            className="rounded-lg bg-[color:var(--primary-dark)] px-4 py-2 text-sm font-medium text-white hover:bg-[#17364e]"
          >
            Generate Fixtures →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-2xl font-bold text-gray-900">{assignedTeams.length}</div>
          <div className="text-sm text-gray-500">League teams</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-2xl font-bold text-gray-900">{activeAssignments}</div>
          <div className="text-sm text-gray-500">Active assignments</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-2xl font-bold text-gray-900">{pendingAssignments}</div>
          <div className="text-sm text-gray-500">Pending legacy rows</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-2xl font-bold text-gray-900">{new Set(assignedTeams.map((item) => item.group || "Ungrouped")).size}</div>
          <div className="text-sm text-gray-500">Pools configured</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--card-muted)] px-4 py-4 text-sm text-[color:var(--color-ink)]">
        Assign teams directly to this league. Add pool labels like `Pool A` or `Group 1` here, and group-stage fixtures and standings will use them automatically.
      </div>

      <div className="rounded-xl border bg-white p-4">
        <label className="block text-sm font-medium text-gray-700">Search teams or managers</label>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by team name, short name, or manager"
          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-0 placeholder:text-gray-400 focus:border-[color:var(--primary)]"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Assigned Teams</h2>
            <p className="text-sm text-gray-500">Teams already attached to this league and ready for setup.</p>
          </div>

          {filteredAssigned.length === 0 ? (
            <div className="rounded-xl border bg-white px-5 py-10 text-center text-sm text-gray-500">
              No teams assigned yet.
            </div>
          ) : (
            filteredAssigned.map((entry) => (
              <div key={entry.id} className="rounded-xl border bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: entry.team.jerseyColor || "var(--primary)" }}
                    >
                      {entry.team.shortName}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{entry.team.name}</span>
                        <span className="text-xs text-gray-500">({entry.team.shortName})</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[entry.status]}`}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Manager: {entry.team.manager.name} · {entry.team.manager.email}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {entry.team._count.players} players
                        {entry.team.city ? ` · ${entry.team.city}` : ""}
                        {entry.approvedAt
                          ? ` · active ${new Date(entry.approvedAt).toLocaleDateString("en-GB")}`
                          : ` · added ${new Date(entry.registeredAt).toLocaleDateString("en-GB")}`}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <input
                          value={groupDrafts[entry.team.id] || ""}
                          onChange={(event) =>
                            setGroupDrafts((current) => ({ ...current, [entry.team.id]: event.target.value }))
                          }
                          placeholder="Pool A / Group 1"
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs"
                        />
                        <button
                          onClick={() => updateGroup(entry.team.id)}
                          disabled={processingId === entry.team.id}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Save pool
                        </button>
                        <span className="text-xs text-gray-500">
                          {entry.group || "Ungrouped"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeTeam(entry.team.id)}
                    disabled={processingId === entry.team.id}
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {processingId === entry.team.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Available Teams</h2>
            <p className="text-sm text-gray-500">Existing teams that can be added to this league.</p>
          </div>

          {availableTeams.length === 0 ? (
            <div className="rounded-xl border bg-white px-5 py-10 text-center text-sm text-gray-500">
              No unassigned teams match the current search.
            </div>
          ) : (
            availableTeams.map((team) => (
              <div key={team.id} className="rounded-xl border bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: team.jerseyColor || "var(--primary)" }}
                    >
                      {team.shortName}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{team.name}</span>
                        <span className="text-xs text-gray-500">({team.shortName})</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Manager: {team.manager.name} · {team.manager.email}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {team._count.players} players
                        {team.city ? ` · ${team.city}` : ""}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => assignTeam(team.id)}
                    disabled={processingId === team.id}
                    className="rounded-lg bg-[color:var(--primary)] px-3 py-2 text-xs font-medium text-white hover:bg-[color:var(--primary-dark)] disabled:opacity-50"
                  >
                    {processingId === team.id ? "Adding..." : "Add to League"}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
