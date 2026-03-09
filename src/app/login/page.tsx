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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/home");
      router.refresh();
    }
  };

  const demoAccounts = [
    { role: "Super Admin", email: "admin@cricket.app", password: "admin123" },
    { role: "League Admin", email: "leagueadmin@cricket.app", password: "league123" },
    { role: "Scorer", email: "scorer@cricket.app", password: "scorer123" },
    { role: "Team Manager", email: "manager1@cricket.app", password: "manager123" },
    { role: "Player", email: "player1@cricket.app", password: "player123" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-700 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏏</div>
          <h1 className="text-3xl font-bold text-white">CricketLeague</h1>
          <p className="text-green-200 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cricket.app"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-green-600 font-medium hover:underline">
              Sign up
            </Link>
          </p>

          {/* Demo Accounts */}
          <div className="mt-6 border-t pt-6">
            <p className="text-xs font-medium text-gray-500 mb-3 text-center">Demo Accounts (Seed first at /api/seed)</p>
            <div className="grid grid-cols-1 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-green-50 rounded-lg text-xs transition-colors text-left"
                >
                  <span className="font-medium text-gray-700">{acc.role}</span>
                  <span className="text-gray-400">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
