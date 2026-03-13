"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: "", role: "FAN",
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

  const roles = [
    { value: "FAN",          label: "Fan / Viewer",   icon: "👀", desc: "Follow leagues and matches" },
    { value: "PLAYER",       label: "Player",          icon: "🏏", desc: "View your stats and performance" },
    { value: "TEAM_MANAGER", label: "Team Manager",    icon: "👥", desc: "Manage your team and players" },
    { value: "SCORER",       label: "Scorer",          icon: "📊", desc: "Record live match scores" },
    { value: "LEAGUE_ADMIN", label: "League Admin",    icon: "🏆", desc: "Create and manage leagues" },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "linear-gradient(135deg, #1B3A5C 0%, #2D5484 60%, #769FCD 100%)" }}
    >
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 text-[200px] flex items-center justify-center select-none pointer-events-none">🏏</div>
        <Link href="/home" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#769FCD] rounded-xl flex items-center justify-center text-2xl">🏏</div>
          <div>
            <span className="font-bold text-xl text-white block">CricketLeague</span>
            <span className="text-[10px] text-[#B9D7EA] tracking-widest uppercase">Pro Platform</span>
          </div>
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Join the<br />
            <span className="text-[#B9D7EA]">Cricket Community</span>
          </h1>
          <p className="text-[#D6E6F2] leading-relaxed max-w-sm">
            Whether you&apos;re a fan, player, or league organizer — there&apos;s a place for you here.
          </p>

          <div className="mt-8 space-y-2">
            {roles.map((r) => (
              <div key={r.value} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${formData.role === r.value ? "bg-white/15 border border-white/20" : "opacity-60"}`}>
                <span className="text-xl">{r.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{r.label}</p>
                  <p className="text-xs text-[#B9D7EA]">{r.desc}</p>
                </div>
                {formData.role === r.value && <span className="ml-auto text-[#769FCD]">✓</span>}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[#769FCD] text-xs">© {new Date().getFullYear()} CricketLeague App</p>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 bg-[#F7FBFC] overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-[#769FCD] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">🏏</div>
            <h1 className="text-2xl font-bold text-[#1B3A5C]">Join CricketLeague</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#1B3A5C]">Create account</h2>
            <p className="text-[#4A7098] mt-1 text-sm">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required />
            <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
            <Input label="Phone Number (optional)" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+92 300 1234567" />
            <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 6 characters" required minLength={6} />

            {/* Role selector */}
            <div>
              <label className="text-sm font-semibold text-[#1B3A5C] block mb-2">Account Role</label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.role === r.value
                        ? "border-[#769FCD] bg-[#D6E6F2]"
                        : "border-[#B9D7EA] bg-white hover:border-[#769FCD] hover:bg-[#F7FBFC]"
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
                      <p className="text-sm font-semibold text-[#1B3A5C]">{r.label}</p>
                      <p className="text-xs text-[#4A7098]">{r.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${formData.role === r.value ? "border-[#769FCD] bg-[#769FCD]" : "border-[#B9D7EA]"}`}>
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

          <p className="text-center text-sm text-[#4A7098] mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-[#769FCD] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
