import prisma from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PlayersClient from "./PlayersClient";

export const dynamic = 'force-dynamic';

async function getPlayers() {
  return prisma.player.findMany({
    include: {
      user: { select: { name: true, profileImage: true, city: true } },
      team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      playerStats: { take: 1 },
    },
    orderBy: { user: { name: "asc" } },
  });
}

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <div className="bg-green-800 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Players</h1>
            <p className="text-green-200">{players.length} registered players</p>
          </div>
        </div>
        <PlayersClient players={players} />
      </main>
      <Footer />
    </div>
  );
}
