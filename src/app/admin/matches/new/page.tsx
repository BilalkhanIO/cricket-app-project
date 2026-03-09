"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function NewMatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leagues, setLeagues] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [scorers, setScorers] = useState<any[]>([]);

  const [form, setForm] = useState({
    leagueId: searchParams.get("leagueId") || "",
    homeTeamId: "",
    awayTeamId: "",
    venueId: "",
    scorerId: "",
    matchDate: "",
    matchFormat: "T20",
    overs: 20,
    notes: "",
  });

  useEffect(() => {
    fetch("/api/leagues").then(r => r.json()).then(d => setLeagues(d.leagues || []));
    fetch("/api/venues").then(r => r.json()).then(d => setVenues(d.venues || []));

    fetch("/api/users?role=SCORER").then(r => r.json()).then(d => setScorers(d.users || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.leagueId) {
      fetch(`/api/teams?leagueId=${form.leagueId}`)
        .then((r) => r.json())
        .then((d) => setTeams(d.teams || []));
    }
  }, [form.leagueId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.homeTeamId === form.awayTeamId) {
      setError("Home and away team cannot be the same");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        venueId: form.venueId || null,
        scorerId: form.scorerId || null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to schedule match");
      return;
    }

    router.push(`/admin/leagues/${form.leagueId}`);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Schedule Match</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader><h2 className="font-semibold">Match Details</h2></CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="League *"
              name="leagueId"
              value={form.leagueId}
              onChange={handleChange}
              required
              options={[
                { value: "", label: "Select league..." },
                ...leagues.map((l) => ({ value: l.id, label: l.name })),
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Home Team *"
                name="homeTeamId"
                value={form.homeTeamId}
                onChange={handleChange}
                required
                options={[
                  { value: "", label: "Select team..." },
                  ...teams.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
              <Select
                label="Away Team *"
                name="awayTeamId"
                value={form.awayTeamId}
                onChange={handleChange}
                required
                options={[
                  { value: "", label: "Select team..." },
                  ...teams.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
            </div>
            <Input label="Match Date & Time *" name="matchDate" type="datetime-local" value={form.matchDate} onChange={handleChange} required />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Match Format"
                name="matchFormat"
                value={form.matchFormat}
                onChange={handleChange}
                options={[
                  { value: "T20", label: "T20" },
                  { value: "T10", label: "T10" },
                  { value: "ONE_DAY", label: "One Day" },
                  { value: "CUSTOM", label: "Custom" },
                ]}
              />
              <Input label="Overs" name="overs" type="number" value={form.overs} onChange={handleChange} min={5} max={50} />
            </div>
            <Select
              label="Venue"
              name="venueId"
              value={form.venueId}
              onChange={handleChange}
              options={[
                { value: "", label: "Select venue..." },
                ...venues.map((v) => ({ value: v.id, label: `${v.name}, ${v.city}` })),
              ]}
            />
            <Select
              label="Scorer"
              name="scorerId"
              value={form.scorerId}
              onChange={handleChange}
              options={[
                { value: "", label: "Select scorer..." },
                ...scorers.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </CardBody>
        </Card>

        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading} size="lg">Schedule Match</Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
