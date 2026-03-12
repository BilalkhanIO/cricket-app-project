"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export const dynamic = 'force-dynamic';

export default function NewTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    jerseyColor: "#16a34a",
    city: "",
    description: "",
    sponsorName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create team");
      return;
    }

    router.push("/admin/teams");
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-gray-700">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Create Team</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader><h2 className="font-semibold">Team Details</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Team Name *" name="name" value={form.name} onChange={handleChange} placeholder="Karachi Lions" required />
              <Input label="Short Name *" name="shortName" value={form.shortName} onChange={handleChange} placeholder="KL" maxLength={4} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Jersey Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" name="jerseyColor" value={form.jerseyColor} onChange={handleChange} className="w-10 h-10 rounded cursor-pointer" />
                  <span className="text-sm text-gray-600">{form.jerseyColor}</span>
                </div>
              </div>
              <Input label="City" name="city" value={form.city} onChange={handleChange} placeholder="Karachi" />
            </div>
            <Textarea label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Team description..." rows={2} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Sponsor Name" name="sponsorName" value={form.sponsorName} onChange={handleChange} />
              <Input label="Contact Email" name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} />
            </div>
            <Input label="Contact Phone" name="contactPhone" value={form.contactPhone} onChange={handleChange} />
          </CardBody>
        </Card>

        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading} size="lg">Create Team</Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
