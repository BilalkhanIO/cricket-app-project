import { NextRequest, NextResponse } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import { isLeagueOpsRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { homeTeam: { name: { contains: search, mode: "insensitive" } } },
                { homeTeam: { shortName: { contains: search, mode: "insensitive" } } },
                { awayTeam: { name: { contains: search, mode: "insensitive" } } },
                { awayTeam: { shortName: { contains: search, mode: "insensitive" } } },
                { league: { name: { contains: search, mode: "insensitive" } } },
                { venue: { name: { contains: search, mode: "insensitive" } } },
                { venue: { city: { contains: search, mode: "insensitive" } } },
            ];
        }

        const matches = await prisma.match.findMany({
            where,
            include: {
                homeTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                awayTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                venue: { select: { name: true, city: true } },
                league: { select: { id: true, name: true } },
                innings: {
                    select: {
                        inningsNumber: true,
                        teamId: true,
                        totalRuns: true,
                        totalWickets: true,
                        totalOvers: true,
                        isCompleted: true,
                    },
                },
            },
            orderBy: [{ matchDate: "desc" }],
            take: 50,
        });

        return jsonWithCors(req, { matches });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch matches" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = getMobileUserFromRequest(req);
        if (!user) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

        if (!isLeagueOpsRole(user.role)) {
            return jsonWithCors(req, { error: "Forbidden: Only admins can schedule matches" }, { status: 403 });
        }

        const data = await req.json();
        const {
            leagueId,
            homeTeamId,
            awayTeamId,
            venueId,
            matchDate,
            matchFormat,
            oversPerInnings,
            stage,
            groupName
        } = data;

        if (!leagueId || !homeTeamId || !awayTeamId || !matchDate) {
            return jsonWithCors(req, { error: "Missing required fields" }, { status: 400 });
        }

        const match = await prisma.match.create({
            data: {
                leagueId,
                homeTeamId,
                awayTeamId,
                venueId: venueId || null,
                matchDate: new Date(matchDate),
                matchFormat: matchFormat || "T20",
                overs: Number(oversPerInnings) || 20,
                stage: stage || "LEAGUE",
                groupName: groupName || null,
                status: "UPCOMING"
            },
        });

        return jsonWithCors(req, { match }, { status: 201 });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to create match" }, { status: 500 });
    }
}
