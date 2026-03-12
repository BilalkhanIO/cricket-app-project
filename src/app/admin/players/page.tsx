import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/Card";

export const dynamic = 'force-dynamic';

async function getPlayers() {
  return prisma.player.findMany({
    include: {
      user: { select: { name: true, email: true } },
      team: { select: { name: true, shortName: true } },
    },
    orderBy: { user: { name: "asc" } },
  });
}

export default async function AdminPlayersPage() {
  const players = await getPlayers();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Players ({players.length})</h1>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Role</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Team</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Bat</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Roles</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.jerseyNumber || i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.user.name}</td>
                  <td className="px-3 py-3 text-xs text-gray-600">{p.role.replace("_", " ")}</td>
                  <td className="px-3 py-3 text-xs text-gray-600">{p.team?.shortName || "-"}</td>
                  <td className="px-3 py-3 text-xs text-gray-600">{p.battingHand}</td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    {[p.isCaptain && "C", p.isViceCaptain && "VC", p.isWicketkeeper && "WK"].filter(Boolean).join(", ") || "-"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Link href={`/players/${p.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                      <Link href={`/admin/players/${p.id}/edit`} className="text-xs text-green-600 hover:underline">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {players.length === 0 && <p className="text-center py-10 text-gray-400">No players found</p>}
        </div>
      </Card>
    </div>
  );
}
