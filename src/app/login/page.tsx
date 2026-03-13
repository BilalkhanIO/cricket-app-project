"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push("/home");
      router.refresh();
    }
  };

  const demoAccounts = [
    { role: "Super Admin",   email: "admin@cricket.com",    password: "Password123!", color: "#769FCD" },
    { role: "League Admin",  email: "league@cricket.com",   password: "Password123!", color: "#2D5484" },
    { role: "Team Manager",  email: "manager1@cricket.com", password: "Password123!", color: "#4A7098" },
    { role: "Scorer",        email: "scorer@cricket.com",   password: "Password123!", color: "#B9D7EA" },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "linear-gradient(135deg, #1B3A5C 0%, #2D5484 60%, #769FCD 100%)" }}
    >
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 text-[200px] flex items-center justify-center select-none pointer-events-none">
          🏏
        </div>
        <Link href="/home" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#769FCD] rounded-xl flex items-center justify-center text-2xl">🏏</div>
          <div>
            <span className="font-bold text-xl text-white block">CricketLeague</span>
            <span className="text-[10px] text-[#B9D7EA] tracking-widest uppercase">Pro Platform</span>
          </div>
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Welcome back to<br />
            <span className="text-[#B9D7EA]">Cricket League</span>
          </h1>
          <p className="text-[#D6E6F2] text-lg leading-relaxed max-w-sm">
            Manage leagues, track live scores, and follow your favorite teams all in one place.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: "⚡", text: "Real-time ball-by-ball scoring" },
              { icon: "📊", text: "Comprehensive statistics & leaderboards" },
              { icon: "🏆", text: "Full league & tournament management" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-[#D6E6F2]">
                <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-base flex-shrink-0">{f.icon}</span>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[#769FCD] text-xs">© {new Date().getFullYear()} CricketLeague App</p>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-[#F7FBFC]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-[#769FCD] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">🏏</div>
            <h1 className="text-2xl font-bold text-[#1B3A5C]">CricketLeague</h1>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-[#1B3A5C]">Sign in</h2>
            <p className="text-[#4A7098] mt-1 text-sm">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-[#1B3A5C]">Password</label>
                <button type="button" className="text-xs text-[#769FCD] hover:underline" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#B9D7EA] bg-white text-[#1B3A5C] focus:outline-none focus:ring-2 focus:ring-[#769FCD] focus:border-[#769FCD] placeholder:text-[#B9D7EA] text-sm"
              />
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
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-[#4A7098] mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#769FCD] font-semibold hover:underline">Create account</Link>
          </p>

          {/* Demo Accounts */}
          <div className="mt-6 border-t border-[#D6E6F2] pt-5">
            <p className="text-xs font-semibold text-[#4A7098] mb-3 uppercase tracking-wide text-center">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  className="flex flex-col items-start px-3 py-2.5 bg-white border border-[#B9D7EA] hover:border-[#769FCD] hover:bg-[#F7FBFC] rounded-xl text-xs transition-all"
                >
                  <span className="font-semibold text-[#1B3A5C]">{acc.role}</span>
                  <span className="text-[#4A7098] mt-0.5 truncate w-full">{acc.email}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#B9D7EA] text-center mt-2">All demo accounts use: <span className="font-mono text-[#769FCD]">Password123!</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
