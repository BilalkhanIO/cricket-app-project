"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

const roleOptions = [
  { value: "BATSMAN", label: "Batsman" },
  { value: "BOWLER", label: "Bowler" },
  { value: "ALL_ROUNDER", label: "All Rounder" },
  { value: "WICKETKEEPER", label: "Wicketkeeper" },
];

const handOptions = [
  { value: "RIGHT", label: "Right" },
  { value: "LEFT", label: "Left" },
];

const bowlingOptions = [
  { value: "", label: "None / Unknown" },
  { value: "RIGHT_ARM_FAST", label: "Right Arm Fast" },
  { value: "RIGHT_ARM_MEDIUM", label: "Right Arm Medium" },
  { value: "RIGHT_ARM_SPIN", label: "Right Arm Spin" },
  { value: "LEFT_ARM_FAST", label: "Left Arm Fast" },
  { value: "LEFT_ARM_MEDIUM", label: "Left Arm Medium" },
  { value: "LEFT_ARM_SPIN", label: "Left Arm Spin" },
];

const availabilityOptions = [
  { value: "AVAILABLE", label: "Available" },
  { value: "UNAVAILABLE", label: "Unavailable" },
  { value: "INJURED", label: "Injured" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "ON_TOUR", label: "On Tour" },
];

type UserOption = {
  id: string;
  name: string;
  email: string;
};

type TeamOption = {
  id: string;
  name: string;
  shortName: string;
};

export default function NewPlayerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [existingUserIds, setExistingUserIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    userId: "",
    teamId: "",
    role: "BATSMAN",
    battingHand: "RIGHT",
    bowlingType: "",
    jerseyNumber: "",
    age: "",
    medicalStatus: "",
    availabilityStatus: "AVAILABLE",
    photoUrl: "",
    idProofUrl: "",
    isCaptain: false,
    isViceCaptain: false,
    isWicketkeeper: false,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then((res) => res.json()),
      fetch("/api/teams").then((res) => res.json()),
      fetch("/api/players").then((res) => res.json()),
    ])
      .then(([usersData, teamsData, playersData]) => {
        setUsers(usersData.users || []);
        setTeams(teamsData.teams || []);
        setExistingUserIds((playersData.players || []).map((player: any) => player.user.id));
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load player form data");
        setLoading(false);
      });
  }, []);

  const availableUsers = useMemo(
    () => users.filter((user) => !existingUserIds.includes(user.id)),
    [existingUserIds, users]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = "checked" in e.target ? e.target.checked : false;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: form.userId,
        teamId: form.teamId || null,
        role: form.role,
        battingHand: form.battingHand,
        bowlingType: form.bowlingType || null,
        jerseyNumber: form.jerseyNumber ? Number(form.jerseyNumber) : null,
        age: form.age ? Number(form.age) : null,
        medicalStatus: form.medicalStatus || null,
        availabilityStatus: form.availabilityStatus,
        photoUrl: form.photoUrl || null,
        idProofUrl: form.idProofUrl || null,
        isCaptain: form.isCaptain,
        isViceCaptain: form.isViceCaptain,
        isWicketkeeper: form.isWicketkeeper,
      }),
    });
    const data = await res.json();

    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to create player");
      return;
    }

    router.push("/admin/players");
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">Loading player form...</div>;
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/players" className="text-sm text-gray-500 hover:text-gray-700">
          ← Players
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Player</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Player Details</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="User *"
                name="userId"
                value={form.userId}
                onChange={handleChange}
                options={[
                  { value: "", label: availableUsers.length ? "Select a user" : "No available users" },
                  ...availableUsers.map((user) => ({
                    value: user.id,
                    label: `${user.name} (${user.email})`,
                  })),
                ]}
              />
              <Select
                label="Team"
                name="teamId"
                value={form.teamId}
                onChange={handleChange}
                options={[
                  { value: "", label: "No team assigned" },
                  ...teams.map((team) => ({ value: team.id, label: `${team.name} (${team.shortName})` })),
                ]}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select label="Role" name="role" value={form.role} onChange={handleChange} options={roleOptions} />
              <Select label="Batting Hand" name="battingHand" value={form.battingHand} onChange={handleChange} options={handOptions} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Select label="Bowling Type" name="bowlingType" value={form.bowlingType} onChange={handleChange} options={bowlingOptions} />
              <Input label="Jersey Number" name="jerseyNumber" type="number" value={form.jerseyNumber} onChange={handleChange} min={0} max={999} />
              <Input label="Age" name="age" type="number" value={form.age} onChange={handleChange} min={0} max={60} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Photo URL" name="photoUrl" type="url" value={form.photoUrl} onChange={handleChange} />
              <Input label="ID Proof URL" name="idProofUrl" type="url" value={form.idProofUrl} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Availability"
                name="availabilityStatus"
                value={form.availabilityStatus}
                onChange={handleChange}
                options={availabilityOptions}
              />
              <Input label="Medical Status" name="medicalStatus" value={form.medicalStatus} onChange={handleChange} />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="isCaptain" checked={form.isCaptain} onChange={handleChange} />
                Captain
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="isViceCaptain" checked={form.isViceCaptain} onChange={handleChange} />
                Vice Captain
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="isWicketkeeper" checked={form.isWicketkeeper} onChange={handleChange} />
                Wicketkeeper
              </label>
            </div>
          </CardBody>
        </Card>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <Button type="submit" loading={saving} disabled={!form.userId || availableUsers.length === 0}>
            Create Player
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/players")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
