"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
import { ROLE, SELF_REGISTRATION_ROLES, getRoleLabel } from "@/lib/roles";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: "", role: ROLE.VIEWER,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roleCards: Record<string, { icon: string; desc: string }> = {
    [ROLE.VIEWER]:       { icon: "👀", desc: "Follow leagues, matches, and public scorecards" },
    [ROLE.PLAYER]:       { icon: "🏏", desc: "View your stats and season records" },
    [ROLE.TEAM_MANAGER]: { icon: "👥", desc: "Manage team operations and squads" },
    [ROLE.SCORER]:       { icon: "📊", desc: "Record live match scoring" },
    [ROLE.UMPIRE]:       { icon: "🧢", desc: "Join match-official workflows" },
  };
  const roles = SELF_REGISTRATION_ROLES.map((role) => ({
    value: role,
    label: getRoleLabel(role),
    icon: roleCards[role]?.icon || "👤",
    desc: roleCards[role]?.desc || "Create an account",
  }));

  const inputClass =
    "w-full border border-white/10 bg-[#001c3a] px-4 py-3 text-sm text-white placeholder:text-[#9bb2d1]/50 focus:border-[#4ae183] focus:outline-none";

  return (
    <div className="flex min-h-screen bg-[#00142b]">
      {/* Left panel — branding */}
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

        <div className="relative space-y-8">
          <div>
            <h1 className="font-[var(--font-display)] text-5xl font-black uppercase leading-tight tracking-tight text-white">
              Join the
              <span className="block text-[#4ae183]">community</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#9bb2d1]">
              Register as a viewer, player, team manager, scorer, or umpire and take part in the tournament workflow.
            </p>
          </div>

          <div className="space-y-3">
            {roles.map((r) => (
              <div
                key={r.value}
                className={`flex items-center gap-3 border px-4 py-3 transition-all ${
                  formData.role === r.value
                    ? "border-[#4ae183] bg-[#4ae183]/10"
                    : "border-white/5 opacity-50"
                }`}
              >
                <span className="text-xl">{r.icon}</span>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-white">{r.label}</p>
                  <p className="text-[10px] text-[#9bb2d1]">{r.desc}</p>
                </div>
                {formData.role === r.value && (
                  <span className="ml-auto text-[10px] font-black text-[#4ae183]">Selected</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">
          © {new Date().getFullYear()} CricketLeague App
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-1 flex-col justify-center overflow-y-auto px-6 py-12 lg:px-16">
        {/* Mobile logo */}
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
              Create account
            </div>
            <h2 className="mt-4 font-[var(--font-display)] text-4xl font-black uppercase tracking-tight text-white">
              Get started
            </h2>
            <p className="mt-2 text-sm text-[#9bb2d1]">Fill in your details to join the platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Full Name</label>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required className={inputClass} />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required className={inputClass} />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Phone (optional)</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+92 300 1234567" className={inputClass} />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 6 characters" required minLength={6} className={inputClass} />
            </div>

            {/* Role selector */}
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Account Role</label>
              <div className="space-y-2">
                {roles.map((r) => (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer items-center gap-3 border px-4 py-3 transition-all ${
                      formData.role === r.value
                        ? "border-[#4ae183] bg-[#4ae183]/10"
                        : "border-white/10 bg-[#001c3a] hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={formData.role === r.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-lg">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase tracking-[0.1em] text-white">{r.label}</p>
                      <p className="text-[10px] text-[#9bb2d1]">{r.desc}</p>
                    </div>
                    <div
                      className={`h-4 w-4 flex-shrink-0 border-2 ${
                        formData.role === r.value ? "border-[#4ae183] bg-[#4ae183]" : "border-white/20"
                      }`}
                    />
                  </label>
                ))}
              </div>
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
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#9bb2d1]">
            Already have an account?{" "}
            <Link href="/login" className="font-black text-[#4ae183] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
