"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [devLink, setDevLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      if (data.resetUrl) setDevLink(data.resetUrl);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-white/10 bg-[#001c3a] px-4 py-3 text-sm text-white placeholder:text-[#9bb2d1]/50 focus:border-[#4ae183] focus:outline-none";

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
            Reset your
            <span className="block text-[#4ae183]">password</span>
          </h1>
          <p className="max-w-sm text-sm leading-7 text-[#9bb2d1]">
            Enter the email address linked to your account and we&apos;ll send you a reset link.
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

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <div className="inline-flex bg-[#1b3656] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#d4e3ff]">
              Password reset
            </div>
            <h2 className="mt-4 font-[var(--font-display)] text-4xl font-black uppercase tracking-tight text-white">
              Forgot password
            </h2>
            <p className="mt-2 text-sm text-[#9bb2d1]">Enter your email to receive a reset link</p>
          </div>

          {submitted ? (
            <div className="space-y-5">
              <div className="border border-[#4ae183]/30 bg-[#4ae183]/10 px-5 py-5">
                <p className="text-sm font-bold text-[#4ae183]">Reset link sent</p>
                <p className="mt-2 text-sm leading-6 text-[#d4e3ff]">
                  If <strong>{email}</strong> is registered, a password reset link has been sent. Check your inbox.
                </p>
              </div>

              {devLink && (
                <div className="border border-[#c8c8b0]/20 bg-[#1b3656] px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c8c8b0]">
                    Dev mode — no email configured
                  </p>
                  <p className="mt-2 text-xs text-[#9bb2d1]">Use this link to reset the password:</p>
                  <Link
                    href={devLink}
                    className="mt-2 block break-all text-xs font-bold text-[#4ae183] underline"
                  >
                    {devLink}
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#4ae183] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                disabled={loading}
                className="w-full bg-[#4ae183] py-3 text-sm font-black uppercase tracking-[0.18em] text-[#002613] transition hover:bg-white disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>

              <p className="text-center text-sm text-[#9bb2d1]">
                Remember it?{" "}
                <Link href="/login" className="font-black text-[#4ae183] hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
