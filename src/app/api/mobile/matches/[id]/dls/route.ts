import { NextRequest, NextResponse } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUserFromRequest(req);
        if (!user) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const data = await req.json();
        const {
            isDlsApplied,
            revisedTargetDls,
            inningsNumber,
            resourcesBefore,
            resourcesAfter,
            parScore,
            note
        } = data;

        // Check if user is scorer or admin
        const match = await prisma.match.findUnique({
            where: { id },
            select: { scorerId: true, league: { select: { adminId: true } } }
        });

        if (!match) return jsonWithCors(req, { error: "Match not found" }, { status: 404 });

        const isAuthorized = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ||
            user.id === match.scorerId || user.id === match.league.adminId;

        if (!isAuthorized) return jsonWithCors(req, { error: "Unauthorized to apply DLS" }, { status: 403 });

        // Update match and create revision record
        const updatedMatch = await prisma.$transaction(async (tx) => {
            const m = await tx.match.update({
                where: { id },
                data: {
                    isDlsApplied,
                    revisedTargetDls: revisedTargetDls || null
                }
            });

            if (isDlsApplied) {
                await tx.dlsRevision.create({
                    data: {
                        matchId: id,
                        inningsNumber: inningsNumber || 2,
                        resourcesBefore,
                        resourcesAfter,
                        parScore,
                        revisedTarget: revisedTargetDls || 0,
                        note
                    }
                });
            }

            return m;
        });

        return jsonWithCors(req, { success: true, match: updatedMatch });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to apply DLS" }, { status: 500 });
    }
}
