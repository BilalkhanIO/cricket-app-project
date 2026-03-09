"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function NewLeaguePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    season: new Date().getFullYear().toString(),
    year: new Date().getFullYear(),
    startDate: "",
    endDate: "",
    tournamentType: "ROUND_ROBIN",
    matchFormat: "T20",
    maxTeams: 8,
    oversPerInnings: 20,
    powerplayOvers: 6,
    pointsPerWin: 2,
    pointsPerTie: 1,
    pointsPerNoResult: 1,
    squadSizeLimit: 15,
    playingXISize: 11,
    superOverEnabled: true,
    status: "REGISTRATION",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create league");
      return;
    }

    router.push(`/admin/leagues/${data.league.id}`);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Create New League</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Basic Information</h2></CardHeader>
          <CardBody className="space-y-4">
            <Input label="League Name *" name="name" value={form.name} onChange={handleChange} placeholder="Pakistan Super League 2024" required />
            <Textarea label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Brief description of the league" rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Season" name="season" value={form.season} onChange={handleChange} placeholder="2024" />
              <Input label="Year" name="year" type="number" value={form.year} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date *" name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
              <Input label="End Date *" name="endDate" type="date" value={form.endDate} onChange={handleChange} required />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Tournament Settings</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select label="Tournament Type" name="tournamentType" value={form.tournamentType} onChange={handleChange}
                options={[
                  { value: "ROUND_ROBIN", label: "Round Robin" },
                  { value: "KNOCKOUT", label: "Knockout" },
                  { value: "GROUP_KNOCKOUT", label: "Group + Knockout" },
                  { value: "DOUBLE_ROUND_ROBIN", label: "Double Round Robin" },
                  { value: "CUSTOM", label: "Custom" },
                ]}
              />
              <Select label="Match Format" name="matchFormat" value={form.matchFormat} onChange={handleChange}
                options={[
                  { value: "T20", label: "T20" },
                  { value: "T10", label: "T10" },
                  { value: "ONE_DAY", label: "One Day" },
                  { value: "CUSTOM", label: "Custom" },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input label="Max Teams" name="maxTeams" type="number" value={form.maxTeams} onChange={handleChange} min={2} max={32} />
              <Input label="Overs Per Innings" name="oversPerInnings" type="number" value={form.oversPerInnings} onChange={handleChange} min={5} max={50} />
              <Input label="Powerplay Overs" name="powerplayOvers" type="number" value={form.powerplayOvers} onChange={handleChange} min={1} max={20} />
              <Input label="Squad Size Limit" name="squadSizeLimit" type="number" value={form.squadSizeLimit} onChange={handleChange} />
              <Input label="Playing XI Size" name="playingXISize" type="number" value={form.playingXISize} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Points/Win" name="pointsPerWin" type="number" value={form.pointsPerWin} onChange={handleChange} min={1} max={5} />
              <Input label="Points/Tie" name="pointsPerTie" type="number" value={form.pointsPerTie} onChange={handleChange} min={0} max={3} />
              <Input label="Points/No Result" name="pointsPerNoResult" type="number" value={form.pointsPerNoResult} onChange={handleChange} min={0} max={3} />
            </div>
            <Select label="Status" name="status" value={form.status} onChange={handleChange}
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "REGISTRATION", label: "Open for Registration" },
                { value: "ACTIVE", label: "Active" },
              ]}
            />
          </CardBody>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={loading} size="lg">Create League</Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
