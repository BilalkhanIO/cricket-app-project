"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED";

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
  status: RegistrationStatus;
  notes: string | null;
  registeredAt: string;
  team: {
    id: string;
    name: string;
    shortName: string;
    logo: string | null;
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
    playerRegistrationStatus: "OPEN" | "CLOSED";
    registrationOpenDate: string | null;
    registrationCloseDate: string | null;
    parentLeague: {
      id: string;
      name: string;
      season: string;
      year: number;
    } | null;
    teams: TeamOption[];
    playerRegistrations: PlayerRegistration[];
  };
};

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  WAITLISTED: "bg-slate-100 text-slate-700",
};

export default function LeaguePlayerManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
        setError((data as { error?: string }).error || "Failed to load league player management");
        return;
      }
      setLeague(data.league);
    } catch {
      setError("Failed to load league player management");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeague();
  }, [id]);

  const approvedTeams = useMemo(
    () => (league?.teams || []).filter((team) => team.status === "APPROVED"),
    [league]
  );

  const counts = useMemo(() => {
    const registrations = league?.playerRegistrations || [];
    return {
      total: registrations.length,
      pending: registrations.filter((item) => item.status === "PENDING").length,
      approved: registrations.filter((item) => item.status === "APPROVED").length,
      assigned: registrations.filter((item) => item.team).length,
    };
  }, [league]);

  const updateLeagueRegistration = async (playerRegistrationStatus: "OPEN" | "CLOSED") => {
    setBusyKey("league-registration");
    setError("");
    try {
      const res = await fetch(`/api/leagues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerRegistrationStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update player registration state");
        return;
      }
      setLeague((current) =>
        current
          ? {
              ...current,
              playerRegistrationStatus: data.league.playerRegistrationStatus,
            }
          : current
      );
    } catch {
      setError("Failed to update player registration state");
    } finally {
      setBusyKey(null);
    }
  };

  const updateRegistrationStatus = async (playerId: string, status: RegistrationStatus) => {
    setBusyKey(`status-${playerId}-${status}`);
    setError("");
    try {
      const res = await fetch(`/api/leagues/${id}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update player registration");
        return;
      }
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
      setError("Failed to update player registration");
    } finally {
      setBusyKey(null);
    }
  };

  const assignTeam = async (playerId: string, teamId: string) => {
    setBusyKey(`assign-${playerId}`);
    setError("");
    try {
      const res = await fetch(`/api/leagues/${id}/players/${playerId}/assign-team`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: teamId || null,
          status: teamId ? "APPROVED" : "PENDING",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to assign player to team");
        return;
      }
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
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-72 rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!league) {
    return <div className="rounded-xl border bg-white p-6 text-sm text-red-600">{error || "League not found"}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="section-banner rounded-[2rem] px-5 py-6 text-white sm:px-6 sm:py-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href={`/admin/leagues/${id}`} className="text-sm text-[#c8c8b0] hover:text-white">
              ← {league.name}
            </Link>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Player Management</h1>
            <p className="mt-2 text-sm text-[#d6d9df]">
              {league.parentLeague ? `${league.parentLeague.name} · ` : ""}
              {league.season} {league.year} season squad control, approvals, and assignments.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={league.playerRegistrationStatus === "OPEN" ? "success" : "outline"}
              size="sm"
              loading={busyKey === "league-registration" && league.playerRegistrationStatus !== "OPEN"}
              onClick={() => updateLeagueRegistration("OPEN")}
            >
              Open Player Registration
            </Button>
            <Button
              variant={league.playerRegistrationStatus === "CLOSED" ? "danger" : "outline"}
              size="sm"
              loading={busyKey === "league-registration" && league.playerRegistrationStatus !== "CLOSED"}
              onClick={() => updateLeagueRegistration("CLOSED")}
            >
              Close Player Registration
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-[#c8c8b0]">
          <span>Player registration: {league.playerRegistrationStatus}</span>
          <span>
            Window: {league.registrationOpenDate ? new Date(league.registrationOpenDate).toLocaleDateString() : "Manual"} to{" "}
            {league.registrationCloseDate ? new Date(league.registrationCloseDate).toLocaleDateString() : "Manual"}
          </span>
          <span>Approved teams available: {approvedTeams.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Registrations", value: counts.total },
          { label: "Pending Review", value: counts.pending },
          { label: "Approved", value: counts.approved },
          { label: "Assigned to Teams", value: counts.assigned },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-white p-4">
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            <div className="text-sm text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-bold text-gray-900">Season Player Pool</h2>
            <p className="text-sm text-gray-500">
              Approve registrations, assign players to approved teams, and keep each season squad scoped to this league.
            </p>
          </div>
        </div>

        {league.playerRegistrations.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            No player registrations yet for this season.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Player</th>
                  <th className="px-4 py-3 text-left">Season Role</th>
                  <th className="px-4 py-3 text-left">Current Team</th>
                  <th className="px-4 py-3 text-left">Assign Team</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {league.playerRegistrations.map((registration) => (
                  <tr key={registration.id} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {registration.player.user.profileImage ? (
                          <img
                            src={registration.player.user.profileImage}
                            alt={registration.player.user.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--card-muted)] text-sm font-bold text-[color:var(--primary-dark)]">
                            {registration.player.user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{registration.player.user.name}</div>
                          <div className="text-xs text-gray-500">{registration.player.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{registration.player.role.replaceAll("_", " ")}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {registration.team?.name || "Unassigned for this season"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Base team: {registration.player.team?.name || "None"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={registration.team?.id || ""}
                        disabled={busyKey === `assign-${registration.player.id}`}
                        onChange={(event) => assignTeam(registration.player.id, event.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {approvedTeams.map((team) => (
                          <option key={team.team.id} value={team.team.id}>
                            {team.team.name} ({team.team.shortName})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[registration.status]}`}>
                        {registration.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          loading={busyKey === `status-${registration.player.id}-APPROVED`}
                          onClick={() => updateRegistrationStatus(registration.player.id, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={busyKey === `status-${registration.player.id}-WAITLISTED`}
                          onClick={() => updateRegistrationStatus(registration.player.id, "WAITLISTED")}
                        >
                          Waitlist
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={busyKey === `status-${registration.player.id}-REJECTED`}
                          onClick={() => updateRegistrationStatus(registration.player.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                      </div>
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
