import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import AwardFormClient from "./AwardFormClient";
import AwardListClient from "./AwardListClient";

export const dynamic = 'force-dynamic';

async function getLeagueWithAwards(id: string) {
  return prisma.league.findUnique({
    where: { id },
    include: {
      awards: {
        include: {
          player: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
      teams: {
        where: { status: "APPROVED" },
        include: {
          team: {
            include: {
              players: { include: { user: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });
}

export default async function LeagueAwardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const league = await getLeagueWithAwards(id);
  if (!league) notFound();

  const allPlayers = league.teams.flatMap((tl) =>
    tl.team.players.map((p) => ({ id: p.id, name: p.user.name, team: tl.team.name }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/leagues/${id}`} className="text-gray-500 text-sm hover:text-gray-700">
          ← {league.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Awards Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Award Form */}
        <Card>
          <CardHeader>
            <h2 className="font-bold text-gray-900">Create Award</h2>
          </CardHeader>
          <CardBody>
            <AwardFormClient leagueId={id} players={allPlayers} />
          </CardBody>
        </Card>

        {/* Awards List */}
        <Card>
          <CardHeader>
            <h2 className="font-bold text-gray-900">Awards ({league.awards.length})</h2>
          </CardHeader>
          <CardBody className="p-0">
            <AwardListClient leagueId={id} awards={league.awards} players={allPlayers} />
          </CardBody>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800 text-sm font-medium">Admin Links</p>
        <div className="flex gap-4 mt-2">
          <Link href={`/admin/leagues/${id}/sponsors`} className="text-blue-600 text-sm hover:underline">
            Manage Sponsors →
          </Link>
          <Link href={`/admin/leagues/${id}/media`} className="text-blue-600 text-sm hover:underline">
            Manage Media →
          </Link>
          <Link href={`/admin/leagues/${id}`} className="text-blue-600 text-sm hover:underline">
            League Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
