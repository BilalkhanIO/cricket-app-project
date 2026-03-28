import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import PublicShell from "@/components/layout/PublicShell";

export const dynamic = 'force-dynamic';

async function getTeams() {
  return prisma.team.findMany({
    include: {
      manager: { select: { name: true } },
      _count: { select: { players: true, homeMatches: true, awayMatches: true } },
    },
    orderBy: { name: "asc" },
  });
}

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <PublicShell>
      <section className="section-banner border-x-0 border-t-0 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[#c8c8b0]">Club Directory</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Teams</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d6d9df] md:text-base">
                Browse registered clubs, squad sizes, match activity, and team identities across the platform.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-6 py-4 text-center">
              <div className="text-3xl font-bold text-white">{teams.length}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#c4c6cf]">Registered Teams</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {teams.length === 0 ? (
            <Card>
              <CardBody className="text-center py-16">
                <div className="text-5xl mb-4">👕</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Teams Yet</h3>
                <p className="text-gray-500">Teams will appear here once registered.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {teams.map((team) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <Card hoverable className="h-full">
                    <CardBody>
                      <div className="text-center mb-4">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-lg"
                          style={{ backgroundColor: team.jerseyColor || "#16a34a" }}
                        >
                          {team.shortName}
                        </div>
                        <h3 className="font-bold text-gray-900">{team.name}</h3>
                        {team.city && <p className="text-sm text-gray-500">📍 {team.city}</p>}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="font-bold text-gray-900">{team._count.players}</div>
                          <div className="text-gray-500">Players</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="font-bold text-gray-900">
                            {team._count.homeMatches + team._count.awayMatches}
                          </div>
                          <div className="text-gray-500">Matches</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="font-bold text-gray-900">{team.shortName}</div>
                          <div className="text-gray-500">Code</div>
                        </div>
                      </div>

                      {team.manager && (
                        <p className="text-xs text-gray-400 text-center mt-3">
                          Manager: {team.manager.name}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          )}
      </div>
    </PublicShell>
  );
}
