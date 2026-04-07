"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export default function ShareButton({ label = "Share" }: { label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard without interaction
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 border border-white/10 bg-[#001c3a] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#d4e3ff] transition hover:border-[#4ae183] hover:text-[#4ae183]"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-[#4ae183]" />
          <span className="text-[#4ae183]">Copied!</span>
        </>
      ) : (
        <>
          <Link2 className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  );
}
