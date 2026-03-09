"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function NewVenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || "Failed"); return; }
    router.push("/admin/venues");
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Add Venue</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader><h2 className="font-semibold">Venue Details</h2></CardHeader>
          <CardBody className="space-y-4">
            <Input label="Venue Name *" name="name" value={form.name} onChange={handleChange} placeholder="National Cricket Stadium" required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City *" name="city" value={form.city} onChange={handleChange} placeholder="Karachi" required />
              <Input label="Pitch Type" name="pitchType" value={form.pitchType} onChange={handleChange} placeholder="Flat / Good" />
            </div>
            <Input label="Address" name="address" value={form.address} onChange={handleChange} />
            <Input label="Boundary Size" name="boundarySize" value={form.boundarySize} onChange={handleChange} placeholder="65m" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact Person" name="contactPerson" value={form.contactPerson} onChange={handleChange} />
              <Input label="Contact Phone" name="contactPhone" value={form.contactPhone} onChange={handleChange} />
            </div>
            <Textarea label="Facilities" name="facilities" value={form.facilities} onChange={handleChange} placeholder="Floodlights, Scoreboard..." rows={2} />
          </CardBody>
        </Card>

        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Add Venue</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
