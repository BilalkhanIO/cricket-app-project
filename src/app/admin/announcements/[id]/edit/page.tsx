"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AdminDeleteButton from "@/app/admin/AdminDeleteButton";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

export default function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    title: "",
    content: "",
    leagueId: "",
    isPublic: "true",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/announcements/${id}`).then((res) => res.json()),
      fetch("/api/leagues").then((res) => res.json()),
    ])
      .then(([announcementData, leagueData]) => {
        if (!announcementData.announcement) {
          setError(announcementData.error || "Announcement not found");
          setLoading(false);
          return;
        }

        setForm({
          title: announcementData.announcement.title || "",
          content: announcementData.announcement.content || "",
          leagueId: announcementData.announcement.leagueId || "",
          isPublic: String(Boolean(announcementData.announcement.isPublic)),
        });
        setLeagues(leagueData.leagues || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load announcement");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch(`/api/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        content: form.content,
        leagueId: form.leagueId || null,
        isPublic: form.isPublic === "true",
      }),
    });
    const data = await res.json();

    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to update announcement");
      return;
    }

    router.push("/admin/announcements");
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">Loading announcement...</div>;
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/announcements" className="text-sm text-gray-500 hover:text-gray-700">
            ← Announcements
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Announcement</h1>
        </div>
        <AdminDeleteButton endpoint={`/api/announcements/${id}`} confirmMessage="Delete this announcement?" redirectTo="/admin/announcements" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Announcement</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input label="Title *" name="title" value={form.title} onChange={handleChange} required />
            <Textarea label="Content *" name="content" value={form.content} onChange={handleChange} rows={5} required />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="League"
                name="leagueId"
                value={form.leagueId}
                onChange={handleChange}
                options={[
                  { value: "", label: "All Leagues (Platform-wide)" },
                  ...leagues.map((league) => ({ value: league.id, label: league.name })),
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

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/announcements")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
