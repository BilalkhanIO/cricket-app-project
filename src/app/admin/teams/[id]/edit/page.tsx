"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AdminDeleteButton from "@/app/admin/AdminDeleteButton";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

export default function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    fetch(`/api/teams/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.team) {
          setError(data.error || "Team not found");
          setLoading(false);
          return;
        }

        setForm({
          name: data.team.name || "",
          shortName: data.team.shortName || "",
          jerseyColor: data.team.jerseyColor || "#16a34a",
          city: data.team.city || "",
          description: data.team.description || "",
          sponsorName: data.team.sponsorName || "",
          contactEmail: data.team.contactEmail || "",
          contactPhone: data.team.contactPhone || "",
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load team");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch(`/api/teams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to update team");
      return;
    }

    router.push("/admin/teams");
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">Loading team...</div>;
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/teams" className="text-sm text-gray-500 hover:text-gray-700">
            ← Teams
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Team</h1>
        </div>
        <AdminDeleteButton endpoint={`/api/teams/${id}`} confirmMessage="Delete this team?" redirectTo="/admin/teams" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Team Details</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Team Name *" name="name" value={form.name} onChange={handleChange} required />
              <Input label="Short Name *" name="shortName" value={form.shortName} onChange={handleChange} maxLength={4} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[color:var(--color-ink)]">Jersey Color</label>
                <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--card-bg)] px-3.5 py-2.5">
                  <input type="color" name="jerseyColor" value={form.jerseyColor} onChange={handleChange} className="h-10 w-10 cursor-pointer rounded" />
                  <span className="text-sm text-gray-600">{form.jerseyColor}</span>
                </div>
              </div>
              <Input label="City" name="city" value={form.city} onChange={handleChange} />
            </div>
            <Textarea label="Description" name="description" value={form.description} onChange={handleChange} rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Sponsor Name" name="sponsorName" value={form.sponsorName} onChange={handleChange} />
              <Input label="Contact Email" name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} />
            </div>
            <Input label="Contact Phone" name="contactPhone" value={form.contactPhone} onChange={handleChange} />
          </CardBody>
        </Card>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/teams")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
