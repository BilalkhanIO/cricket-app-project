import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

async function getLeagues() {
  return prisma.league.findMany({
    include: {
      admin: { select: { name: true } },
      _count: { select: { teams: true, matches: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function AdminLeaguesPage() {
  const leagues = await getLeagues();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leagues</h1>
        <Link href="/admin/leagues/new" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
          + Create League
        </Link>
      </div>

      {leagues.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Leagues</h3>
            <Link href="/admin/leagues/new" className="text-green-600 hover:underline">Create your first league →</Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leagues.map((league) => (
            <Link key={league.id} href={`/admin/leagues/${league.id}`}>
              <Card hoverable className="h-full">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🏆</div>
                    <StatusBadge status={league.status} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{league.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{league.season} · {league.matchFormat} · {league.tournamentType.replace("_", " ")}</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="font-bold text-gray-900">{league._count.teams}</div>
                      <div className="text-gray-500">Teams</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="font-bold text-gray-900">{league._count.matches}</div>
                      <div className="text-gray-500">Matches</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="font-bold text-gray-900">{league.maxTeams}</div>
                      <div className="text-gray-500">Max</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(league.startDate)} – {formatDate(league.endDate)}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
