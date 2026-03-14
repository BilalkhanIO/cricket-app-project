import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import AssignScorerInline from "./AssignScorerInline";

export const dynamic = 'force-dynamic';

async function getMatches() {
  return prisma.match.findMany({
    include: {
      homeTeam: { select: { name: true, shortName: true } },
      awayTeam: { select: { name: true, shortName: true } },
      league: { select: { name: true } },
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

export default async function AdminMatchesPage() {
  const [matches, scorers] = await Promise.all([getMatches(), getScorers()]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Match Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {matches.length} matches · {scorers.length} scorer{scorers.length !== 1 ? "s" : ""} available
          </p>
        </div>
        <Link href="/admin/matches/new" className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">
          + Schedule Match
        </Link>
      </div>

      {scorers.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
          No users with SCORER role found.{" "}
          <Link href="/admin/users" className="font-medium underline">
            Assign SCORER role to a user
          </Link>{" "}
          before you can assign scorers to matches.
        </div>
      )}

      {matches.length === 0 && (
        <Card>
          <p className="text-center py-10 text-gray-400">No matches found</p>
        </Card>
      )}

      {matches.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {matches.map((m) => (
              <Card key={m.id}>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{m.league.name}</p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">Date</p>
                      <p>{formatDateTime(m.matchDate)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">Venue</p>
                      <p>{m.venue?.name || "-"}{m.venue?.city ? `, ${m.venue.city}` : ""}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Scorer</p>
                    <AssignScorerInline
                      matchId={m.id}
                      currentScorerId={m.scorerId}
                      currentScorerName={m.scorer?.name ?? null}
                      scorers={scorers}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link href={`/matches/${m.id}`} className="text-xs font-medium text-blue-600 hover:underline">View</Link>
                    {["UPCOMING", "TOSS", "LIVE", "INNINGS_BREAK"].includes(m.status) && (
                      <Link href={`/scorer/${m.id}`} className="text-xs font-medium text-red-600 hover:underline">Score</Link>
                    )}
                    <Link href={`/admin/matches/${m.id}/playing-xi`} className="text-xs font-medium text-[#769FCD] hover:underline">XI</Link>
                    <Link href={`/admin/matches/${m.id}/officials`} className="text-xs font-medium text-purple-600 hover:underline">Officials</Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Match</th>
                    <th className="px-3 py-3 text-xs font-medium text-gray-500">League</th>
                    <th className="px-3 py-3 text-xs font-medium text-gray-500">Date</th>
                    <th className="px-3 py-3 text-xs font-medium text-gray-500">Venue</th>
                    <th className="px-3 py-3 text-xs font-medium text-gray-500">Status</th>
                    <th className="px-3 py-3 text-xs font-medium text-gray-500">Scorer</th>
                    <th className="px-3 py-3 text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                      </td>
                      <td className="px-3 py-3 text-gray-600 text-xs">{m.league.name}</td>
                      <td className="px-3 py-3 text-gray-600 text-xs">{formatDateTime(m.matchDate)}</td>
                      <td className="px-3 py-3 text-gray-600 text-xs">{m.venue?.city || "-"}</td>
                      <td className="px-3 py-3"><StatusBadge status={m.status} /></td>
                      <td className="px-3 py-3">
                        <AssignScorerInline
                          matchId={m.id}
                          currentScorerId={m.scorerId}
                          currentScorerName={m.scorer?.name ?? null}
                          scorers={scorers}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <Link href={`/matches/${m.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                          {["UPCOMING", "TOSS", "LIVE", "INNINGS_BREAK"].includes(m.status) && (
                            <Link href={`/scorer/${m.id}`} className="text-xs text-red-600 hover:underline">Score</Link>
                          )}
                          <Link href={`/admin/matches/${m.id}/playing-xi`} className="text-xs text-[#769FCD] hover:underline">XI</Link>
                          <Link href={`/admin/matches/${m.id}/officials`} className="text-xs text-purple-600 hover:underline">Officials</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
