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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scorerId: selected || null }),
      });
      if (res.ok) {
        const scorer = scorers.find((s) => s.id === selected);
        setAssignedName(scorer?.name ?? null);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#769FCD] max-w-[180px] bg-white"
        >
          <option value="">Unassigned</option>
          {scorers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs bg-[#769FCD] text-white px-2.5 py-2 rounded-lg hover:bg-[#1B3A5C] disabled:opacity-50"
        >
          {saving ? "..." : "✓"}
        </button>
        <button
          onClick={() => { setEditing(false); setSelected(currentScorerId || ""); }}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group inline-flex items-center gap-1 text-xs min-h-9"
    >
      {assignedName ? (
        <span className="text-[#1B3A5C] font-medium group-hover:underline">{assignedName}</span>
      ) : (
        <span className="text-gray-400 italic group-hover:text-[#769FCD]">Unassigned</span>
      )}
      <svg className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}
