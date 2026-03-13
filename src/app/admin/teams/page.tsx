import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";

export const dynamic = 'force-dynamic';

async function getTeams() {
  return prisma.team.findMany({
    include: {
      manager: { select: { name: true } },
      _count: { select: { players: true } },
      leagues: {
        include: { league: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });
}

export default async function AdminTeamsPage() {
  const teams = await getTeams();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teams ({teams.length})</h1>
        <Link href="/admin/teams/new" className="bg-[#769FCD] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#5A8BBE]">
          + Create Team
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Team</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">City</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Manager</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Players</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">League</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: t.jerseyColor || "#16a34a" }}
                      >
                        {t.shortName?.charAt(0)}
                      </div>
                      <span className="font-medium">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{t.city || "-"}</td>
                  <td className="px-3 py-3 text-gray-600">{t.manager.name}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{t._count.players}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">
                    {t.leagues[0] ? (
                      <div className="flex items-center gap-1">
                        <StatusBadge status={t.leagues[0].status} />
                        <span>{t.leagues[0].league.name}</span>
                      </div>
                    ) : "-"}
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/teams/${t.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {teams.length === 0 && <p className="text-center py-10 text-gray-400">No teams found</p>}
        </div>
      </Card>
    </div>
  );
}
