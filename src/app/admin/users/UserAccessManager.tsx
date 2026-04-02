"use client";

import { useState } from "react";

import { ROLE_LABELS, ROLE } from "@/lib/roles";

const ROLE_OPTIONS = [
  ROLE.FAN,
  ROLE.PLAYER,
  ROLE.TEAM_MANAGER,
  ROLE.COACH,
  ROLE.ANALYST,
  ROLE.SCORER,
  ROLE.UMPIRE,
  ROLE.MATCH_REFEREE,
  ROLE.LEAGUE_STAFF,
  ROLE.LEAGUE_ADMIN,
  ROLE.SUPER_ADMIN,
];

export default function UserAccessManager({
  user,
  currentUserRole,
}: {
  user: {
    id: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
  };
  currentUserRole: string;
}) {
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [isVerified, setIsVerified] = useState(user.isVerified);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async (next: { role?: string; isActive?: boolean; isVerified?: boolean }) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Update failed");
        return false;
      }
      setMessage("Saved");
      return true;
    } finally {
      setSaving(false);
    }
  };

  const roleOptions =
    currentUserRole === ROLE.SUPER_ADMIN
      ? ROLE_OPTIONS
      : ROLE_OPTIONS.filter((item) => item !== ROLE.SUPER_ADMIN && item !== ROLE.LEAGUE_ADMIN);
  const canEditAdminAccount = currentUserRole === ROLE.SUPER_ADMIN || ![ROLE.SUPER_ADMIN, ROLE.LEAGUE_ADMIN].includes(user.role as typeof ROLE[keyof typeof ROLE]);

  return (
    <div className="space-y-2">
      <select
        value={role}
        onChange={async (e) => {
          const nextRole = e.target.value;
          setRole(nextRole);
          const ok = await save({ role: nextRole });
          if (!ok) setRole(user.role);
        }}
        disabled={saving || !canEditAdminAccount}
        className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs"
      >
        {roleOptions.map((item) => (
          <option key={item} value={item}>
            {ROLE_LABELS[item]}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || !canEditAdminAccount}
          onClick={async () => {
            const next = !isActive;
            setIsActive(next);
            const ok = await save({ isActive: next });
            if (!ok) setIsActive(!next);
          }}
          className={`px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}
        >
          {isActive ? "Active" : "Inactive"}
        </button>
        <button
          type="button"
          disabled={saving || !canEditAdminAccount}
          onClick={async () => {
            const next = !isVerified;
            setIsVerified(next);
            const ok = await save({ isVerified: next });
            if (!ok) setIsVerified(!next);
          }}
          className={`px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${isVerified ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}
        >
          {isVerified ? "Verified" : "Unverified"}
        </button>
      </div>
      {message && <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${message === "Saved" ? "text-emerald-700" : "text-red-600"}`}>{message}</p>}
    </div>
  );
}
