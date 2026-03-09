import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-green-900 text-green-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏏</span>
              <span className="font-bold text-white text-lg">CricketLeague</span>
            </div>
            <p className="text-sm text-green-300">
              The complete platform for managing cricket leagues, teams, and live scoring.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/leagues", label: "Leagues" },
                { href: "/matches", label: "Matches" },
                { href: "/teams", label: "Teams" },
                { href: "/players", label: "Players" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Statistics</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/stats", label: "Leaderboards" },
                { href: "/stats?tab=batting", label: "Top Batters" },
                { href: "/stats?tab=bowling", label: "Top Bowlers" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Account</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/login", label: "Login" },
                { href: "/register", label: "Register" },
                { href: "/admin", label: "Admin Panel" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-green-800 mt-8 pt-6 text-center text-sm text-green-400">
          <p>© {new Date().getFullYear()} CricketLeague App. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
