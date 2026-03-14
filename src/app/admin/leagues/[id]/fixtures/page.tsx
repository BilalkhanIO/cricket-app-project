"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  shortName: string;
  jerseyColor: string | null;
}

interface Venue {
  id: string;
  name: string;
  city: string;
}

interface GeneratedMatch {
  id: string;
  matchNumber: number | null;
  matchDate: string;
  homeTeam: { name: string; shortName: string };
  awayTeam: { name: string; shortName: string };
  status: string;
}

const FIXTURE_TYPES = [
  { value: "ROUND_ROBIN", label: "Round Robin", desc: "Every team plays against all others once" },
  { value: "DOUBLE_ROUND_ROBIN", label: "Double Round Robin", desc: "Home & away — each pair plays twice" },
  { value: "KNOCKOUT", label: "Knockout", desc: "Single elimination bracket" },
];

export default function FixtureGeneratorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [teams, setTeams] = useState<Team[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [existingMatches, setExistingMatches] = useState<GeneratedMatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [fixtureType, setFixtureType] = useState("ROUND_ROBIN");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [venueId, setVenueId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [matchTimeHour, setMatchTimeHour] = useState(14);
  const [matchTimeMinute, setMatchTimeMinute] = useState(0);
  const [daysBetween, setDaysBetween] = useState(2);
  const [stage, setStage] = useState("GROUP");

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ created: number; matches: GeneratedMatch[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/leagues/${id}`).then((r) => r.json()),
      fetch("/api/venues").then((r) => r.json()),
      fetch(`/api/matches?leagueId=${id}`).then((r) => r.json()),
    ]).then(([leagueData, venueData, matchData]) => {
      const approvedTeams = (leagueData.league?.teams || [])
        .filter((tl: any) => tl.status === "APPROVED")
        .map((tl: any) => tl.team);
      setTeams(approvedTeams);
      setSelectedTeams(approvedTeams.map((t: Team) => t.id));
      setVenues(venueData.venues || []);
      setExistingMatches(matchData.matches || []);
      setLoading(false);
    });
  }, [id]);

  const toggleTeam = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((t) => t !== teamId) : [...prev, teamId]
    );
  };

  // Preview: calculate how many matches will be generated
  const previewCount = (() => {
    const n = selectedTeams.length;
    if (n < 2) return 0;
    if (fixtureType === "ROUND_ROBIN") return (n * (n - 1)) / 2;
    if (fixtureType === "DOUBLE_ROUND_ROBIN") return n * (n - 1);
    if (fixtureType === "KNOCKOUT") return Math.floor(n / 2);
    return 0;
  })();

  const handleGenerate = async () => {
    if (!startDate) { setError("Please set a start date"); return; }
    if (selectedTeams.length < 2) { setError("Select at least 2 teams"); return; }
    setError("");
    setGenerating(true);
    try {
      const res = await fetch(`/api/leagues/${id}/fixtures/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: fixtureType,
          teamIds: selectedTeams,
          venueId: venueId || null,
          startDate,
          matchTimeHour,
          matchTimeMinute,
          daysBetweenMatches: daysBetween,
          stage,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to generate"); return; }
      setResult(data);
      setExistingMatches((prev) => [...prev, ...data.matches]);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/leagues/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← League
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Fixture Generator</h1>
      </div>

      {result ? (
        /* Success State */
        <div className="space-y-4">
          <div className="bg-[#F7FBFC] border border-[#B9D7EA] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#769FCD] rounded-full flex items-center justify-center text-white font-bold text-lg">
                ✓
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{result.created} fixtures generated!</h2>
                <p className="text-sm text-gray-500">All matches have been scheduled.</p>
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  Generate More
                </button>
                <Link
                  href={`/admin/leagues/${id}`}
                  className="px-4 py-2 bg-[#1B3A5C] text-white rounded-lg text-sm hover:bg-[#2D5484]"
                >
                  Back to League
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#B9D7EA]">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">#</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Match</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {result.matches.map((m, i) => (
                    <tr key={m.id} className="border-b border-gray-50">
                      <td className="py-2 px-3 text-gray-400 text-xs">{m.matchNumber || i + 1}</td>
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {new Date(m.matchDate).toLocaleString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Fixture Type */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Tournament Format</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FIXTURE_TYPES.map((ft) => (
                  <label
                    key={ft.value}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                      fixtureType === ft.value
                        ? "border-[#769FCD] bg-[#F7FBFC]"
                        : "border-gray-200 hover:border-[#B9D7EA]"
                    }`}
                  >
                    <input
                      type="radio"
                      value={ft.value}
                      checked={fixtureType === ft.value}
                      onChange={() => setFixtureType(ft.value)}
                      className="sr-only"
                    />
                    <p className="font-semibold text-gray-900 text-sm">{ft.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{ft.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Teams */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">
                  Select Teams
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({selectedTeams.length} of {teams.length} selected)
                  </span>
                </h2>
                <button
                  onClick={() =>
                    setSelectedTeams(
                      selectedTeams.length === teams.length ? [] : teams.map((t) => t.id)
                    )
                  }
                  className="text-xs text-[#769FCD] hover:underline"
                >
                  {selectedTeams.length === teams.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              {teams.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No approved teams. Approve teams first from the{" "}
                  <Link href={`/admin/leagues/${id}/teams`} className="text-[#769FCD] hover:underline">
                    teams registration page
                  </Link>.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {teams.map((team) => (
                    <label
                      key={team.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTeams.includes(team.id)
                          ? "border-[#769FCD] bg-[#F7FBFC]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(team.id)}
                        onChange={() => toggleTeam(team.id)}
                        className="accent-[#769FCD]"
                      />
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: team.jerseyColor || "#769FCD" }}
                      />
                      <span className="text-sm font-medium text-gray-900 truncate">{team.shortName}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Schedule Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#769FCD]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Match Time</label>
                  <div className="flex gap-2">
                    <select
                      value={matchTimeHour}
                      onChange={(e) => setMatchTimeHour(Number(e.target.value))}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#769FCD]"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                      ))}
                    </select>
                    <select
                      value={matchTimeMinute}
                      onChange={(e) => setMatchTimeMinute(Number(e.target.value))}
                      className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#769FCD]"
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Days Between Matches</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={daysBetween}
                    onChange={(e) => setDaysBetween(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#769FCD]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Default Venue (optional)</label>
                  <select
                    value={venueId}
                    onChange={(e) => setVenueId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#769FCD]"
                  >
                    <option value="">No default venue</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} — {v.city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stage Label</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#769FCD]"
                  >
                    {["GROUP", "SUPER_4", "QUARTER_FINAL", "SEMI_FINAL", "FINAL", "PLATE"].map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || selectedTeams.length < 2 || !startDate}
              className="w-full bg-[#1B3A5C] hover:bg-[#2D5484] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {generating ? "Generating..." : `Generate ${previewCount} Fixture${previewCount !== 1 ? "s" : ""}`}
            </button>
          </div>

          {/* Preview / Existing Matches Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Preview</h2>
              <p className="text-sm text-gray-500 mb-4">Matches that will be created</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Format</span>
                  <span className="font-medium">{fixtureType.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Teams</span>
                  <span className="font-medium">{selectedTeams.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Matches to generate</span>
                  <span className="font-bold text-[#769FCD] text-base">{previewCount}</span>
                </div>
                {startDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">First match</span>
                    <span className="font-medium">
                      {new Date(startDate).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {startDate && previewCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last match approx.</span>
                    <span className="font-medium">
                      {(() => {
                        const d = new Date(startDate);
                        d.setDate(d.getDate() + (previewCount - 1) * daysBetween);
                        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {existingMatches.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-3">
                  Existing Fixtures
                  <span className="ml-2 text-sm font-normal text-gray-500">({existingMatches.length})</span>
                </h2>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {existingMatches.slice(0, 20).map((m) => (
                    <div key={m.id} className="flex justify-between text-xs py-1 border-b border-gray-50">
                      <span className="font-medium text-gray-800">
                        {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                      </span>
                      <span className="text-gray-400">
                        {new Date(m.matchDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                  ))}
                  {existingMatches.length > 20 && (
                    <p className="text-xs text-gray-400 text-center">+{existingMatches.length - 20} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
