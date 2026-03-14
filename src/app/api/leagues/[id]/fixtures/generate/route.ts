import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Round-robin scheduler using rotation algorithm
function generateRoundRobin(teamIds: string[]): [string, string][][] {
  const teams = [...teamIds];
  if (teams.length % 2 !== 0) teams.push("BYE");
  const n = teams.length;
  const rounds: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const round: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = teams[i];
      const away = teams[n - 1 - i];
      if (home !== "BYE" && away !== "BYE") {
        round.push([home, away]);
      }
    }
    rounds.push(round);
    // rotate: keep teams[0] fixed, rotate the rest
    const last = teams[n - 1];
    for (let i = n - 1; i > 1; i--) teams[i] = teams[i - 1];
    teams[1] = last;
  }
  return rounds;
}

// Knockout bracket (seeded 1 vs last, 2 vs second-last, etc.)
function generateKnockout(teamIds: string[]): [string, string][] {
  const teams = [...teamIds];
  const matches: [string, string][] = [];
  const half = Math.floor(teams.length / 2);
  for (let i = 0; i < half; i++) {
    matches.push([teams[i], teams[teams.length - 1 - i]]);
  }
  return matches;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const {
    type = "ROUND_ROBIN", // ROUND_ROBIN | DOUBLE_ROUND_ROBIN | KNOCKOUT
    teamIds,
    venueId,
    startDate,
    matchTimeHour = 14,
    matchTimeMinute = 0,
    daysBetweenMatches = 2,
    stage = "GROUP",
  } = body;

  if (!teamIds || teamIds.length < 2) {
    return NextResponse.json({ error: "At least 2 teams required" }, { status: 400 });
  }

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  let matchPairs: [string, string][] = [];

  if (type === "ROUND_ROBIN") {
    const rounds = generateRoundRobin(teamIds);
    matchPairs = rounds.flat();
  } else if (type === "DOUBLE_ROUND_ROBIN") {
    const rounds = generateRoundRobin(teamIds);
    const homeAway = rounds.flat();
    // reverse home/away for second leg
    const returnLeg: [string, string][] = homeAway.map(([h, a]) => [a, h]);
    matchPairs = [...homeAway, ...returnLeg];
  } else if (type === "KNOCKOUT") {
    matchPairs = generateKnockout(teamIds);
  }

  // Schedule matches from startDate with daysBetweenMatches gap
  const base = new Date(startDate);
  const created = [];
  let matchNumber = 1;

  // get existing match count for this league for numbering
  const existingCount = await prisma.match.count({ where: { leagueId: id } });

  for (let i = 0; i < matchPairs.length; i++) {
    const [homeTeamId, awayTeamId] = matchPairs[i];
    const matchDate = new Date(base);
    matchDate.setDate(base.getDate() + i * daysBetweenMatches);
    matchDate.setHours(matchTimeHour, matchTimeMinute, 0, 0);

    const match = await prisma.match.create({
      data: {
        leagueId: id,
        homeTeamId,
        awayTeamId,
        venueId: venueId || null,
        matchDate,
        matchFormat: league.matchFormat,
        overs: league.oversPerInnings,
        stage,
        matchNumber: existingCount + matchNumber,
        status: "UPCOMING",
      },
      include: {
        homeTeam: { select: { name: true, shortName: true } },
        awayTeam: { select: { name: true, shortName: true } },
      },
    });
    created.push(match);
    matchNumber++;
  }

  return NextResponse.json({ created: created.length, matches: created });
}
