"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Missing reset token. Please request a new reset link.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-white/10 bg-[#001c3a] px-4 py-3 text-sm text-white placeholder:text-[#9bb2d1]/50 focus:border-[#4ae183] focus:outline-none";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <div className="inline-flex bg-[#1b3656] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#d4e3ff]">
          Password reset
        </div>
        <h2 className="mt-4 font-[var(--font-display)] text-4xl font-black uppercase tracking-tight text-white">
          New password
        </h2>
        <p className="mt-2 text-sm text-[#9bb2d1]">Choose a new password for your account</p>
      </div>

      {done ? (
        <div className="space-y-4">
          <div className="border border-[#4ae183]/30 bg-[#4ae183]/10 px-5 py-5">
            <p className="text-sm font-bold text-[#4ae183]">Password updated</p>
            <p className="mt-2 text-sm leading-6 text-[#d4e3ff]">
              Your password has been changed. Redirecting you to sign in…
            </p>
          </div>
          <Link href="/login" className="block text-center text-sm font-black uppercase tracking-[0.14em] text-[#4ae183] hover:underline">
            Go to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className={inputClass + " pr-12"}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9bb2d1] hover:text-white"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
              Confirm Password
            </label>
            <input
              type={showPw ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              required
              className={inputClass}
            />
          </div>

          {error && (
            <div className="border border-[#93000a] bg-[#93000a]/20 px-4 py-3 text-sm font-bold text-[#ffdad6]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-[#4ae183] py-3 text-sm font-black uppercase tracking-[0.18em] text-[#002613] transition hover:bg-white disabled:opacity-60"
          >
            {loading ? "Saving…" : "Set New Password"}
          </button>

          <p className="text-center text-sm text-[#9bb2d1]">
            <Link href="/forgot-password" className="font-black text-[#4ae183] hover:underline">
              Request a new link
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen bg-[#00142b]">
      {/* Left panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#001c3a] p-12 lg:flex lg:w-5/12">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(74,225,131,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,225,131,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(27,54,86,0.9),transparent_60%)]" />
        <div className="relative">
          <Link href="/home" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border border-white/10 bg-[#1b3656] text-[#f4d58a]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">
                CricketLeague
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-[#9bb2d1]">
                Pro platform
              </span>
            </div>
          </Link>
        </div>
        <div className="relative space-y-6">
          <h1 className="font-[var(--font-display)] text-5xl font-black uppercase leading-tight tracking-tight text-white">
            Almost
            <span className="block text-[#4ae183]">there</span>
          </h1>
          <p className="max-w-sm text-sm leading-7 text-[#9bb2d1]">
            Set a strong new password to secure your account.
          </p>
        </div>
        <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">
          © {new Date().getFullYear()} CricketLeague App
        </p>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-1 flex-col justify-center overflow-y-auto px-6 py-12 lg:px-16">
        <div className="mb-8 lg:hidden">
          <Link href="/home" className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-[#1b3656] text-[#f4d58a]">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">
              CricketLeague
            </span>
          </Link>
        </div>
        <Suspense fallback={<div className="text-[#9bb2d1]">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
