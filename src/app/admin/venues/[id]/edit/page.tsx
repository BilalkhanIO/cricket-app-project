"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AdminDeleteButton from "@/app/admin/AdminDeleteButton";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

export default function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    googleMapsUrl: "",
    contactPerson: "",
    contactPhone: "",
    pitchType: "",
    boundarySize: "",
    facilities: "",
  });

  useEffect(() => {
    fetch(`/api/venues/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.venue) {
          setError(data.error || "Venue not found");
          setLoading(false);
          return;
        }
        setForm({
          name: data.venue.name || "",
          address: data.venue.address || "",
          city: data.venue.city || "",
          googleMapsUrl: data.venue.googleMapsUrl || "",
          contactPerson: data.venue.contactPerson || "",
          contactPhone: data.venue.contactPhone || "",
          pitchType: data.venue.pitchType || "",
          boundarySize: data.venue.boundarySize || "",
          facilities: data.venue.facilities || "",
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load venue");
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

    const res = await fetch(`/api/venues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to update venue");
      return;
    }

    router.push("/admin/venues");
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">Loading venue...</div>;
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/venues" className="text-sm text-gray-500 hover:text-gray-700">
            ← Venues
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Venue</h1>
        </div>
        <AdminDeleteButton endpoint={`/api/venues/${id}`} confirmMessage="Delete this venue?" redirectTo="/admin/venues" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Venue Details</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input label="Venue Name *" name="name" value={form.name} onChange={handleChange} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City *" name="city" value={form.city} onChange={handleChange} required />
              <Input label="Pitch Type" name="pitchType" value={form.pitchType} onChange={handleChange} />
            </div>
            <Input label="Address" name="address" value={form.address} onChange={handleChange} />
            <Input label="Google Maps URL" name="googleMapsUrl" value={form.googleMapsUrl} onChange={handleChange} />
            <Input label="Boundary Size" name="boundarySize" value={form.boundarySize} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact Person" name="contactPerson" value={form.contactPerson} onChange={handleChange} />
              <Input label="Contact Phone" name="contactPhone" value={form.contactPhone} onChange={handleChange} />
            </div>
            <Textarea label="Facilities" name="facilities" value={form.facilities} onChange={handleChange} rows={3} />
          </CardBody>
        </Card>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/venues")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
