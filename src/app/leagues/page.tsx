import prisma from "@/lib/prisma";
import PublicShell from "@/components/layout/PublicShell";
import LeaguesClient from "./LeaguesClient";

export const dynamic = "force-dynamic";

async function getLeagues() {
  return prisma.league.findMany({
    include: {
      admin: { select: { name: true } },
      parentLeague: { select: { id: true, name: true } },
      _count: { select: { teams: true, matches: true, seasons: true, playerRegistrations: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export default async function LeaguesPage() {
  const leagues = await getLeagues();
  const activeLeagues = leagues.filter((league) => league.status === "ACTIVE");
  const setupLeagues = leagues.filter((league) => league.status === "REGISTRATION" || league.status === "DRAFT");
  const completedLeagues = leagues.filter((league) => league.status === "COMPLETED");

  return (
    <PublicShell mainClassName="overflow-hidden">
      <div className="bg-[#00142b] text-[#d4e3ff]">
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
              Competition directory
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div className="space-y-5">
                <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                  Leagues,
                  <span className="block text-[#4ae183]">seasons, and match operations</span>
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1] sm:text-base">
                  Browse active competitions, setup phases, completed seasons, and multi-season league families from one public board.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href="#league-directory"
                    className="bg-[#4ae183] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-[#003919] transition hover:bg-[#6bfe9c]"
                  >
                    Open directory
                  </a>
                  <a
                    href="#setup-pipeline"
                    className="bg-[#1b3656] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-[#234669]"
                  >
                    Setup pipeline
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { value: leagues.length, label: "All leagues" },
                  { value: activeLeagues.length, label: "Active now" },
                  { value: setupLeagues.length, label: "In setup" },
                  { value: completedLeagues.length, label: "Archived" },
                ].map((stat) => (
                  <div key={stat.label} className="border border-white/10 bg-[#001c3a] px-4 py-4">
                    <p className="font-[var(--font-display)] text-3xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <LeaguesClient leagues={leagues} />
      </div>
    </PublicShell>
  );
}
