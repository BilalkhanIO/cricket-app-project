"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export const dynamic = 'force-dynamic';

const TIERS = ["TITLE", "GOLD", "SILVER", "BRONZE"];

const TIER_COLORS: Record<string, string> = {
  TITLE: "bg-purple-100 text-purple-800",
  GOLD: "bg-yellow-100 text-yellow-800",
  SILVER: "bg-gray-100 text-gray-700",
  BRONZE: "bg-orange-100 text-orange-800",
};

export default function SponsorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [leagueName, setLeagueName] = useState("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [website, setWebsite] = useState("");
  const [tier, setTier] = useState("SILVER");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    logo: "",
    website: "",
    tier: "SILVER",
  });

  useEffect(() => {
    fetch(`/api/leagues/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setLeagueName(d.league?.name || "League");
      });
    fetchSponsors();
  }, [id]);

  const fetchSponsors = async () => {
    const res = await fetch(`/api/leagues/${id}/sponsors`);
    const data = await res.json();
    setSponsors(data.sponsors || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const res = await fetch(`/api/leagues/${id}/sponsors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, logo, website, tier }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Sponsor added successfully!");
      setName("");
      setLogo("");
      setWebsite("");
      setTier("SILVER");
      fetchSponsors();
    } else {
      setMessage(data.error || "Failed to add sponsor");
    }
    setSubmitting(false);
  };

  const beginEdit = (sponsor: any) => {
    setEditingId(sponsor.id);
    setMessage("");
    setEditForm({
      name: sponsor.name || "",
      logo: sponsor.logo || "",
      website: sponsor.website || "",
      tier: sponsor.tier || "SILVER",
    });
  };

  const handleSave = async (sponsorId: string) => {
    setSavingId(sponsorId);
    setMessage("");

    const res = await fetch(`/api/leagues/${id}/sponsors/${sponsorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();

    if (res.ok) {
      setSponsors((current) => current.map((sponsor) => (sponsor.id === sponsorId ? data.sponsor : sponsor)));
      setEditingId(null);
      setMessage("Sponsor updated successfully!");
    } else {
      setMessage(data.error || "Failed to update sponsor");
    }
    setSavingId(null);
  };

  const handleDelete = async (sponsorId: string, sponsorName: string) => {
    if (!window.confirm(`Delete sponsor ${sponsorName}?`)) return;

    setDeletingId(sponsorId);
    setMessage("");

    const res = await fetch(`/api/leagues/${id}/sponsors/${sponsorId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setSponsors((current) => current.filter((sponsor) => sponsor.id !== sponsorId));
      setMessage("Sponsor deleted successfully!");
      if (editingId === sponsorId) setEditingId(null);
    } else {
      setMessage(data.error || "Failed to delete sponsor");
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/leagues/${id}`} className="text-gray-500 text-sm hover:text-gray-700">
          ← {leagueName}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Sponsors Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Sponsor Form */}
        <Card>
          <CardHeader>
            <h2 className="font-bold text-gray-900">Add Sponsor</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent"
                  placeholder="e.g. Acme Corporation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent"
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              {message && (
                <p className={`text-sm ${message.includes("success") ? "text-[color:var(--primary)]" : "text-red-600"}`}>
                  {message}
                </p>
              )}

              <Button type="submit" variant="primary" disabled={submitting || !name} fullWidth>
                {submitting ? "Adding..." : "Add Sponsor"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Sponsors List */}
        <Card>
          <CardHeader>
            <h2 className="font-bold text-gray-900">Current Sponsors ({sponsors.length})</h2>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <p className="text-center py-8 text-gray-400 text-sm">Loading...</p>
            ) : sponsors.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No sponsors yet</p>
            ) : (
              sponsors.map((sponsor) => (
                <div key={sponsor.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                  {editingId === sponsor.id ? (
                    <div className="w-full space-y-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[color:var(--primary)]"
                        placeholder="Sponsor name"
                      />
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <select
                          value={editForm.tier}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, tier: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[color:var(--primary)]"
                        >
                          {TIERS.map((tierOption) => (
                            <option key={tierOption} value={tierOption}>{tierOption}</option>
                          ))}
                        </select>
                        <input
                          type="url"
                          value={editForm.website}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, website: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[color:var(--primary)]"
                          placeholder="https://example.com"
                        />
                      </div>
                      <input
                        type="url"
                        value={editForm.logo}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, logo: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[color:var(--primary)]"
                        placeholder="Logo URL"
                      />
                      <div className="flex gap-2">
                        <Button type="button" variant="primary" onClick={() => handleSave(sponsor.id)} disabled={savingId === sponsor.id || !editForm.name}>
                          {savingId === sponsor.id ? "Saving..." : "Save"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {sponsor.logo ? (
                        <img src={sponsor.logo} alt={sponsor.name} className="w-10 h-10 object-contain rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg font-bold text-gray-500">
                          {sponsor.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{sponsor.name}</p>
                          {sponsor.tier && (
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${TIER_COLORS[sponsor.tier] || "bg-gray-100 text-gray-700"}`}>
                              {sponsor.tier}
                            </span>
                          )}
                        </div>
                        {sponsor.website && (
                          <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                            {sponsor.website}
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" onClick={() => beginEdit(sponsor)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleDelete(sponsor.id, sponsor.name)}
                          disabled={deletingId === sponsor.id}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          {deletingId === sponsor.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
