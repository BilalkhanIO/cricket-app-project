"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type PoolConfigRow = {
  name: string;
  qualificationSlots: number;
};

function parseInitialValue(value?: string | null): PoolConfigRow[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => ({
        name: String(entry?.name || entry?.poolName || entry?.groupName || entry?.code || "").trim(),
        qualificationSlots: Math.max(1, Number(entry?.qualificationSlots || 2) || 2),
      }))
      .filter((entry) => entry.name);
  } catch {
    return [];
  }
}

export default function PoolConfigEditor({
  leagueId,
  initialValue,
}: {
  leagueId: string;
  initialValue?: string | null;
}) {
  const [rows, setRows] = useState<PoolConfigRow[]>(() => parseInitialValue(initialValue));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const totalQualified = useMemo(
    () => rows.reduce((sum, row) => sum + Math.max(1, Number(row.qualificationSlots || 1)), 0),
    [rows],
  );

  const updateRow = (index: number, nextValue: Partial<PoolConfigRow>) => {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              ...nextValue,
            }
          : row,
      ),
    );
  };

  const addRow = () => {
    setRows((current) => [...current, { name: `Pool ${String.fromCharCode(65 + current.length)}`, qualificationSlots: 2 }]);
  };

  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    const normalizedRows = rows
      .map((row) => ({
        name: row.name.trim(),
        qualificationSlots: Math.max(1, Number(row.qualificationSlots || 1)),
      }))
      .filter((row) => row.name);

    const res = await fetch(`/api/leagues/${leagueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poolConfigJson: normalizedRows.length > 0 ? JSON.stringify(normalizedRows) : null,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Failed to save pool configuration");
      return;
    }

    setRows(parseInitialValue(data.league?.poolConfigJson));
    setMessage("Pool configuration saved.");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900">Pool Configuration</h2>
            <p className="text-sm text-gray-500">
              Define pool names and qualification slots used by standings and public league pages.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={addRow}>
            + Add Pool
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500">
            No pools configured. The app will fall back to a default top-2-per-pool rule based on assigned pool labels.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={`${row.name}-${index}`} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1.4fr_0.8fr_auto]">
                <Input
                  label="Pool Name"
                  value={row.name}
                  onChange={(event) => updateRow(index, { name: event.target.value })}
                  placeholder="Pool A"
                />
                <Input
                  label="Qualification Slots"
                  type="number"
                  min={1}
                  value={row.qualificationSlots}
                  onChange={(event) => updateRow(index, { qualificationSlots: Number(event.target.value) })}
                />
                <div className="flex items-end">
                  <Button type="button" variant="danger" onClick={() => removeRow(index)} className="w-full md:w-auto">
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Total configured qualification slots: <span className="font-semibold text-gray-900">{totalQualified}</span>
        </div>

        {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {message ? <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

        <div className="flex justify-end">
          <Button type="button" loading={saving} onClick={handleSave}>
            Save Pool Rules
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
