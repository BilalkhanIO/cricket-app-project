"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";

const AWARD_TYPES = [
  "MAN_OF_MATCH",
  "BEST_BATSMAN",
  "BEST_BOWLER",
  "PLAYER_OF_TOURNAMENT",
  "BEST_FIELDER",
  "EMERGING_PLAYER",
];

interface PlayerOption {
  id: string;
  name: string;
  team: string;
}

interface AwardItem {
  id: string;
  awardType: string;
  description: string | null;
  player: null | {
    id: string;
    user: {
      name: string;
    };
  };
}

export default function AwardListClient({
  leagueId,
  awards,
  players,
}: {
  leagueId: string;
  awards: AwardItem[];
  players: PlayerOption[];
}) {
  const [items, setItems] = useState(awards);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    awardType: "",
    playerId: "",
    description: "",
  });

  const beginEdit = (award: AwardItem) => {
    setEditingId(award.id);
    setMessage("");
    setForm({
      awardType: award.awardType,
      playerId: award.player?.id || "",
      description: award.description || "",
    });
  };

  const handleSave = async (awardId: string) => {
    setSavingId(awardId);
    setMessage("");

    try {
      const res = await fetch(`/api/leagues/${leagueId}/awards/${awardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awardType: form.awardType,
          playerId: form.playerId || null,
          description: form.description || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to update award");
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === awardId
            ? {
                ...item,
                awardType: data.award.awardType,
                description: data.award.description,
                player: data.award.player,
              }
            : item
        )
      );
      setEditingId(null);
      setMessage("Award updated successfully.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (awardId: string) => {
    if (!window.confirm("Delete this award?")) return;

    setDeletingId(awardId);
    setMessage("");
    try {
      const res = await fetch(`/api/leagues/${leagueId}/awards/${awardId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data.error || "Failed to delete award");
        return;
      }

      setItems((current) => current.filter((item) => item.id !== awardId));
      if (editingId === awardId) setEditingId(null);
      setMessage("Award deleted successfully.");
    } finally {
      setDeletingId(null);
    }
  };

  if (items.length === 0) {
    return <p className="text-center py-8 text-gray-400 text-sm">No awards created yet</p>;
  }

  return (
    <div>
      {items.map((award) => {
        const isEditing = editingId === award.id;
        return (
          <div key={award.id} className="border-b border-gray-50 px-4 py-4 last:border-0">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Award Type</label>
                  <select
                    value={form.awardType}
                    onChange={(e) => setForm((prev) => ({ ...prev, awardType: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[color:var(--primary)]"
                  >
                    {AWARD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Player</label>
                  <select
                    value={form.playerId}
                    onChange={(e) => setForm((prev) => ({ ...prev, playerId: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[color:var(--primary)]"
                  >
                    <option value="">No player selected</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.team})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[color:var(--primary)]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="primary" onClick={() => handleSave(award.id)} disabled={savingId === award.id || !form.awardType}>
                    {savingId === award.id ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-xl">
                  {award.awardType === "MAN_OF_MATCH" ? "🏅" :
                   award.awardType === "BEST_BATSMAN" ? "🏏" :
                   award.awardType === "BEST_BOWLER" ? "🎳" :
                   award.awardType === "PLAYER_OF_TOURNAMENT" ? "🏆" : "⭐"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{award.awardType.replace(/_/g, " ")}</p>
                  {award.player && <p className="text-xs text-gray-500">{award.player.user.name}</p>}
                  {award.description && <p className="mt-0.5 text-xs text-gray-400">{award.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => beginEdit(award)}>
                    Edit
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => handleDelete(award.id)} disabled={deletingId === award.id} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                    {deletingId === award.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {message && <p className={`px-4 pt-3 text-sm ${message.includes("successfully") ? "text-[color:var(--primary)]" : "text-red-600"}`}>{message}</p>}
    </div>
  );
}
