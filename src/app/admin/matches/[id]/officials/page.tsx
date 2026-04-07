"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { Trash2, UserCheck } from "lucide-react";

export const dynamic = 'force-dynamic';

const OFFICIAL_ROLES = [
  "On-field Umpire 1",
  "On-field Umpire 2",
  "Third Umpire",
  "Match Referee",
  "Reserve Umpire",
  "Scorer",
];

const roleIcon: Record<string, string> = {
  "On-field Umpire 1": "⚖️",
  "On-field Umpire 2": "⚖️",
  "Third Umpire": "📺",
  "Match Referee": "📋",
  "Reserve Umpire": "⚖️",
  "Scorer": "📝",
};

export default function MatchOfficialsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [officials, setOfficials] = useState<any[]>([]);
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [role, setRole] = useState("On-field Umpire 1");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [linkedUser, setLinkedUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/matches/${id}`)
      .then((r) => r.json())
      .then((d) => setMatch(d.match));
    fetchOfficials();
  }, [id]);

  const fetchOfficials = async () => {
    const res = await fetch(`/api/matches/${id}/officials`);
    const data = await res.json();
    setOfficials(data.officials || []);
    setLoading(false);
  };

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) { setUserResults([]); return; }
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      // Search returns players, but we want users — re-query directly
    }
    // Direct user search
    const res2 = await fetch(`/api/users?search=${encodeURIComponent(q)}&take=8`);
    if (res2.ok) {
      const data2 = await res2.json();
      setUserResults(data2.users || []);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 280);
    return () => clearTimeout(t);
  }, [userSearch, searchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await fetch(`/api/matches/${id}/officials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, userId: linkedUser?.id || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ text: "Official added.", ok: true });
      setName("");
      setLinkedUser(null);
      setUserSearch("");
      fetchOfficials();
    } else {
      setMessage({ text: data.error || "Failed to add official", ok: false });
    }
    setSubmitting(false);
  };

  const handleRemove = async (officialId: string) => {
    setRemoving(officialId);
    const res = await fetch(`/api/matches/${id}/officials`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ officialId }),
    });
    if (res.ok) fetchOfficials();
    setRemoving(null);
  };

  const selectUser = (u: any) => {
    setLinkedUser({ id: u.id, name: u.name, email: u.email });
    setName(u.name);
    setUserSearch("");
    setUserResults([]);
  };

  const inputClass = "w-full border border-white/10 bg-[#001c3a] px-3 py-2.5 text-sm text-white placeholder:text-[#9a8569]/50 focus:border-[#4ae183] focus:outline-none";

  return (
    <div className="space-y-6 text-[#d4e3ff]">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/matches" className="text-[10px] font-black uppercase tracking-[0.18em] text-[#4ae183] hover:underline">
          ← Matches
        </Link>
        {match && (
          <>
            <span className="text-[#9a8569]">/</span>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
              {match.homeTeam?.shortName} vs {match.awayTeam?.shortName}
            </span>
          </>
        )}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9a8569]">Match Management</p>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">Match Officials</h1>
        {match && (
          <p className="mt-1 text-sm text-[#9a8569]">
            {match.homeTeam?.name} vs {match.awayTeam?.name}
            {match.venue ? ` — ${match.venue.name}, ${match.venue.city}` : ""}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add form */}
        <div className="border border-white/10 bg-[#102433]">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">Add Official</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {/* Role */}
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#9a8569]">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass}
              >
                {OFFICIAL_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Link to platform user (optional) */}
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#9a8569]">
                Link platform user <span className="text-[#9a8569]/60">(optional)</span>
              </label>
              {linkedUser ? (
                <div className="flex items-center justify-between border border-[#4ae183]/30 bg-[#4ae183]/10 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[#4ae183]" />
                    <div>
                      <p className="text-sm font-bold text-white">{linkedUser.name}</p>
                      <p className="text-[10px] text-[#9a8569]">{linkedUser.email}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setLinkedUser(null); setName(""); }}
                    className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb4ab] hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name…"
                    className={inputClass}
                  />
                  {userResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 border border-white/10 bg-[#071a31] shadow-xl">
                      {userResults.map((u: any) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => selectUser(u)}
                          className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left hover:bg-[#0b2747] last:border-b-0"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#1b3656] text-sm font-bold text-white">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{u.name}</p>
                            <p className="text-[10px] text-[#9a8569]">{u.email} · {u.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#9a8569]">Official Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Smith"
                required
                className={inputClass}
              />
            </div>

            {message && (
              <p className={`text-sm font-bold ${message.ok ? "text-[#4ae183]" : "text-[#ffb4ab]"}`}>
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !name}
              className="w-full bg-[#4ae183] py-2.5 text-sm font-black uppercase tracking-[0.18em] text-[#002613] transition hover:bg-white disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add Official"}
            </button>
          </form>
        </div>

        {/* Officials list */}
        <div className="border border-white/10 bg-[#102433]">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">
              Current Officials <span className="text-[#9a8569]">({officials.length})</span>
            </p>
          </div>

          {loading ? (
            <p className="px-5 py-8 text-sm text-[#9a8569]">Loading…</p>
          ) : officials.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[#9a8569]">No officials added yet.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {officials.map((official) => (
                <div key={official.id} className="flex items-center gap-3 px-5 py-4">
                  <span className="text-xl shrink-0">{roleIcon[official.role] ?? "👤"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{official.name}</p>
                      {official.user && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#4ae183]">
                          <UserCheck className="h-3 w-3" />
                          Linked
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9a8569]">{official.role}</p>
                    {official.user && (
                      <p className="text-[10px] text-[#9a8569]">{official.user.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(official.id)}
                    disabled={removing === official.id}
                    className="shrink-0 p-2 text-[#9a8569] transition hover:text-[#ffb4ab] disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
