import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canGenerateFixtures } from "@/lib/permissions";

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
  if (!session || !canGenerateFixtures(session.user.role)) {
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
    useAssignedGroups = true,
  } = body;

  if (!teamIds || teamIds.length < 2) {
    return NextResponse.json({ error: "At least 2 teams required" }, { status: 400 });
  }

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  const activeEntries = await prisma.teamLeague.findMany({
    where: { leagueId: id, status: { in: ["ACTIVE", "APPROVED"] } },
    select: { teamId: true, group: true },
  });
  const eligibleTeamIds = new Set(activeEntries.map((entry) => entry.teamId));
  if (!teamIds.every((teamId: string) => eligibleTeamIds.has(teamId))) {
    return NextResponse.json(
      { error: "All selected teams must be assigned to this league before fixtures can be generated" },
      { status: 400 }
    );
  }
  if (new Set(teamIds).size !== teamIds.length) {
    return NextResponse.json({ error: "Duplicate teams are not allowed" }, { status: 400 });
  }

  const groupMap = new Map(activeEntries.map((entry) => [entry.teamId, entry.group || "Ungrouped"]));
  let matchPairs: Array<{ homeTeamId: string; awayTeamId: string; groupName: string | null }> = [];

  if (type === "ROUND_ROBIN") {
    if (stage === "GROUP" && useAssignedGroups) {
      const groupedTeamIds = teamIds.reduce((accumulator: Record<string, string[]>, teamId: string) => {
        const groupName = groupMap.get(teamId) || "Ungrouped";
        if (!accumulator[groupName]) accumulator[groupName] = [];
        accumulator[groupName].push(teamId);
        return accumulator;
      }, {} as Record<string, string[]>);

      matchPairs = Object.entries(groupedTeamIds).flatMap(([groupName, ids]) =>
        generateRoundRobin(ids as string[]).flat().map(([homeTeamId, awayTeamId]) => ({
          homeTeamId,
          awayTeamId,
          groupName,
        }))
      );
    } else {
      matchPairs = generateRoundRobin(teamIds).flat().map(([homeTeamId, awayTeamId]) => ({
        homeTeamId,
        awayTeamId,
        groupName: null,
      }));
    }
  } else if (type === "DOUBLE_ROUND_ROBIN") {
    const groupedSets =
      stage === "GROUP" && useAssignedGroups
        ? Object.values(
            teamIds.reduce((accumulator: Record<string, string[]>, teamId: string) => {
              const groupName = groupMap.get(teamId) || "Ungrouped";
              if (!accumulator[groupName]) accumulator[groupName] = [];
              accumulator[groupName].push(teamId);
              return accumulator;
            }, {} as Record<string, string[]>)
          )
        : [teamIds];

    matchPairs = groupedSets.flatMap((ids) => {
      const groupName = groupMap.get(ids[0]) || null;
      const rounds = generateRoundRobin(ids);
      const firstLeg = rounds.flat().map(([homeTeamId, awayTeamId]) => ({
        homeTeamId,
        awayTeamId,
        groupName,
      }));
      const returnLeg = rounds.flat().map(([homeTeamId, awayTeamId]) => ({
        homeTeamId: awayTeamId,
        awayTeamId: homeTeamId,
        groupName,
      }));
      return [...firstLeg, ...returnLeg];
    });
  } else if (type === "KNOCKOUT") {
    matchPairs = generateKnockout(teamIds).map(([homeTeamId, awayTeamId]) => ({
      homeTeamId,
      awayTeamId,
      groupName: null,
    }));
  }

  // Schedule matches from startDate with daysBetweenMatches gap
  const base = new Date(startDate);
  const created = [];
  let matchNumber = 1;

  // get existing match count for this league for numbering
  const existingCount = await prisma.match.count({ where: { leagueId: id } });

  for (let i = 0; i < matchPairs.length; i++) {
    const { homeTeamId, awayTeamId, groupName } = matchPairs[i];
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
        groupName,
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
