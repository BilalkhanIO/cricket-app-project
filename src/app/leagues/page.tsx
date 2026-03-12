import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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

export default async function LeaguesPage() {
  const leagues = await getLeagues();

  const grouped = {
    ACTIVE: leagues.filter((l) => l.status === "ACTIVE"),
    REGISTRATION: leagues.filter((l) => l.status === "REGISTRATION"),
    COMPLETED: leagues.filter((l) => l.status === "COMPLETED"),
    DRAFT: leagues.filter((l) => l.status === "DRAFT"),
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <div className="bg-green-800 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Cricket Leagues</h1>
            <p className="text-green-200">Browse all cricket tournaments and leagues</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {leagues.length === 0 ? (
            <Card>
              <CardBody className="text-center py-16">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Leagues Yet</h3>
                <p className="text-gray-500 mb-4">Be the first to create a cricket league!</p>
                <Link href="/admin/leagues/new" className="text-green-600 font-medium hover:underline">
                  Create League →
                </Link>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([status, items]) =>
                items.length > 0 ? (
                  <section key={status}>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      {status === "ACTIVE" && "🟢"}
                      {status === "REGISTRATION" && "📝"}
                      {status === "COMPLETED" && "✅"}
                      {status === "DRAFT" && "📋"}
                      {status.replace("_", " ")} Leagues
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((league) => (
                        <Link key={league.id} href={`/leagues/${league.id}`}>
                          <Card hoverable className="h-full">
                            <CardBody>
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                                  🏆
                                </div>
                                <StatusBadge status={league.status} />
                              </div>
                              <h3 className="font-bold text-gray-900 mb-1">{league.name}</h3>
                              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                {league.description || `${league.matchFormat} format · ${league.season}`}
                              </p>
                              <div className="grid grid-cols-3 gap-2 text-center text-xs">
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
                                  <div className="text-gray-500">Max Teams</div>
                                </div>
                              </div>
                              <div className="mt-3 text-xs text-gray-500">
                                <span>{formatDate(league.startDate)} – {formatDate(league.endDate)}</span>
                              </div>
                            </CardBody>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
