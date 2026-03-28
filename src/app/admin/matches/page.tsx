import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import AssignScorerInline from "./AssignScorerInline";

export const dynamic = "force-dynamic";

async function getMatches() {
  return prisma.match.findMany({
    include: {
      homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      league: { select: { id: true, name: true } },
      venue: { select: { name: true, city: true } },
      scorer: { select: { id: true, name: true } },
    },
    orderBy: { matchDate: "desc" },
  });
}

async function getScorers() {
  return prisma.user.findMany({
    where: { role: "SCORER", isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

function getStatusTone(status: string) {
  if (status === "LIVE" || status === "INNINGS_BREAK") return "bg-[#93000a] text-[#ffdad6]";
  if (status === "COMPLETED") return "bg-[#4ae183] text-[#003919]";
  if (status === "TOSS") return "bg-[#c8c8b0] text-[#303221]";
  return "bg-[#12324d] text-[#d4e3ff]";
}

export default async function AdminMatchesPage() {
  const [matches, scorers] = await Promise.all([getMatches(), getScorers()]);
  const live = matches.filter((match) => match.status === "LIVE" || match.status === "INNINGS_BREAK");
  const upcoming = matches.filter((match) => match.status === "UPCOMING" || match.status === "TOSS");
  const completed = matches.filter((match) => match.status === "COMPLETED");

  return (
    <div className="space-y-8">
      <section className="border border-white/10 bg-[#0d2030] p-6 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">Match management</p>
            <h1 className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tight">Fixtures, scorers, and live control</h1>
            <p className="max-w-2xl text-sm leading-7 text-[#9bb2d1]">
              Assign scorers, review live fixtures, prepare toss-ready matches, and jump into editing or scoring from one management board.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/admin/matches/new" className="bg-[#4ae183] px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#003919]">
              Schedule match
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "All fixtures", value: matches.length },
            { label: "Live", value: live.length },
            { label: "Upcoming", value: upcoming.length },
            { label: "Scorers", value: scorers.length },
          ].map((item) => (
            <div key={item.label} className="border border-white/10 bg-[#00142b] px-4 py-4">
              <p className="font-[var(--font-display)] text-3xl font-black text-white">{item.value}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {scorers.length === 0 && (
        <div className="border border-yellow-700/50 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-200">
          No users with `SCORER` role found. Assign the role from <Link href="/admin/users" className="font-bold underline">users</Link> before assigning scorers.
        </div>
      )}

      {matches.length === 0 ? (
        <div className="border border-white/10 bg-[#0d2030] px-6 py-12 text-center">
          <p className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">No matches scheduled</p>
        </div>
      ) : (
        <div className="space-y-10">
          {[
            { title: "Live fixtures", items: live },
            { title: "Upcoming fixtures", items: upcoming },
            { title: "Completed fixtures", items: completed },
          ].map((group) =>
            group.items.length > 0 ? (
              <section key={group.title}>
                <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                  {group.title}
                </h2>
                <div className="mt-6 grid gap-4">
                  {group.items.map((match) => (
                    <div key={match.id} className="border border-white/10 bg-[#0d2030] p-5 text-white">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight">
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
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_auto] xl:min-w-[28rem]">
                          <div className="border border-white/10 bg-[#00142b] px-4 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1] mb-2">Assigned scorer</p>
                            <AssignScorerInline
                              matchId={match.id}
                              currentScorerId={match.scorerId}
                              currentScorerName={match.scorer?.name ?? null}
                              scorers={scorers}
                            />
                          </div>

                          <div className="flex flex-wrap gap-2 xl:justify-end">
                            <Link href={`/matches/${match.id}`} className="bg-[#12324d] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#d4e3ff]">
                              View
                            </Link>
                            {["UPCOMING", "TOSS", "LIVE", "INNINGS_BREAK"].includes(match.status) && (
                              <Link href={`/scorer/${match.id}`} className="bg-[#4ae183] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#003919]">
                                Score
                              </Link>
                            )}
                            <Link href={`/admin/matches/${match.id}/playing-xi`} className="bg-[#1b3656] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">
                              Playing XI
                            </Link>
                            <Link href={`/admin/matches/${match.id}/officials`} className="bg-[#12324d] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#d4e3ff]">
                              Officials
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
