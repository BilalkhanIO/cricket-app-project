import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, CalendarDays, ExternalLink } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import PublicShell from "@/components/layout/PublicShell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const venue = await prisma.venue.findUnique({
    where: { id },
    select: { name: true, city: true, pitchType: true },
  });
  if (!venue) return { title: "Venue Not Found — CricketLeague" };

  const title = `${venue.name} — CricketLeague`;
  const description = `${venue.name} in ${venue.city}${venue.pitchType ? `. ${venue.pitchType} pitch.` : "."} Match history and venue details.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

async function getVenue(id: string) {
  return prisma.venue.findUnique({
    where: { id },
    include: {
      matches: {
        select: {
          id: true,
          matchDate: true,
          status: true,
          result: true,
          title: true,
          homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          league: { select: { id: true, name: true, season: true } },
        },
        orderBy: { matchDate: "desc" },
        take: 50,
      },
    },
  });
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  UPCOMING:      { label: "Upcoming",      color: "text-[#9bb2d1] bg-[#1b3656]" },
  TOSS:          { label: "Toss",          color: "text-[#fbbf24] bg-[#3a2e00]" },
  LIVE:          { label: "Live",          color: "text-[#4ae183] bg-[#003919]" },
  INNINGS_BREAK: { label: "Break",         color: "text-[#fbbf24] bg-[#3a2e00]" },
  COMPLETED:     { label: "Completed",     color: "text-[#d4e3ff] bg-[#0b2747]" },
  ABANDONED:     { label: "Abandoned",     color: "text-[#9bb2d1] bg-[#1b3656]" },
  CANCELLED:     { label: "Cancelled",     color: "text-[#9bb2d1] bg-[#1b3656]" },
};

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venue = await getVenue(id);
  if (!venue) notFound();

  const completedMatches = venue.matches.filter((m) => m.status === "COMPLETED");
  const upcomingMatches = venue.matches.filter((m) => m.status === "UPCOMING" || m.status === "TOSS");

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
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#9bb2d1]">
              <Link href="/venues" className="hover:text-[#4ae183]">Venues</Link>
              <span>/</span>
              <span className="text-[#d4e3ff]">{venue.name}</span>
            </div>

            <h1 className="mt-5 font-[var(--font-display)] text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
              {venue.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-[#9bb2d1]">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-sm font-bold uppercase tracking-[0.1em]">{venue.city}</span>
              </div>
              <div className="flex items-center gap-2 text-[#9bb2d1]">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span className="text-sm font-bold text-[#4ae183]">{venue.matches.length} matches hosted</span>
              </div>
              {venue.googleMapsUrl && (
                <a
                  href={venue.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#4ae183] hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Map
                </a>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-screen-xl px-4 pb-20 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Venue details */}
            <div className="space-y-6 lg:col-span-1">
              {/* Pitch & Ground */}
              <section className="border border-white/10 bg-[#001c3a]">
                <div className="border-b border-white/10 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">Ground Details</p>
                </div>
                <div className="divide-y divide-white/5 px-5">
                  {venue.pitchType && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Pitch</span>
                      <span className="text-sm font-bold text-[#d4e3ff]">{venue.pitchType}</span>
                    </div>
                  )}
                  {venue.boundarySize && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Boundary</span>
                      <span className="text-sm font-bold text-[#d4e3ff]">{venue.boundarySize}</span>
                    </div>
                  )}
                  {venue.address && (
                    <div className="flex items-start justify-between gap-4 py-3">
                      <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Address</span>
                      <span className="text-right text-xs text-[#9bb2d1]">{venue.address}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">City</span>
                    <span className="text-sm font-bold text-[#d4e3ff]">{venue.city}</span>
                  </div>
                  {!venue.pitchType && !venue.boundarySize && !venue.address && (
                    <p className="py-4 text-xs text-[#9bb2d1]">No additional details recorded.</p>
                  )}
                </div>
              </section>

              {/* Facilities */}
              {venue.facilities && (
                <section className="border border-white/10 bg-[#001c3a]">
                  <div className="border-b border-white/10 px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">Facilities</p>
                  </div>
                  <p className="px-5 py-4 text-sm leading-7 text-[#9bb2d1]">{venue.facilities}</p>
                </section>
              )}

              {/* Contact */}
              {(venue.contactPerson || venue.contactPhone) && (
                <section className="border border-white/10 bg-[#001c3a]">
                  <div className="border-b border-white/10 px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">Contact</p>
                  </div>
                  <div className="divide-y divide-white/5 px-5">
                    {venue.contactPerson && (
                      <div className="flex items-center justify-between py-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Person</span>
                        <span className="text-sm font-bold text-[#d4e3ff]">{venue.contactPerson}</span>
                      </div>
                    )}
                    {venue.contactPhone && (
                      <div className="flex items-center justify-between py-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Phone</span>
                        <span className="text-sm font-bold text-[#d4e3ff]">{venue.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Stats summary */}
              <section className="border border-white/10 bg-[#001c3a]">
                <div className="border-b border-white/10 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">Match Summary</p>
                </div>
                <div className="divide-y divide-white/5 px-5">
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Total Hosted</span>
                    <span className="text-sm font-black text-[#4ae183]">{venue.matches.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Completed</span>
                    <span className="text-sm font-bold text-[#d4e3ff]">{completedMatches.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Upcoming</span>
                    <span className="text-sm font-bold text-[#d4e3ff]">{upcomingMatches.length}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right: Match history */}
            <div className="space-y-6 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center bg-[#1b3656] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#d4e3ff]">
                  Match History
                </div>
                <span className="text-[10px] text-[#9bb2d1]">{venue.matches.length} matches</span>
              </div>

              {venue.matches.length === 0 ? (
                <div className="border border-white/10 bg-[#001c3a] px-6 py-12 text-center">
                  <p className="text-sm text-[#9bb2d1]">No matches recorded at this venue yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {venue.matches.map((match) => {
                    const statusInfo = STATUS_LABEL[match.status] ?? { label: match.status, color: "text-[#9bb2d1] bg-[#1b3656]" };
                    return (
                      <Link
                        key={match.id}
                        href={`/matches/${match.id}`}
                        className="block border border-white/10 bg-[#001c3a] p-4 transition hover:bg-[#0b2747] hover:border-white/20"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            {/* Teams */}
                            <div className="flex items-center gap-2">
                              {match.homeTeam.jerseyColor && (
                                <span
                                  className="h-3 w-3 shrink-0"
                                  style={{ backgroundColor: match.homeTeam.jerseyColor }}
                                />
                              )}
                              <span className="text-sm font-black uppercase tracking-[0.04em] text-white">
                                {match.homeTeam.shortName}
                              </span>
                              <span className="text-xs text-[#9bb2d1]">vs</span>
                              {match.awayTeam.jerseyColor && (
                                <span
                                  className="h-3 w-3 shrink-0"
                                  style={{ backgroundColor: match.awayTeam.jerseyColor }}
                                />
                              )}
                              <span className="text-sm font-black uppercase tracking-[0.04em] text-white">
                                {match.awayTeam.shortName}
                              </span>
                            </div>

                            {/* League */}
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9bb2d1]">
                              {match.league.name} · {match.league.season}
                            </p>

                            {/* Result */}
                            {match.result && (
                              <p className="mt-1 text-xs text-[#4ae183]">{match.result}</p>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            {match.matchDate && (
                              <span className="text-[10px] text-[#9bb2d1]">
                                {formatDateTime(match.matchDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
