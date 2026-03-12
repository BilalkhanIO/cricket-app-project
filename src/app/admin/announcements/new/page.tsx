"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export const dynamic = 'force-dynamic';

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leagues, setLeagues] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    content: "",
    leagueId: "",
    isPublic: "true",
  });

  useEffect(() => {
    fetch("/api/leagues").then(r => r.json()).then(d => setLeagues(d.leagues || []));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        leagueId: form.leagueId || null,
        isPublic: form.isPublic === "true",
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || "Failed"); return; }
    router.push("/admin/announcements");
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Post Announcement</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader><h2 className="font-semibold">Announcement</h2></CardHeader>
          <CardBody className="space-y-4">
            <Input label="Title *" name="title" value={form.title} onChange={handleChange} placeholder="Announcement title" required />
            <Textarea label="Content *" name="content" value={form.content} onChange={handleChange} placeholder="Write your announcement..." rows={4} required />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="League (Optional)"
                name="leagueId"
                value={form.leagueId}
                onChange={handleChange}
                options={[
                  { value: "", label: "All Leagues (Platform-wide)" },
                  ...leagues.map((l) => ({ value: l.id, label: l.name })),
                ]}
              />
              <Select
                label="Visibility"
                name="isPublic"
                value={form.isPublic}
                onChange={handleChange}
                options={[
                  { value: "true", label: "Public" },
                  { value: "false", label: "Private" },
                ]}
              />
            </div>
          </CardBody>
        </Card>

        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Post Announcement</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
