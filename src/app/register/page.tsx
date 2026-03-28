"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROLE, SELF_REGISTRATION_ROLES, getRoleLabel } from "@/lib/roles";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: "", role: ROLE.FAN,
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
    [ROLE.FAN]: { icon: "👀", desc: "Follow leagues and matches" },
    [ROLE.PLAYER]: { icon: "🏏", desc: "View your stats and season records" },
    [ROLE.TEAM_MANAGER]: { icon: "👥", desc: "Manage team operations and squads" },
    [ROLE.COACH]: { icon: "🎯", desc: "Support squad planning and match prep" },
    [ROLE.ANALYST]: { icon: "📈", desc: "Track performance and cricket insights" },
    [ROLE.SCORER]: { icon: "📊", desc: "Record live match scoring" },
    [ROLE.UMPIRE]: { icon: "🧢", desc: "Join match-official workflows" },
  };
  const roles = SELF_REGISTRATION_ROLES.map((role) => ({
    value: role,
    label: getRoleLabel(role),
    icon: roleCards[role]?.icon || "👤",
    desc: roleCards[role]?.desc || "Create an account",
  }));

  return (
    <div className="min-h-screen flex bg-[linear-gradient(135deg,#102433_0%,#17364e_55%,#1f6f50_100%)]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 text-[200px] flex items-center justify-center select-none pointer-events-none">🏏</div>
        <Link href="/home" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[color:var(--primary)] rounded-xl flex items-center justify-center text-2xl">🏏</div>
          <div>
            <span className="font-bold text-xl text-white block">CricketLeague</span>
            <span className="text-[10px] text-[#9a8569] tracking-widest uppercase">Pro Platform</span>
          </div>
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Join the<br />
            <span className="text-[#9a8569]">Cricket Community</span>
          </h1>
          <p className="text-[#d6cab7] leading-relaxed max-w-sm">
            Whether you&apos;re a fan, player, team staff member, or match official, there&apos;s a place for you here.
          </p>

          <div className="mt-8 space-y-2">
            {roles.map((r) => (
              <div key={r.value} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${formData.role === r.value ? "bg-white/15 border border-white/20" : "opacity-60"}`}>
                <span className="text-xl">{r.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{r.label}</p>
                  <p className="text-xs text-[#9a8569]">{r.desc}</p>
                </div>
                {formData.role === r.value && <span className="ml-auto text-[color:var(--primary)]">✓</span>}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[color:var(--primary)] text-xs">© {new Date().getFullYear()} CricketLeague App</p>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 bg-[color:var(--card-muted)] overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-[color:var(--primary)] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">🏏</div>
            <h1 className="text-2xl font-bold text-[color:var(--color-ink)]">Join CricketLeague</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[color:var(--color-ink)]">Create account</h2>
            <p className="text-[color:var(--color-ink-soft)] mt-1 text-sm">Fill in your details to get started</p>
          </div>

          <div className="page-shell rounded-[2rem] p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required />
            <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
            <Input label="Phone Number (optional)" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+92 300 1234567" />
            <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 6 characters" required minLength={6} />

            {/* Role selector */}
            <div>
              <label className="text-sm font-semibold text-[color:var(--color-ink)] block mb-2">Account Role</label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.role === r.value
                        ? "border-[color:var(--primary)] bg-[color:var(--card-muted)]"
                        : "border-[color:var(--border-color)] bg-white hover:border-[color:var(--primary)] hover:bg-[color:var(--card-muted)]"
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
                    <span className="text-xl">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[color:var(--color-ink)]">{r.label}</p>
                      <p className="text-xs text-[color:var(--color-ink-soft)]">{r.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${formData.role === r.value ? "border-[color:var(--primary)] bg-[color:var(--primary)]" : "border-[color:var(--border-color)]"}`}>
                      {formData.role === r.value && <div className="w-full h-full rounded-full bg-white scale-50" />}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading} variant="navy">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-[color:var(--color-ink-soft)] mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-[color:var(--primary)] font-semibold hover:underline">Sign in</Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
