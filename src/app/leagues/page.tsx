import prisma from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeaguesClient from "./LeaguesClient";

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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <div className="bg-[#1B3A5C] text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Cricket Leagues</h1>
            <p className="text-[#B9D7EA]">Browse all cricket tournaments and leagues</p>
          </div>
        </div>
        <LeaguesClient leagues={leagues} />
      </main>
      <Footer />
    </div>
  );
}
