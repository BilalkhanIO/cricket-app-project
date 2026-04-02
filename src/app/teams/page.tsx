import Link from "next/link";
import prisma from "@/lib/prisma";
import PublicShell from "@/components/layout/PublicShell";

export const dynamic = "force-dynamic";

async function getTeams() {
  return prisma.team.findMany({
    include: {
      manager: { select: { name: true } },
      _count: { select: { players: true, homeMatches: true, awayMatches: true } },
    },
    orderBy: { name: "asc" },
  });
}

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <PublicShell mainClassName="overflow-hidden">
      <div className="bg-[#00142b] text-[#d4e3ff]">
        {/* Header */}
        <section className="relative overflow-hidden px-4 pb-8 pt-10 sm:px-6 lg:pb-10 lg:pt-12">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(74,225,131,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,225,131,0.06) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(27,54,86,0.95),transparent_52%),linear-gradient(180deg,rgba(0,20,43,0.22),#00142b_76%)]" />

          <div className="relative mx-auto max-w-screen-xl">
            <div className="inline-flex items-center gap-2 bg-[#1b3656] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#d4e3ff]">
              Club directory
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div className="space-y-5">
                <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                  Teams
                  <span className="block text-[#4ae183]">& clubs</span>
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1] sm:text-base">
                  Browse registered clubs, squad sizes, match activity, and team identities across the platform.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-white/10 bg-[#001c3a] px-4 py-4">
                  <p className="font-[var(--font-display)] text-3xl font-black text-white">{teams.length}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Registered teams</p>
                </div>
                <div className="border border-white/10 bg-[#001c3a] px-4 py-4">
                  <p className="font-[var(--font-display)] text-3xl font-black text-white">
                    {teams.reduce((sum, t) => sum + t._count.players, 0)}
                  </p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Players total</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Grid */}
        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:py-12">
          {teams.length === 0 ? (
            <div className="border border-white/10 bg-[#001c3a] p-10 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#4ae183]">No clubs yet</p>
              <p className="mt-3 font-[var(--font-display)] text-2xl font-black uppercase text-white">Teams will appear here</p>
              <p className="mt-2 text-sm text-[#9bb2d1]">Teams will appear here once registered in the system.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="group block border border-white/10 bg-[#001c3a] transition hover:bg-[#0b2747]"
                >
                  {/* Jersey colour top bar */}
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: team.jerseyColor || "#4ae183" }}
                  />
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-12 w-12 flex-none items-center justify-center text-sm font-black text-white"
                        style={{ backgroundColor: team.jerseyColor || "#1b3656" }}
                      >
                        {team.shortName.substring(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-[var(--font-display)] text-lg font-black uppercase tracking-tight text-white group-hover:text-[#4ae183] transition">
                          {team.name}
                        </p>
                        {team.city && (
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9bb2d1]">
                            {team.city}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                      <div className="text-center">
                        <p className="font-[var(--font-display)] text-xl font-black text-white">
                          {team._count.players}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Players</p>
                      </div>
                      <div className="text-center">
                        <p className="font-[var(--font-display)] text-xl font-black text-white">
                          {team._count.homeMatches + team._count.awayMatches}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Matches</p>
                      </div>
                      <div className="text-center">
                        <p className="font-[var(--font-display)] text-xl font-black text-[#4ae183]">
                          {team.shortName}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Code</p>
                      </div>
                    </div>

                    {team.manager && (
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7f9abd]">
                        Mgr: {team.manager.name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
