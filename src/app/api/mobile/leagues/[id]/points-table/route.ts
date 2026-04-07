import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getQualificationStatus } from "@/lib/pools";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getFormGuide(teamId: string, matches: Array<{ status: string; homeTeamId: string; awayTeamId: string; winnerTeamId: string | null }>) {
  return matches
    .filter((match) => match.status === "COMPLETED" && (match.homeTeamId === teamId || match.awayTeamId === teamId))
    .slice(-5)
    .map((match) => {
      if (!match.winnerTeamId) return "T";
      return match.winnerTeamId === teamId ? "W" : "L";
    });
}

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [league, pointsTable, matches] = await Promise.all([
      prisma.league.findUnique({
        where: { id },
        select: { poolConfigJson: true },
      }),
      prisma.pointsTable.findMany({
        where: { leagueId: id },
        include: {
          team: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
        },
        orderBy: [{ points: "desc" }, { netRunRate: "desc" }],
      }),
      prisma.match.findMany({
        where: { leagueId: id, status: "COMPLETED" },
        select: {
          status: true,
          homeTeamId: true,
          awayTeamId: true,
          winnerTeamId: true,
        },
        orderBy: { matchDate: "asc" },
      }),
    ]);

    const groupedRows = pointsTable.reduce<Record<string, typeof pointsTable>>((accumulator, row) => {
      const key = row.group || "Overall";
      if (!accumulator[key]) accumulator[key] = [];
      accumulator[key].push(row);
      return accumulator;
    }, {});

    return jsonWithCors(req, {
      pointsTable: Object.entries(groupedRows).flatMap(([groupName, rows]) =>
        rows.map((row, index) => ({
          ...row,
          groupName,
          qualificationStatus: getQualificationStatus(index, rows.length, groupName, league?.poolConfigJson),
          formGuide: getFormGuide(row.teamId, matches),
        }))
      ),
    });
  } catch {
    return jsonWithCors(req, { error: "Failed to fetch points table" }, { status: 500 });
  }
}
