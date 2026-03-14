"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

type Status = "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED";

interface TeamReg {
  id: string;
  status: Status;
  registrationFeeStatus: string;
  approvalNotes: string | null;
  registeredAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  team: {
    id: string;
    name: string;
    shortName: string;
    jerseyColor: string | null;
    city: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    sponsorName: string | null;
    manager: { name: string; email: string };
    _count: { players: number };
  };
}

const STATUS_COLORS: Record<Status, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-[#D6E6F2] text-[#1B3A5C]",
  REJECTED: "bg-red-100 text-red-700",
  WAITLISTED: "bg-gray-100 text-gray-700",
};

const FEE_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  PAID: "bg-[#D6E6F2] text-[#769FCD]",
  WAIVED: "bg-gray-100 text-gray-600",
};

export default function TeamRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [registrations, setRegistrations] = useState<TeamReg[]>([]);
  const [loading, setLoading] = useState(true);
  const [leagueName, setLeagueName] = useState("");
  const [filter, setFilter] = useState<"ALL" | Status>("ALL");
  const [processing, setProcessing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/leagues/${id}`)
      .then(r => r.json())
      .then(data => {
        setLeagueName(data.league?.name || "");
        setRegistrations(data.league?.teams || []);
        setLoading(false);
      });
  }, [id]);

  const updateStatus = async (teamLeagueId: string, teamId: string, action: string) => {
    setProcessing(teamLeagueId);
    try {
      const res = await fetch(`/api/leagues/${id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          action,
          approvalNotes: notes[teamLeagueId] || "",
        }),
      });
      if (res.ok) {
        const newStatus: Status =
          action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "WAITLISTED";
        setRegistrations(prev =>
          prev.map(r =>
            r.id === teamLeagueId
              ? { ...r, status: newStatus, approvalNotes: notes[teamLeagueId] || r.approvalNotes }
              : r
          )
        );
      }
    } finally {
      setProcessing(null);
    }
  };

  const bulkApprove = async () => {
    const pending = registrations.filter(r => r.status === "PENDING");
    for (const reg of pending) {
      await updateStatus(reg.id, reg.team.id, "approve");
    }
  };

  const filtered = filter === "ALL" ? registrations : registrations.filter(r => r.status === filter);

  const counts = {
    ALL: registrations.length,
    PENDING: registrations.filter(r => r.status === "PENDING").length,
    APPROVED: registrations.filter(r => r.status === "APPROVED").length,
    REJECTED: registrations.filter(r => r.status === "REJECTED").length,
    WAITLISTED: registrations.filter(r => r.status === "WAITLISTED").length,
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/admin/leagues/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← {leagueName}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Team Registrations</h1>
        </div>
        <div className="flex gap-2">
          {counts.PENDING > 0 && (
            <button
              onClick={bulkApprove}
              disabled={!!processing}
              className="px-4 py-2 bg-[#769FCD] text-white rounded-lg text-sm font-medium hover:bg-[#1B3A5C] disabled:opacity-50 transition-colors"
            >
              Approve All Pending ({counts.PENDING})
            </button>
          )}
          <Link
            href={`/admin/leagues/${id}/fixtures`}
            className="px-4 py-2 bg-[#1B3A5C] text-white rounded-lg text-sm font-medium hover:bg-[#2D5484] transition-colors"
          >
            Generate Fixtures →
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["PENDING", "APPROVED", "WAITLISTED", "REJECTED"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? "ALL" : s)}
            className={`rounded-xl border-2 p-4 text-left transition-colors ${
              filter === s ? "border-[#769FCD] bg-[#F7FBFC]" : "border-transparent bg-white hover:border-gray-200"
            }`}
          >
            <div className="text-2xl font-bold text-gray-900">{counts[s]}</div>
            <div className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${STATUS_COLORS[s]}`}>
              {s}
            </div>
          </button>
        ))}
      </div>

      {/* Registration List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">No registrations in this category.</div>
        )}
        {filtered.map((reg) => (
          <div
            key={reg.id}
            className={`bg-white rounded-xl border-2 overflow-hidden transition-colors ${
              reg.status === "PENDING" ? "border-yellow-200" :
              reg.status === "APPROVED" ? "border-[#B9D7EA]" :
              reg.status === "REJECTED" ? "border-red-100" :
              "border-gray-200"
            }`}
          >
            {/* Main Row */}
            <div className="px-5 py-4 flex flex-wrap items-center gap-4">
              {/* Team color dot + name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: reg.team.jerseyColor || "#769FCD" }}
                >
                  {reg.team.shortName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{reg.team.name}</span>
                    <span className="text-xs text-gray-500">({reg.team.shortName})</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[reg.status]}`}>
                      {reg.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${FEE_COLORS[reg.team.contactEmail ? "PAID" : "PENDING"]}`}>
                      Fee: {reg.registrationFeeStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Manager: {reg.team.manager.name} · {reg.team.manager.email}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-center text-sm flex-shrink-0">
                <div>
                  <div className="font-bold text-gray-900">{reg.team._count.players}</div>
                  <div className="text-xs text-gray-500">Players</div>
                </div>
                {reg.team.city && (
                  <div>
                    <div className="font-medium text-gray-700 text-xs">{reg.team.city}</div>
                    <div className="text-xs text-gray-400">City</div>
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  Registered {new Date(reg.registeredAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                >
                  {expandedId === reg.id ? "▲ Less" : "▼ Details"}
                </button>
                {reg.status !== "APPROVED" && (
                  <button
                    onClick={() => updateStatus(reg.id, reg.team.id, "approve")}
                    disabled={processing === reg.id}
                    className="px-3 py-1.5 bg-[#769FCD] text-white rounded-lg text-xs font-medium hover:bg-[#1B3A5C] disabled:opacity-50 transition-colors"
                  >
                    {processing === reg.id ? "..." : "Approve"}
                  </button>
                )}
                {reg.status === "PENDING" && (
                  <button
                    onClick={() => updateStatus(reg.id, reg.team.id, "waitlist")}
                    disabled={processing === reg.id}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Waitlist
                  </button>
                )}
                {reg.status !== "REJECTED" && reg.status !== "APPROVED" && (
                  <button
                    onClick={() => updateStatus(reg.id, reg.team.id, "reject")}
                    disabled={processing === reg.id}
                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === reg.id && (
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Contact</p>
                    <p>{reg.team.contactEmail || "—"}</p>
                    <p>{reg.team.contactPhone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Sponsor</p>
                    <p>{reg.team.sponsorName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Timeline</p>
                    <p className="text-xs text-gray-600">Registered: {new Date(reg.registeredAt).toLocaleString("en-GB")}</p>
                    {reg.approvedAt && <p className="text-xs text-[#769FCD]">Approved: {new Date(reg.approvedAt).toLocaleString("en-GB")}</p>}
                    {reg.rejectedAt && <p className="text-xs text-red-600">Rejected: {new Date(reg.rejectedAt).toLocaleString("en-GB")}</p>}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Admin Notes</p>
                  {reg.approvalNotes && (
                    <p className="text-xs text-gray-600 mb-2 italic">"{reg.approvalNotes}"</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a note (optional)..."
                      value={notes[reg.id] || ""}
                      onChange={(e) => setNotes(prev => ({ ...prev, [reg.id]: e.target.value }))}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#769FCD]"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/teams/${reg.team.id}`}
                    className="text-xs text-[#769FCD] hover:underline"
                  >
                    View Team Profile →
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
