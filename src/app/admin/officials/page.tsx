import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Officials — Admin",
};

async function getOfficials() {
  const officials = await prisma.matchOfficial.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      match: {
        select: {
          id: true,
          matchDate: true,
          status: true,
          homeTeam: { select: { shortName: true } },
          awayTeam: { select: { shortName: true } },
          league: { select: { name: true } },
        },
      },
    },
    orderBy: { match: { matchDate: "desc" } },
  });
  return officials;
}

export default async function AdminOfficialsPage() {
  const allRows = await getOfficials();

  // Group by linked userId first, then by name for unlinked officials
  const officialMap = new Map<
    string,
    {
      key: string;
      name: string;
      email?: string;
      userId?: string;
      assignments: typeof allRows;
    }
  >();

  for (const row of allRows) {
    const key = row.userId ?? `name:${row.name.toLowerCase().trim()}`;
    if (!officialMap.has(key)) {
      officialMap.set(key, {
        key,
        name: row.user?.name ?? row.name,
        email: row.user?.email,
        userId: row.userId ?? undefined,
        assignments: [],
      });
    }
    officialMap.get(key)!.assignments.push(row);
  }

  const officials = Array.from(officialMap.values()).sort(
    (a, b) => b.assignments.length - a.assignments.length
  );

  const roleGroups = allRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.role] = (acc[r.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 text-[#d4e3ff]">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9a8569]">Admin</p>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-black uppercase tracking-tight text-white">Officials</h1>
        <p className="mt-2 text-sm text-[#9a8569]">
          All umpires, scorers, and referees assigned to matches. {officials.length} unique officials across {allRows.length} assignments.
        </p>
      </div>

      {/* Role breakdown */}
      {Object.keys(roleGroups).length > 0 && (
        <section>
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#9a8569]">By role</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(roleGroups)
              .sort((a, b) => b[1] - a[1])
              .map(([role, count]) => (
                <div key={role} className="border border-white/10 bg-[#102433] px-4 py-3 min-w-[120px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9a8569]">{role}</p>
                  <p className="mt-1 text-2xl font-black text-white">{count}</p>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Officials list */}
      <section>
        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#9a8569]">Official roster</p>

        {officials.length === 0 ? (
          <div className="border border-white/10 bg-[#102433] px-6 py-12 text-center">
            <p className="text-sm text-[#9a8569]">No officials assigned to any matches yet.</p>
            <p className="mt-2 text-xs text-[#9a8569]">
              Assign officials from the{" "}
              <Link href="/admin/matches" className="text-[#4ae183] hover:underline">
                match pages
              </Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {officials.map((official) => {
              const recentAssignments = official.assignments.slice(0, 5);
              const roleSet = new Set(official.assignments.map((a) => a.role));
              return (
                <div key={official.key} className="border border-white/10 bg-[#102433]">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#1b3656] text-sm font-black text-white">
                        {official.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">{official.name}</p>
                          {official.userId && (
                            <span className="bg-[#4ae183]/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#4ae183]">
                              Linked
                            </span>
                          )}
                        </div>
                        {official.email && (
                          <p className="text-[10px] text-[#9a8569]">{official.email}</p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Array.from(roleSet).map((role) => (
                            <span key={role} className="bg-[#1b3656] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#d4e3ff]">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-[#4ae183]">{official.assignments.length}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9a8569]">
                        {official.assignments.length === 1 ? "match" : "matches"}
                      </p>
                    </div>
                  </div>

                  {/* Recent assignments */}
                  <div className="divide-y divide-white/5">
                    {recentAssignments.map((assignment) => (
                      <Link
                        key={assignment.id}
                        href={`/admin/matches/${assignment.matchId}/officials`}
                        className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-[#0d2233]"
                      >
                        <div>
                          <p className="text-sm font-bold text-[#d4e3ff]">
                            {assignment.match.homeTeam.shortName} vs {assignment.match.awayTeam.shortName}
                          </p>
                          <p className="text-[10px] text-[#9a8569]">
                            {assignment.match.league.name}
                            {assignment.match.matchDate
                              ? ` · ${new Date(assignment.match.matchDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9bb2d1]">
                            {assignment.role}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${
                            assignment.match.status === "COMPLETED"
                              ? "bg-[#1b3656] text-[#d4e3ff]"
                              : assignment.match.status === "LIVE" || assignment.match.status === "INNINGS_BREAK"
                              ? "bg-[#003919] text-[#4ae183]"
                              : "bg-[#12324d] text-[#9bb2d1]"
                          }`}>
                            {assignment.match.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {official.assignments.length > 5 && (
                      <p className="px-5 py-2 text-[10px] text-[#9a8569]">
                        +{official.assignments.length - 5} more assignments
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
