"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/leagues", label: "Leagues" },
    { href: "/matches", label: "Matches" },
    { href: "/teams", label: "Teams" },
    { href: "/players", label: "Players" },
    { href: "/stats", label: "Statistics" },
  ];

  const getDashboardLink = () => {
    if (!session) return null;
    switch (session.user.role) {
      case "SUPER_ADMIN":
        return "/admin";
      case "LEAGUE_ADMIN":
        return "/admin";
      case "TEAM_MANAGER":
        return "/dashboard/team";
      case "SCORER":
        return "/dashboard/scorer";
      case "PLAYER":
        return "/dashboard/player";
      default:
        return "/dashboard";
    }
  };

  return (
    <nav className="bg-green-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏏</span>
            <span className="font-bold text-lg hidden sm:block">CricketLeague</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold">
                    {session.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm">{session.user.name.split(" ")[0]}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 text-gray-800 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-sm">{session.user.name}</p>
                      <p className="text-xs text-gray-500">{session.user.role}</p>
                    </div>
                    {getDashboardLink() && (
                      <Link
                        href={getDashboardLink()!}
                        className="block px-4 py-2 text-sm hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-green-700">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="sm" className="text-green-800">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-green-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-green-700 mt-1 pt-3">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-lg text-sm hover:bg-green-700"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-green-700 mt-2 pt-2">
                {session ? (
                  <>
                    <p className="px-3 py-1 text-xs text-green-300">{session.user.name}</p>
                    {getDashboardLink() && (
                      <Link href={getDashboardLink()!} className="block px-3 py-2 text-sm hover:bg-green-700">
                        Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="block w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-green-700"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 px-3">
                    <Link href="/login" className="flex-1">
                      <Button variant="ghost" fullWidth className="text-white border border-green-600">Login</Button>
                    </Link>
                    <Link href="/register" className="flex-1">
                      <Button variant="secondary" fullWidth className="text-green-800">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
