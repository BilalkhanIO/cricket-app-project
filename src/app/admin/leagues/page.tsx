import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const dynamic = 'force-dynamic';

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
  const activeCount = leagues.filter((league) => league.status === "ACTIVE").length;
  const registrationCount = leagues.filter((league) => league.status === "REGISTRATION").length;

  return (
    <div className="space-y-5">
      <div className="section-banner rounded-[2rem] px-6 py-7 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[#c8c8b0]">League Operations</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">League Management</h1>
            <p className="mt-2 text-sm text-[#c4c6cf]">
              Create competitions, review registration state, and move into fixture and scoring operations from one control surface.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/10 px-4 py-3 text-center">
              <div className="text-2xl font-bold">{leagues.length}</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#c4c6cf]">Total</div>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/10 px-4 py-3 text-center">
              <div className="text-2xl font-bold">{activeCount}</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#c4c6cf]">Active</div>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/10 px-4 py-3 text-center">
              <div className="text-2xl font-bold">{registrationCount}</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#c4c6cf]">Open</div>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <Link href="/admin/leagues/new" className="inline-flex items-center rounded-xl bg-[#06bb63] px-4 py-2 text-sm font-semibold text-[#00142b] hover:bg-[#4ae183]">
            + Create League
          </Link>
        </div>
      </div>

      {leagues.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Leagues</h3>
            <Link href="/admin/leagues/new" className="text-[color:var(--primary)] hover:underline">Create your first league →</Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leagues.map((league) => (
            <Link key={league.id} href={`/admin/leagues/${league.id}`}>
              <Card hoverable className="h-full">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-[color:var(--card-muted)] rounded-xl flex items-center justify-center text-2xl">🏆</div>
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
