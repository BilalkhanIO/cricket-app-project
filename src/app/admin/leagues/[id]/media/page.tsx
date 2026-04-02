"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

type MediaItem = {
  id: string;
  url: string;
  type: string;
  title: string | null;
  description: string | null;
};

const mediaTypeOptions = [
  { value: "IMAGE", label: "Image" },
  { value: "VIDEO", label: "Video" },
];

export default function AdminLeagueMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [leagueName, setLeagueName] = useState("League");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ url: "", type: "IMAGE", title: "", description: "" });
  const [editForm, setEditForm] = useState({ url: "", type: "IMAGE", title: "", description: "" });

  useEffect(() => {
    fetch(`/api/leagues/${id}`)
      .then((res) => res.json())
      .then((data) => setLeagueName(data.league?.name || "League"));

    fetchMedia();
  }, [id]);

  const fetchMedia = async () => {
    const res = await fetch(`/api/leagues/${id}/media`);
    const data = await res.json();
    setItems(data.media || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/leagues/${id}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: form.url,
          type: form.type,
          title: form.title || null,
          description: form.description || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to add media");
        return;
      }

      setItems((current) => [data.media, ...current]);
      setForm({ url: "", type: "IMAGE", title: "", description: "" });
      setMessage("Media added successfully.");
    } finally {
      setSubmitting(false);
    }
  };

  const beginEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setEditForm({
      url: item.url,
      type: item.type,
      title: item.title || "",
      description: item.description || "",
    });
    setMessage("");
  };

  const handleUpdate = async (mediaId: string) => {
    setProcessingId(mediaId);
    setMessage("");

    try {
      const res = await fetch(`/api/leagues/${id}/media/${mediaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: editForm.url,
          type: editForm.type,
          title: editForm.title || null,
          description: editForm.description || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to update media");
        return;
      }

      setItems((current) => current.map((item) => (item.id === mediaId ? data.media : item)));
      setEditingId(null);
      setMessage("Media updated successfully.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!window.confirm("Delete this media item?")) return;

    setProcessingId(mediaId);
    setMessage("");
    try {
      const res = await fetch(`/api/leagues/${id}/media/${mediaId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data.error || "Failed to delete media");
        return;
      }

      setItems((current) => current.filter((item) => item.id !== mediaId));
      if (editingId === mediaId) setEditingId(null);
      setMessage("Media deleted successfully.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/leagues/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← {leagueName}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Media Management</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px,1fr]">
        <Card>
          <CardHeader>
            <h2 className="font-bold text-gray-900">Add Media</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Media URL *"
                type="url"
                value={form.url}
                onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                required
              />
              <Select
                label="Type"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                options={mediaTypeOptions}
              />
              <Input
                label="Title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Final celebration"
              />
              <Textarea
                label="Description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Optional caption or context"
              />
              <Button type="submit" loading={submitting} fullWidth>
                Add Media
              </Button>
            </form>
            {message && <p className={`mt-4 text-sm ${message.includes("successfully") ? "text-[color:var(--primary)]" : "text-red-600"}`}>{message}</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-bold text-gray-900">Gallery ({items.length})</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {loading ? (
              <p className="py-12 text-center text-sm text-gray-400">Loading media...</p>
            ) : items.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">No media uploaded yet.</p>
            ) : (
              items.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <div key={item.id} className="rounded-2xl border border-[color:var(--border-color)] p-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          label="Media URL"
                          type="url"
                          value={editForm.url}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, url: e.target.value }))}
                        />
                        <Select
                          label="Type"
                          value={editForm.type}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                          options={mediaTypeOptions}
                        />
                        <Input
                          label="Title"
                          value={editForm.title}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                        />
                        <Textarea
                          label="Description"
                          rows={3}
                          value={editForm.description}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <Button type="button" onClick={() => handleUpdate(item.id)} disabled={processingId === item.id || !editForm.url}>
                            {processingId === item.id ? "Saving..." : "Save"}
                          </Button>
                          <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 md:flex-row">
                        <div className="h-40 w-full overflow-hidden rounded-2xl bg-gray-100 md:w-56">
                          {item.type === "IMAGE" ? (
                            <img src={item.url} alt={item.title || "Media"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-[color:var(--primary-dark)] text-4xl text-white">
                              🎬
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{item.title || "Untitled media"}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gray-400">{item.type}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button type="button" variant="ghost" onClick={() => beginEdit(item)}>
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleDelete(item.id)}
                                disabled={processingId === item.id}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                {processingId === item.id ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          </div>
                          {item.description && <p className="mt-3 text-sm text-gray-600">{item.description}</p>}
                          <a href={item.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm text-[color:var(--primary)] hover:underline">
                            Open source file
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
