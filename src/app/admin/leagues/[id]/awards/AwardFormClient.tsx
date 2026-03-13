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

interface Player {
  id: string;
  name: string;
  team: string;
}

export default function AwardFormClient({ leagueId, players }: { leagueId: string; players: Player[] }) {
  const [awardType, setAwardType] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/leagues/${leagueId}/awards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awardType, playerId: playerId || null, description }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Award created successfully!");
        setAwardType("");
        setPlayerId("");
        setDescription("");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage(data.error || "Failed to create award");
      }
    } catch {
      setMessage("An error occurred");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Award Type</label>
        <select
          value={awardType}
          onChange={(e) => setAwardType(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        >
          <option value="">Select award type...</option>
          {AWARD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Player</label>
        <select
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">Select player...</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.team})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Optional description..."
        />
      </div>

      {message && (
        <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <Button type="submit" variant="primary" disabled={loading || !awardType} fullWidth>
        {loading ? "Creating..." : "Create Award"}
      </Button>
    </form>
  );
}
