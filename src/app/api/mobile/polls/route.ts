import { NextRequest, NextResponse } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import { isLeagueOpsRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
    try {
        const user = await getMobileUserFromRequest(req);
        if (!user) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

        const polls = await prisma.poll.findMany({
            include: {
                options: {
                    include: {
                        _count: { select: { votes: true } }
                    }
                },
                votes: {
                    where: { userId: user.id },
                    select: { optionId: true }
                },
                author: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return jsonWithCors(req, { polls });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to fetch polls" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getMobileUserFromRequest(req);
        if (!user || !isLeagueOpsRole(user.role)) {
            return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const { title, description, options, leagueId, matchId, type, expiresAt } = data;

        if (!title || !options || !Array.isArray(options) || options.length < 2) {
            return jsonWithCors(req, { error: "Title and at least 2 options are required" }, { status: 400 });
        }

        const poll = await prisma.poll.create({
            data: {
                title,
                description,
                leagueId,
                matchId,
                type: type || 'SINGLE_CHOICE',
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                authorId: user.id,
                options: {
                    create: options.map((opt: string) => ({ text: opt }))
                }
            },
            include: { options: true }
        });

        return jsonWithCors(req, { success: true, poll });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to create poll" }, { status: 500 });
    }
}
