import { NextRequest } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";
import { canScoreMatch } from "@/lib/permissions";
import { ROLE } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function POST(req: NextRequest) {
    try {
        const user = getMobileUserFromRequest(req);
        if (!user || !canScoreMatch(user.role)) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

        const { inningsId, overNumber, bowlerId } = await req.json();
        const innings = await prisma.innings.findUnique({
            where: { id: inningsId },
            select: { match: { select: { scorerId: true } } },
        });

        if (!innings) return jsonWithCors(req, { error: "Innings not found" }, { status: 404 });
        if (user.role === ROLE.SCORER && innings.match.scorerId !== user.id) {
            return jsonWithCors(req, { error: "You are not the assigned scorer for this match" }, { status: 403 });
        }

        const over = await prisma.over.create({
            data: {
                inningsId,
                overNumber,
                bowlerId,
            },
        });

        return jsonWithCors(req, { over });
    } catch {
        return jsonWithCors(req, { error: "Failed to start over" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = getMobileUserFromRequest(req);
        if (!user || !canScoreMatch(user.role)) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

        const { overId, bowlerId, isCompleted } = await req.json();
        const existingOver = await prisma.over.findUnique({
            where: { id: overId },
            select: { innings: { select: { match: { select: { scorerId: true } } } } },
        });

        if (!existingOver) return jsonWithCors(req, { error: "Over not found" }, { status: 404 });
        if (user.role === ROLE.SCORER && existingOver.innings.match.scorerId !== user.id) {
            return jsonWithCors(req, { error: "You are not the assigned scorer for this match" }, { status: 403 });
        }

        const over = await prisma.over.update({
            where: { id: overId },
            data: {
                ...(bowlerId && { bowlerId }),
                ...(isCompleted !== undefined && { isCompleted }),
            },
        });

        return jsonWithCors(req, { over });
    } catch {
        return jsonWithCors(req, { error: "Failed to update over" }, { status: 500 });
    }
}
