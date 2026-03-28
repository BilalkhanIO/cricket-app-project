"use client";

import { useState } from "react";

interface Props {
  matchId: string;
  currentScorerId: string | null;
  currentScorerName: string | null;
  scorers: { id: string; name: string; email: string }[];
}

export default function AssignScorerInline({ matchId, currentScorerId, currentScorerName, scorers }: Props) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(currentScorerId || "");
  const [saving, setSaving] = useState(false);
  const [assignedName, setAssignedName] = useState(currentScorerName);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/scorer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scorerId: selected || null }),
      });
      if (res.ok) {
        const scorer = scorers.find((s) => s.id === selected);
        setAssignedName(scorer?.name ?? null);
        setEditing(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to update scorer");
      }
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="text-xs border border-white/10 bg-[#00142b] text-white px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#4ae183] max-w-[190px]"
          >
            <option value="">Unassigned</option>
            {scorers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-[#4ae183] text-[#003919] px-3 py-2 font-bold uppercase tracking-[0.12em] disabled:opacity-50"
          >
            {saving ? "Saving" : "Save"}
          </button>
          <button
            onClick={() => { setEditing(false); setSelected(currentScorerId || ""); setError(null); }}
            className="text-xs text-[#9bb2d1] hover:text-white px-2 py-2 uppercase tracking-[0.12em]"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#ffb4ab]">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group inline-flex items-center gap-1 text-xs min-h-9"
    >
      {assignedName ? (
        <span className="font-medium text-white group-hover:underline">{assignedName}</span>
      ) : (
        <span className="text-[#9bb2d1] italic group-hover:text-[#4ae183]">Unassigned</span>
      )}
      <svg className="w-3 h-3 text-[#9bb2d1] opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}
