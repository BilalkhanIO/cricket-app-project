import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

async function getLeague(id: string) {
  return prisma.league.findUnique({
    where: { id },
    include: {
      admin: { select: { name: true } },
      teams: {
        include: {
          team: {
            include: {
              manager: { select: { name: true } },
              _count: { select: { players: true } },
            },
          },
        },
      },
      matches: {
        include: {
          homeTeam: { select: { name: true, shortName: true } },
          awayTeam: { select: { name: true, shortName: true } },
          venue: { select: { name: true, city: true } },
        },
        orderBy: { matchDate: "asc" },
      },
      pointsTable: {
        include: { team: { select: { name: true, shortName: true } } },
        orderBy: [{ points: "desc" }, { netRunRate: "desc" }],
      },
    },
  });
}

export default async function AdminLeagueDetailPage({ params }: { params: { id: string } }) {
  const league = await getLeague(params.id);
  if (!league) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/leagues" className="text-gray-500 text-sm hover:text-gray-700">← Leagues</Link>
          <h1 className="text-2xl font-bold text-gray-900">{league.name}</h1>
          <StatusBadge status={league.status} />
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/matches/new?leagueId=${league.id}`} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
            + Schedule Match
          </Link>
          <Link href={`/leagues/${league.id}`} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200">
            Public View →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Teams", value: league.teams.length, sub: `${league.maxTeams} max` },
          { label: "Matches", value: league.matches.length },
          { label: "Format", value: league.matchFormat },
          { label: "Season", value: league.season },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
            {s.sub && <div className="text-xs text-gray-400">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Teams ({league.teams.length})</h2>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {league.teams.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">No teams registered</p>
            ) : (
              league.teams.map((tl) => (
                <div key={tl.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                      {tl.team.shortName?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tl.team.name}</p>
                      <p className="text-xs text-gray-400">{tl.team._count.players} players · {tl.team.manager.name}</p>
                    </div>
                  </div>
                  <StatusBadge status={tl.status} />
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Points Table */}
        <Card>
          <CardHeader>
            <h2 className="font-bold text-gray-900">Points Table</h2>
          </CardHeader>
          {league.pointsTable.length === 0 ? (
            <CardBody>
              <p className="text-center py-4 text-gray-400 text-sm">No data yet</p>
            </CardBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-2 text-gray-500">Team</th>
                    <th className="px-2 py-2 text-gray-500">M</th>
                    <th className="px-2 py-2 text-gray-500">W</th>
                    <th className="px-2 py-2 text-gray-500">L</th>
                    <th className="px-2 py-2 text-gray-500">Pts</th>
                    <th className="px-2 py-2 text-gray-500">NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {league.pointsTable.map((pt, i) => (
                    <tr key={pt.id} className="border-b border-gray-50">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 w-4">{i + 1}</span>
                          <span className="font-medium">{pt.team.shortName}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">{pt.matchesPlayed}</td>
                      <td className="px-2 py-2 text-center text-green-700">{pt.wins}</td>
                      <td className="px-2 py-2 text-center text-red-600">{pt.losses}</td>
                      <td className="px-2 py-2 text-center font-bold">{pt.points}</td>
                      <td className={`px-2 py-2 text-center font-medium ${pt.netRunRate >= 0 ? "text-green-700" : "text-red-600"}`}>
                        {pt.netRunRate > 0 ? "+" : ""}{pt.netRunRate.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Matches */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Fixtures ({league.matches.length})</h2>
            <Link href={`/admin/matches/new?leagueId=${league.id}`} className="text-green-600 text-sm hover:underline">+ Add Match</Link>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Match</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Date</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Venue</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {league.matches.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{m.homeTeam.shortName} vs {m.awayTeam.shortName}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{formatDate(m.matchDate)}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{m.venue?.city || "-"}</td>
                  <td className="px-3 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Link href={`/matches/${m.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                      {["UPCOMING", "TOSS", "LIVE"].includes(m.status) && (
                        <Link href={`/scorer/${m.id}`} className="text-xs text-red-600 hover:underline">Score</Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {league.matches.length === 0 && (
            <p className="text-center py-8 text-gray-400 text-sm">No matches scheduled yet</p>
          )}
        </div>
      </Card>
    </div>
  );
}
