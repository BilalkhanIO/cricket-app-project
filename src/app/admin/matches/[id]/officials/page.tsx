"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export const dynamic = 'force-dynamic';

const OFFICIAL_ROLES = [
  "On-field Umpire 1",
  "On-field Umpire 2",
  "Third Umpire",
  "Match Referee",
  "Reserve Umpire",
  "Scorer",
];

export default function MatchOfficialsPage({ params }: { params: { id: string } }) {
  const [officials, setOfficials] = useState<any[]>([]);
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [role, setRole] = useState("On-field Umpire 1");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/matches/${params.id}`)
      .then((r) => r.json())
      .then((d) => setMatch(d.match));
    fetchOfficials();
  }, [params.id]);

  const fetchOfficials = async () => {
    const res = await fetch(`/api/matches/${params.id}/officials`);
    const data = await res.json();
    setOfficials(data.officials || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const res = await fetch(`/api/matches/${params.id}/officials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Official added successfully!");
      setName("");
      fetchOfficials();
    } else {
      setMessage(data.error || "Failed to add official");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/matches" className="text-gray-500 text-sm hover:text-gray-700">
          ← Matches
        </Link>
        {match && (
          <Link href={`/matches/${params.id}`} className="text-gray-500 text-sm hover:text-gray-700">
            {match.homeTeam?.shortName} vs {match.awayTeam?.shortName}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-gray-900">Match Officials</h1>
      </div>

      {match && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>{match.homeTeam?.name} vs {match.awayTeam?.name}</strong>
          {match.venue && ` — ${match.venue.name}, ${match.venue.city}`}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Official Form */}
        <Card>
          <CardHeader>
            <h2 className="font-bold text-gray-900">Add Official</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {OFFICIAL_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Official Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. John Smith"
                  required
                />
              </div>

              {message && (
                <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
                  {message}
                </p>
              )}

              <Button type="submit" variant="primary" disabled={submitting || !name} fullWidth>
                {submitting ? "Adding..." : "Add Official"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Officials List */}
        <Card>
          <CardHeader>
            <h2 className="font-bold text-gray-900">Current Officials ({officials.length})</h2>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <p className="text-center py-8 text-gray-400 text-sm">Loading...</p>
            ) : officials.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No officials added yet</p>
            ) : (
              officials.map((official) => (
                <div key={official.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{official.name}</p>
                    <p className="text-xs text-gray-500">{official.role}</p>
                  </div>
                  <span className="text-lg">
                    {official.role.includes("Umpire") ? "⚖️" :
                     official.role.includes("Referee") ? "📋" : "📝"}
                  </span>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
