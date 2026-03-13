import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1B3A5C] text-[#B9D7EA]">
      {/* Top accent */}
      <div className="h-0.5 bg-gradient-to-r from-[#769FCD] via-[#B9D7EA] to-[#769FCD]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/home" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-10 h-10 bg-[#769FCD] rounded-xl flex items-center justify-center text-2xl shadow-sm">
                🏏
              </div>
              <div>
                <span className="font-bold text-xl text-white block leading-tight">CricketLeague</span>
                <span className="text-xs text-[#769FCD] tracking-widest uppercase">Pro Platform</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-[#B9D7EA] max-w-xs">
              The complete platform for managing cricket leagues, tracking live scores, and following your favorite teams — all in one place.
            </p>

            <div className="flex gap-3 mt-5">
              {["🏆", "🏏", "📊", "🌟"].map((icon, i) => (
                <div key={i} className="w-9 h-9 bg-[#2D5484] rounded-lg flex items-center justify-center text-base hover:bg-[#769FCD] transition-colors cursor-pointer">
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Explore</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/leagues", label: "Leagues" },
                { href: "/matches", label: "Matches" },
                { href: "/teams",   label: "Teams" },
                { href: "/players", label: "Players" },
                { href: "/stats",   label: "Statistics" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-1.5 group">
                    <span className="w-1 h-1 bg-[#769FCD] rounded-full group-hover:w-2 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Statistics</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/stats",               label: "Leaderboards" },
                { href: "/stats?tab=batting",   label: "Top Batters" },
                { href: "/stats?tab=bowling",   label: "Top Bowlers" },
                { href: "/stats?tab=allrounder",label: "All-Rounders" },
                { href: "/stats?tab=fielding",  label: "Fielding" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-1.5 group">
                    <span className="w-1 h-1 bg-[#769FCD] rounded-full group-hover:w-2 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Account</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/login",    label: "Login" },
                { href: "/register", label: "Register" },
                { href: "/profile",  label: "My Profile" },
                { href: "/admin",    label: "Admin Panel" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-1.5 group">
                    <span className="w-1 h-1 bg-[#769FCD] rounded-full group-hover:w-2 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8 py-6 border-y border-[#2D5484]">
          {[
            { value: "100+", label: "Matches Managed" },
            { value: "20+",  label: "Active Leagues" },
            { value: "500+", label: "Registered Players" },
            { value: "Live", label: "Real-time Scoring" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-[#769FCD]">{stat.value}</p>
              <p className="text-xs text-[#B9D7EA] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#769FCD]">
          <p>© {year} CricketLeague App. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
