import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

async function getMatches() {
  return prisma.match.findMany({
    include: {
      homeTeam: { select: { name: true, shortName: true } },
      awayTeam: { select: { name: true, shortName: true } },
      league: { select: { name: true } },
      venue: { select: { name: true, city: true } },
      scorer: { select: { name: true } },
    },
    orderBy: { matchDate: "desc" },
  });
}

export default async function AdminMatchesPage() {
  const matches = await getMatches();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Matches ({matches.length})</h1>
        <Link href="/admin/matches/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Schedule Match
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Match</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">League</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Date</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Venue</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Status</th>
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
                    <div className="flex gap-2">
                      <Link href={`/matches/${m.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                      {["UPCOMING", "TOSS", "LIVE", "INNINGS_BREAK"].includes(m.status) && (
                        <Link href={`/scorer/${m.id}`} className="text-xs text-red-600 hover:underline">Score</Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {matches.length === 0 && (
            <p className="text-center py-10 text-gray-400">No matches found</p>
          )}
        </div>
      </Card>
    </div>
  );
}
