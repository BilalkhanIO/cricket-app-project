import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, CalendarDays } from "lucide-react";
import prisma from "@/lib/prisma";
import PublicShell from "@/components/layout/PublicShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Venues — CricketLeague",
  description: "Cricket grounds and venues hosting matches across all leagues.",
};

async function getVenues() {
  return prisma.venue.findMany({
    include: {
      _count: { select: { matches: true } },
    },
    orderBy: { name: "asc" },
  });
}

export default async function VenuesPage() {
  const venues = await getVenues();

  return (
    <PublicShell>
      <div className="bg-[#00142b] text-[#d4e3ff]">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-10 pt-12 sm:px-6">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(74,225,131,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,225,131,0.06) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(27,54,86,0.95),transparent_52%),linear-gradient(180deg,rgba(0,20,43,0.22),#00142b_76%)]" />
          <div className="relative mx-auto max-w-screen-xl">
            <div className="inline-flex items-center gap-2 bg-[#1b3656] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#d4e3ff]">
              Grounds
            </div>
            <h1 className="mt-5 font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
              Venues
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#9bb2d1]">
              {venues.length} registered grounds hosting matches across all leagues and tournaments.
            </p>
          </div>
        </section>

        {/* Venues grid */}
        <section className="px-4 pb-20 pt-8 sm:px-6">
          <div className="mx-auto max-w-screen-xl">
            {venues.length === 0 ? (
              <div className="border border-white/10 bg-[#001c3a] px-6 py-12 text-center">
                <p className="text-sm text-[#9bb2d1]">No venues registered yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {venues.map((venue) => (
                  <Link key={venue.id} href={`/venues/${venue.id}`} className="block border border-white/10 bg-[#001c3a] p-6 transition hover:bg-[#0b2747] hover:border-white/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">
                          {venue.name}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[#9bb2d1]">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-[0.12em]">{venue.city}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#4ae183]">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-black">{venue._count.matches}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      {venue.pitchType && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Pitch</span>
                          <span className="text-xs font-bold text-[#d4e3ff]">{venue.pitchType}</span>
                        </div>
                      )}
                      {venue.boundarySize && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Boundary</span>
                          <span className="text-xs font-bold text-[#d4e3ff]">{venue.boundarySize}</span>
                        </div>
                      )}
                      {venue.address && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Address</span>
                          <span className="max-w-[60%] text-right text-xs text-[#9bb2d1]">{venue.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                          {venue._count.matches} {venue._count.matches === 1 ? "match" : "matches"} hosted
                        </span>
                        {venue.googleMapsUrl && (
                          <a
                            href={venue.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-black uppercase tracking-[0.18em] text-[#4ae183] hover:underline"
                          >
                            Map
                          </a>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
