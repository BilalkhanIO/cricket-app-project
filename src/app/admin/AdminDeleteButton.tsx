"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";

interface AdminDeleteButtonProps {
  endpoint: string;
  confirmMessage: string;
  redirectTo?: string;
  onDeleted?: () => void;
  label?: string;
  className?: string;
}

export default function AdminDeleteButton({
  endpoint,
  confirmMessage,
  redirectTo,
  onDeleted,
  label = "Delete",
  className,
}: AdminDeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (loading || !window.confirm(confirmMessage)) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Delete failed");
        return;
      }

      onDeleted?.();
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button type="button" variant="ghost" onClick={handleDelete} disabled={loading} className="text-red-600 hover:bg-red-50 hover:text-red-700">
        {loading ? "Deleting..." : label}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
