import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const dynamic = 'force-dynamic';

async function getLeague(id: string) {
  return prisma.league.findUnique({
    where: { id },
    include: {
      parentLeague: { select: { id: true, name: true, season: true, year: true } },
      seasons: {
        select: { id: true, season: true, year: true, status: true },
        orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      },
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
      playerRegistrations: true,
    },
  });
}

export default async function AdminLeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const league = await getLeague(id);
  if (!league) notFound();
  const approvedTeams = league.teams.filter((team) => team.status === "APPROVED").length;
  const pendingTeams = league.teams.filter((team) => team.status === "PENDING").length;
  const liveMatches = league.matches.filter((match) => match.status === "LIVE").length;
  const approvedPlayers = league.playerRegistrations.filter((player) => player.status === "APPROVED").length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="section-banner rounded-[2rem] px-5 py-6 text-white sm:px-6 sm:py-7">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link href="/admin/leagues" className="text-[#c8c8b0] text-sm hover:text-white">← Leagues</Link>
            <h1 className="text-xl sm:text-3xl font-bold">{league.name}</h1>
            <StatusBadge status={league.status} />
          </div>
          <p className="text-sm text-[#d6d9df]">
            {league.matchFormat} · {league.season} · {formatDate(league.startDate)} to {formatDate(league.endDate)}
          </p>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-[#c8c8b0]">
            <span>Player registration: {league.playerRegistrationStatus}</span>
            {league.parentLeague && (
              <span>
                Parent competition: {league.parentLeague.name}
              </span>
            )}
            {league.seasons.length > 0 && <span>Seasons in series: {league.seasons.length}</span>}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <Link href={`/admin/leagues/${league.id}/teams`} className="inline-flex items-center justify-center bg-[color:var(--primary)] text-white px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-[color:var(--primary-dark)]">
            Team Registrations
          </Link>
          <Link href={`/admin/leagues/${league.id}/players`} className="inline-flex items-center justify-center bg-emerald-600 text-white px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700">
            Player Management
          </Link>
          <Link href={`/admin/leagues/${league.id}/fixtures`} className="inline-flex items-center justify-center bg-[color:var(--primary-dark)] text-white px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#17364e]">
            Generate Fixtures
          </Link>
          <Link href={`/admin/matches/new?leagueId=${league.id}`} className="inline-flex items-center justify-center bg-blue-600 text-white px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">
            + Schedule Match
          </Link>
          <Link href={`/admin/leagues/${league.id}/awards`} className="inline-flex items-center justify-center bg-yellow-500 text-white px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-yellow-600">
            Awards
          </Link>
          <Link href={`/admin/leagues/${league.id}/sponsors`} className="inline-flex items-center justify-center bg-purple-600 text-white px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700">
            Sponsors
          </Link>
          <Link href={`/admin/leagues/${league.id}/media`} className="inline-flex items-center justify-center bg-rose-600 text-white px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-700">
            Media
          </Link>
          <Link href={`/leagues/${league.id}`} className="inline-flex items-center justify-center bg-white/10 text-white px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/15">
            Public View →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Approved Teams", value: approvedTeams, sub: `${pendingTeams} pending` },
          { label: "Matches", value: league.matches.length, sub: `${liveMatches} live` },
          { label: "Players", value: league.playerRegistrations.length, sub: `${approvedPlayers} approved` },
          { label: "Season", value: league.season, sub: league.parentLeague ? league.parentLeague.name : league.matchFormat },
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
                    <div className="w-8 h-8 bg-[color:var(--card-muted)] rounded-full flex items-center justify-center text-xs font-bold text-[#17364e]">
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
            <>
              <div className="divide-y md:hidden">
                {league.pointsTable.map((pt, i) => (
                  <div key={pt.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{i + 1}. {pt.team.shortName}</p>
                      <p className="text-sm font-bold text-gray-900">{pt.points} pts</p>
                    </div>
                    <div className="mt-1 grid grid-cols-4 text-xs text-gray-500">
                      <span>M {pt.matchesPlayed}</span>
                      <span className="text-[#17364e]">W {pt.wins}</span>
                      <span className="text-red-600">L {pt.losses}</span>
                      <span className={pt.netRunRate >= 0 ? "text-[#17364e]" : "text-red-600"}>
                        NRR {pt.netRunRate > 0 ? "+" : ""}{pt.netRunRate.toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto hidden md:block">
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
                        <td className="px-2 py-2 text-center text-[#17364e]">{pt.wins}</td>
                        <td className="px-2 py-2 text-center text-red-600">{pt.losses}</td>
                        <td className="px-2 py-2 text-center font-bold">{pt.points}</td>
                        <td className={`px-2 py-2 text-center font-medium ${pt.netRunRate >= 0 ? "text-[#17364e]" : "text-red-600"}`}>
                          {pt.netRunRate > 0 ? "+" : ""}{pt.netRunRate.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Matches */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Fixtures ({league.matches.length})</h2>
            <Link href={`/admin/matches/new?leagueId=${league.id}`} className="text-[color:var(--primary)] text-sm hover:underline">+ Add Match</Link>
          </div>
        </CardHeader>
        {league.matches.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">No matches scheduled yet</p>
        )}
        {league.matches.length > 0 && (
          <>
            <div className="divide-y md:hidden">
              {league.matches.map((m) => (
                <div key={m.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                    </p>
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <span>{formatDate(m.matchDate)}</span>
                    <span>{m.venue?.city || "-"}</span>
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/matches/${m.id}`} className="text-xs text-blue-600 font-medium hover:underline">View</Link>
                    {["UPCOMING", "TOSS", "LIVE"].includes(m.status) && (
                      <Link href={`/scorer/${m.id}`} className="text-xs text-red-600 font-medium hover:underline">Score</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto hidden md:block">
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
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
