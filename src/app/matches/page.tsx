import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

async function getMatches() {
  return prisma.match.findMany({
    include: {
      homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      venue: { select: { name: true, city: true } },
      league: { select: { id: true, name: true } },
      innings: { select: { inningsNumber: true, teamId: true, totalRuns: true, totalWickets: true, totalOvers: true, isCompleted: true } },
    },
    orderBy: { matchDate: "asc" },
  });
}

export default async function MatchesPage() {
  const allMatches = await getMatches();

  const groups = {
    LIVE: allMatches.filter((m) => m.status === "LIVE"),
    INNINGS_BREAK: allMatches.filter((m) => m.status === "INNINGS_BREAK"),
    UPCOMING: allMatches.filter((m) => m.status === "UPCOMING"),
    COMPLETED: allMatches.filter((m) => m.status === "COMPLETED"),
    OTHER: allMatches.filter((m) => ["ABANDONED", "DELAYED", "CANCELED"].includes(m.status)),
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <div className="bg-green-800 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Matches</h1>
            <p className="text-green-200">Live scores, fixtures and results</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {Object.entries(groups).map(([status, matches]) =>
            matches.length > 0 ? (
              <section key={status}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  {status === "LIVE" && <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
                  {status === "LIVE" ? "Live Matches" :
                   status === "INNINGS_BREAK" ? "Innings Break" :
                   status === "UPCOMING" ? "Upcoming Fixtures" :
                   status === "COMPLETED" ? "Recent Results" : "Other Matches"}
                  <span className="text-base font-normal text-gray-500">({matches.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map((match) => {
                    const inn1 = match.innings.find((i) => i.inningsNumber === 1);
                    const inn2 = match.innings.find((i) => i.inningsNumber === 2);

                    return (
                      <Link key={match.id} href={`/matches/${match.id}`}>
                        <Card hoverable className="h-full">
                          <div className={`px-4 py-2 flex items-center justify-between border-b ${
                            match.status === "LIVE" ? "bg-red-50 border-red-100" :
                            match.status === "COMPLETED" ? "bg-green-50 border-green-100" :
                            "bg-gray-50 border-gray-100"
                          }`}>
                            <span className="text-xs text-gray-500">{match.league.name}</span>
                            <StatusBadge status={match.status} />
                          </div>
                          <CardBody className="py-4">
                            {/* Teams */}
                            <div className="space-y-3 mb-3">
                              {[
                                { team: match.homeTeam, innings: inn1?.teamId === match.homeTeamId ? inn1 : inn2?.teamId === match.homeTeamId ? inn2 : null },
                                { team: match.awayTeam, innings: inn1?.teamId === match.awayTeamId ? inn1 : inn2?.teamId === match.awayTeamId ? inn2 : null },
                              ].map(({ team, innings: inn }) => (
                                <div key={team.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: team.jerseyColor || "#16a34a" }}
                                    />
                                    <span className="font-medium text-sm text-gray-900">{team.name}</span>
                                  </div>
                                  {inn ? (
                                    <span className="text-sm font-bold text-gray-900">
                                      {inn.totalRuns}/{inn.totalWickets}
                                      <span className="text-gray-400 font-normal text-xs ml-1">({inn.totalOvers.toFixed(1)})</span>
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">Yet to bat</span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {match.result ? (
                              <div className="bg-green-50 rounded-lg px-3 py-2 text-xs font-medium text-green-800">
                                {match.result}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 space-y-1">
                                <p>📅 {formatDateTime(match.matchDate)}</p>
                                {match.venue && <p>📍 {match.venue.city}</p>}
                                <p>🏏 {match.matchFormat} · {match.overs} overs</p>
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null
          )}

          {allMatches.length === 0 && (
            <Card>
              <CardBody className="text-center py-16">
                <div className="text-5xl mb-4">🏏</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Matches Yet</h3>
                <p className="text-gray-500">Matches will appear here once scheduled.</p>
              </CardBody>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
