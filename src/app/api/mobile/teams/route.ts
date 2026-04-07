import { NextRequest, NextResponse } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import { canCreateTeam } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { shortName: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
            ];
        }

        const teams = await prisma.team.findMany({
            where,
            include: {
                manager: { select: { name: true } },
                _count: { select: { players: true } },
                leagues: {
                    include: {
                        league: { select: { id: true, name: true, status: true } },
                    },
                    take: 3,
                },
            },
            orderBy: { name: "asc" },
            take: 60,
        });

        return jsonWithCors(req, { teams });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch teams" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = getMobileUserFromRequest(req);
        if (!user) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

        if (!canCreateTeam(user.role)) {
            return jsonWithCors(req, { error: "Forbidden: You don't have permission to create teams" }, { status: 403 });
        }

        const data = await req.json();
        const { name, shortName, city, logo, jerseyColor, coach, about } = data;

        if (!name || !shortName) {
            return jsonWithCors(req, { error: "Name and Short Name are required" }, { status: 400 });
        }

        const team = await prisma.team.create({
            data: {
                name,
                shortName,
                city: city || null,
                logo: logo || null,
                jerseyColor: jerseyColor || null,
                description: about || null,
                managerId: user.id
            },
        });

        return jsonWithCors(req, { team }, { status: 201 });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to create team" }, { status: 500 });
    }
}
