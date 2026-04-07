import { NextRequest } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";
import { canScoreMatch } from "@/lib/permissions";
import { ROLE } from "@/lib/roles";
import { replayInningsState } from "@/lib/scoring-replay";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function POST(req: NextRequest) {
    try {
        const user = getMobileUserFromRequest(req);
        if (!user || !canScoreMatch(user.role)) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

        const { inningsId } = await req.json();
        if (!inningsId) return jsonWithCors(req, { error: "inningsId is required" }, { status: 400 });

        if (user.role === ROLE.SCORER) {
            const innings = await prisma.innings.findUnique({ where: { id: inningsId }, select: { matchId: true } });
            if (!innings) return jsonWithCors(req, { error: "Innings not found" }, { status: 404 });
            const match = await prisma.match.findUnique({ where: { id: innings.matchId }, select: { scorerId: true } });
            if (match?.scorerId !== user.id) {
                return jsonWithCors(req, { error: "You are not the assigned scorer for this match" }, { status: 403 });
            }
        }
        
        const lastBall = await prisma.ballEvent.findFirst({
            where: { inningsId },
            orderBy: { createdAt: "desc" }
        });

        if (!lastBall) return jsonWithCors(req, { error: "No balls to undo" }, { status: 400 });

        await prisma.ballEvent.delete({ where: { id: lastBall.id } });
        const innings = await replayInningsState(inningsId);

        await prisma.auditLog.create({
            data: {
                userId: user.id,
                matchId: innings?.matchId || null,
                action: "BALL_EVENT_UNDO",
                entity: "BallEvent",
                entityId: lastBall.id,
                oldValue: JSON.stringify(lastBall),
            },
        });

        await prisma.ballEventAudit.create({
            data: {
                eventId: lastBall.id,
                inningsId,
                matchId: innings?.matchId || null,
                changedBy: user.id,
                action: "UNDO",
                oldValue: JSON.stringify(lastBall),
                revisionNo: lastBall.revisionNo || 1,
            },
        });

        return jsonWithCors(req, { success: true, innings, deletedBall: lastBall });
    } catch {
        return jsonWithCors(req, { error: "Failed to undo ball" }, { status: 500 });
    }
}
