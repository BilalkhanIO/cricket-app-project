import { NextRequest, NextResponse } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import { canCreateLeague } from "@/lib/permissions";
import { isValidPoolConfigJson, serializePoolConfig } from "@/lib/pools";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const leagues = await prisma.league.findMany({
            where: {
                ...(status && { status }),
                ...(search && { name: { contains: search, mode: "insensitive" as const } }),
            },
            include: {
                admin: { select: { name: true } },
                _count: { select: { teams: true, matches: true } },
            },
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        });

        return jsonWithCors(req, { leagues });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch leagues" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = getMobileUserFromRequest(req);
        if (!user) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

        if (!canCreateLeague(user.role)) {
            return jsonWithCors(req, { error: "Forbidden: You don't have permission to create leagues" }, { status: 403 });
        }

        const data = await req.json();
        const {
            name,
            description,
            parentLeagueId,
            season,
            year,
            startDate,
            endDate,
            tournamentType = "ROUND_ROBIN",
            matchFormat = "T20",
            maxTeams = 8,
            oversPerInnings = 20,
            powerplayOvers = 6,
            pointsPerWin = 2,
            pointsPerTie = 1,
            pointsPerNoResult = 1,
            squadSizeLimit = 15,
            playingXISize = 11,
            poolConfigJson,
            superOverEnabled = true,
            status = "DRAFT"
        } = data;

        if (!name || !startDate || !endDate) {
            return jsonWithCors(req, { error: "Missing required fields (name, startDate, endDate)" }, { status: 400 });
        }

        if (poolConfigJson && !isValidPoolConfigJson(poolConfigJson)) {
            return jsonWithCors(req, { error: "Invalid pool configuration JSON" }, { status: 400 });
        }

        const league = await prisma.league.create({
            data: {
                name,
                description,
                parentLeagueId: parentLeagueId || null,
                season: season || new Date().getFullYear().toString(),
                year: Number(year) || new Date().getFullYear(),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                tournamentType,
                matchFormat,
                maxTeams: Number(maxTeams),
                oversPerInnings: Number(oversPerInnings),
                powerplayOvers: Number(powerplayOvers),
                pointsPerWin: Number(pointsPerWin),
                pointsPerTie: Number(pointsPerTie),
                pointsPerNoResult: Number(pointsPerNoResult),
                squadSizeLimit: Number(squadSizeLimit),
                playingXISize: Number(playingXISize),
                poolConfigJson: poolConfigJson ? serializePoolConfig(poolConfigJson) : undefined,
                superOverEnabled: Boolean(superOverEnabled),
                status,
                adminId: user.id
            },
        });

        return jsonWithCors(req, { league }, { status: 201 });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to create league" }, { status: 500 });
    }
}
