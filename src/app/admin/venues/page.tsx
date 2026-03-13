import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/Card";

export const dynamic = 'force-dynamic';

async function getVenues() {
  return prisma.venue.findMany({
    include: { _count: { select: { matches: true } } },
    orderBy: { name: "asc" },
  });
}

export default async function AdminVenuesPage() {
  const venues = await getVenues();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Venues ({venues.length})</h1>
        <Link href="/admin/venues/new" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
          + Add Venue
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {venues.map((venue) => (
          <Card key={venue.id}>
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">🏟️</div>
                <div>
                  <h3 className="font-bold text-gray-900">{venue.name}</h3>
                  <p className="text-sm text-gray-500">📍 {venue.city}</p>
                </div>
              </div>
              {venue.address && <p className="text-xs text-gray-500 mb-2">{venue.address}</p>}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {venue.pitchType && <span>⚡ {venue.pitchType}</span>}
                {venue.boundarySize && <span>📏 {venue.boundarySize}</span>}
                <span>📅 {venue._count.matches} matches</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {venues.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏟️</div>
            <h3 className="font-semibold text-gray-700 mb-2">No Venues</h3>
            <Link href="/admin/venues/new" className="text-green-600 hover:underline text-sm">Add your first venue →</Link>
          </div>
        </Card>
      )}
    </div>
  );
}
