import prisma from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MatchesClient from "./MatchesClient";

export const dynamic = 'force-dynamic';

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
        <MatchesClient allMatches={allMatches} />
      </main>
      <Footer />
    </div>
  );
}
