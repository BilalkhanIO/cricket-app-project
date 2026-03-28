import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import { formatDateTime } from "@/lib/utils";
import { canScoreMatch } from "@/lib/permissions";

export const dynamic = "force-dynamic";

async function getScorerData(userId: string) {
  return prisma.match.findMany({
    where: { scorerId: userId },
    include: {
      homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      league: { select: { id: true, name: true } },
      venue: { select: { name: true, city: true } },
      innings: {
        include: { team: { select: { shortName: true } } },
        orderBy: { inningsNumber: "asc" },
      },
    },
    orderBy: { matchDate: "desc" },
    take: 50,
  });
}

function getStatusTone(status: string) {
  if (status === "LIVE" || status === "INNINGS_BREAK") return "bg-[#93000a] text-[#ffdad6]";
  if (status === "COMPLETED") return "bg-[#4ae183] text-[#003919]";
  if (status === "TOSS") return "bg-[#c8c8b0] text-[#303221]";
  return "bg-[#12324d] text-[#d4e3ff]";
}

export default async function ScorerDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || !canScoreMatch(session.user.role)) {
    redirect("/login");
  }

  const matches = await getScorerData(session.user.id);
  const live = matches.filter((match) => match.status === "LIVE" || match.status === "INNINGS_BREAK");
  const upcoming = matches.filter((match) => match.status === "UPCOMING" || match.status === "TOSS");
  const completed = matches.filter((match) => match.status === "COMPLETED");

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
              Scorer operations
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div className="space-y-5">
                <h1 className="font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                  Scorer
                  <span className="block text-[#4ae183]">assignment queue</span>
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1] sm:text-base">
                  Active scoring sessions, toss-ready fixtures, and completed assignments for {session.user.name}.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: live.length, label: "Live now" },
                  { value: upcoming.length, label: "Upcoming" },
                  { value: completed.length, label: "Completed" },
                ].map((stat) => (
                  <div key={stat.label} className="border border-white/10 bg-[#001c3a] px-4 py-4 text-center">
                    <p className="font-[var(--font-display)] text-3xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-screen-xl px-4 pb-16 pt-10 sm:px-6 lg:pb-20 lg:pt-12">
          {matches.length === 0 ? (
            <div className="border border-white/10 bg-[#001c3a] px-6 py-12 text-center">
              <p className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">No assignments yet</p>
              <p className="mt-3 text-sm text-[#9bb2d1]">League admins need to assign you to a match before it appears here.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {[
                { title: "Live matches", items: live },
                { title: "Upcoming matches", items: upcoming },
                { title: "Completed matches", items: completed.slice(0, 10) },
              ].map((group) =>
                group.items.length > 0 ? (
                  <section key={group.title}>
                    <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                      {group.title}
                    </h2>
                    <div className="mt-6 grid gap-4">
                      {group.items.map((match) => {
                        const inn1 = match.innings.find((inning) => inning.inningsNumber === 1);
                        const inn2 = match.innings.find((inning) => inning.inningsNumber === 2);
                        const canScore = ["LIVE", "INNINGS_BREAK", "UPCOMING", "TOSS"].includes(match.status);

                        return (
                          <div key={match.id} className="border border-white/10 bg-[#001c3a] p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <p className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                                    {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                                  </p>
                                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(match.status)}`}>
                                    {match.status.replace(/_/g, " ")}
                                  </span>
                                </div>
                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                                  {match.league.name} · {formatDateTime(match.matchDate)}
                                  {match.venue ? ` · ${match.venue.name}, ${match.venue.city}` : ""}
                                </p>

                                {(inn1 || inn2) && (
                                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    {inn1 && (
                                      <div className="border border-white/10 bg-[#00142b] px-4 py-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{inn1.team.shortName}</p>
                                        <p className="mt-2 font-[var(--font-display)] text-3xl font-black text-white">
                                          {inn1.totalRuns}/{inn1.totalWickets}
                                        </p>
                                      </div>
                                    )}
                                    {inn2 && (
                                      <div className="border border-white/10 bg-[#00142b] px-4 py-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{inn2.team.shortName}</p>
                                        <p className="mt-2 font-[var(--font-display)] text-3xl font-black text-white">
                                          {inn2.totalRuns}/{inn2.totalWickets}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 lg:min-w-[12rem]">
                                {canScore && (
                                  <Link href={`/scorer/${match.id}`} className="bg-[#4ae183] px-4 py-3 text-center text-sm font-black uppercase tracking-[0.18em] text-[#003919]">
                                    {match.status === "UPCOMING" || match.status === "TOSS" ? "Start scoring" : "Continue scoring"}
                                  </Link>
                                )}
                                <Link href={`/matches/${match.id}`} className="bg-[#12324d] px-4 py-3 text-center text-sm font-black uppercase tracking-[0.18em] text-[#d4e3ff]">
                                  View match
                                </Link>
                                {match.status === "UPCOMING" && (
                                  <Link href={`/admin/matches/${match.id}/playing-xi`} className="bg-[#1b3656] px-4 py-3 text-center text-sm font-black uppercase tracking-[0.18em] text-white">
                                    Set playing XI
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
