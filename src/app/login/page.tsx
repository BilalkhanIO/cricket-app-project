"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Shield } from "lucide-react";

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
    { role: "Super Admin", email: "admin@cricket.com", password: "Password123!" },
    { role: "League Admin", email: "league@cricket.com", password: "Password123!" },
    { role: "Team Manager", email: "manager1@cricket.com", password: "Password123!" },
    { role: "Scorer", email: "scorer@cricket.com", password: "Password123!" },
  ];

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
              Welcome
              <span className="block text-[#4ae183]">back</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#9bb2d1]">
              Manage leagues, track live scores, and follow your favourite teams — all in one place.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { text: "Real-time ball-by-ball scoring" },
              { text: "Comprehensive statistics & leaderboards" },
              { text: "Full league & tournament management" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 bg-[#4ae183]" />
                <span className="text-sm font-bold uppercase tracking-[0.12em] text-[#d4e3ff]">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">
          © {new Date().getFullYear()} CricketLeague App
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 lg:px-16">
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
              Sign in
            </div>
            <h2 className="mt-4 font-[var(--font-display)] text-4xl font-black uppercase tracking-tight text-white">
              Your account
            </h2>
            <p className="mt-2 text-sm text-[#9bb2d1]">Enter your credentials to access your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-white/10 bg-[#001c3a] px-4 py-3 text-sm text-white placeholder:text-[#9bb2d1]/50 focus:border-[#4ae183] focus:outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-[0.14em] text-[#4ae183] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-white/10 bg-[#001c3a] px-4 py-3 pr-12 text-sm text-white placeholder:text-[#9bb2d1]/50 focus:border-[#4ae183] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9bb2d1] hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#9bb2d1]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-black text-[#4ae183] hover:underline">
              Create account
            </Link>
          </p>

          {/* Demo Accounts */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">
              Quick demo access
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  className="flex flex-col items-start border border-white/10 bg-[#001c3a] px-3 py-2.5 text-xs transition hover:border-[#4ae183] hover:bg-[#0b2747]"
                >
                  <span className="font-black uppercase tracking-[0.12em] text-white">{acc.role}</span>
                  <span className="mt-0.5 truncate w-full text-[#9bb2d1]">{acc.email}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] text-[#9bb2d1]">
              All accounts use:{" "}
              <span className="font-black text-[#4ae183]">Password123!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
