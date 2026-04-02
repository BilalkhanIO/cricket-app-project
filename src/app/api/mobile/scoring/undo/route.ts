import { NextRequest } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";
import { canScoreMatch } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function POST(req: NextRequest) {
    try {
        const user = getMobileUserFromRequest(req);
        if (!user || !canScoreMatch(user.role)) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

        const { inningsId } = await req.json();

        // This is a simplified undo - find the last ball and delete it
        // In a real app, you'd need to revert all stats (runs, wickets, overs)
        // For the MVP proxy, we'll assume the scorer handles the state refresh
        
        const lastBall = await prisma.ballEvent.findFirst({
            where: { inningsId },
            orderBy: { createdAt: "desc" }
        });

        if (!lastBall) return jsonWithCors(req, { error: "No balls to undo" }, { status: 400 });

        await prisma.ballEvent.delete({ where: { id: lastBall.id } });

        return jsonWithCors(req, { success: true });
    } catch {
        return jsonWithCors(req, { error: "Failed to undo ball" }, { status: 500 });
    }
}
