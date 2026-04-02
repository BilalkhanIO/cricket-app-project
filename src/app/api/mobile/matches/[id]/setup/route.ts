import { NextRequest } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";
import { ROLE } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = getMobileUserFromRequest(req);
        if (!user) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { action } = body;

        const match = await prisma.match.findUnique({
            where: { id },
            include: { homeTeam: true, awayTeam: true }
        });
        if (!match) return jsonWithCors(req, { error: "Match not found" }, { status: 404 });

        // Permission check
        const canManage = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(user.role) || 
                         (user.role === ROLE.SCORER && match.scorerId === user.id) ||
                         (user.role === "TEAM_MANAGER" && (match.homeTeam.managerId === user.id || match.awayTeam.managerId === user.id));

        if (!canManage) return jsonWithCors(req, { error: "Forbidden" }, { status: 403 });

        if (action === 'toss') {
            const { tossWinnerId, tossDecision } = body;
            if (!tossWinnerId || !tossDecision) return jsonWithCors(req, { error: "Missing toss data" }, { status: 400 });

            const updatedMatch = await prisma.match.update({
                where: { id },
                data: {
                    tossWinnerId,
                    tossDecision: String(tossDecision).toLowerCase(),
                    status: "TOSS",
                },
            });
            return jsonWithCors(req, { match: updatedMatch });
        }

        if (action === 'playing-xi') {
            const { teamId, playerIds } = body;
            if (!teamId || !Array.isArray(playerIds)) return jsonWithCors(req, { error: "Missing XI data" }, { status: 400 });

            // Delete existing
            await prisma.playingXI.deleteMany({ where: { matchId: id, teamId } });

            // Create new
            await prisma.playingXI.createMany({
                data: playerIds.map((pid, idx) => ({
                    matchId: id,
                    playerId: pid,
                    teamId,
                    battingOrder: idx + 1,
                })),
            });

            // Update match status to LIVE if both teams have XI?
            // Usually match becomes LIVE when first innings starts.
            
            return jsonWithCors(req, { success: true });
        }

        if (action === 'start-innings') {
            const { teamId, inningsNumber, targetRuns } = body;
            const innings = await prisma.innings.create({
                data: {
                    matchId: id,
                    teamId,
                    inningsNumber,
                    targetRuns: targetRuns || null,
                }
            });
            
            await prisma.match.update({
                where: { id },
                data: { status: "LIVE" }
            });

            return jsonWithCors(req, { innings });
        }

        if (action === 'complete-innings') {
            const { inningsId } = body;
            if (!inningsId) return jsonWithCors(req, { error: "inningsId is required" }, { status: 400 });

            const innings = await prisma.innings.update({
                where: { id: inningsId },
                data: { isCompleted: true },
            });

            return jsonWithCors(req, { innings });
        }

        return jsonWithCors(req, { error: "Invalid action" }, { status: 400 });
    } catch (error) {
        return jsonWithCors(req, { error: "Setup failed" }, { status: 500 });
    }
}
