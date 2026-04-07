import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMobileUserFromRequest } from '@/lib/mobile-auth';
import { isLeagueOpsRole } from '@/lib/roles';
import { jsonWithCors, optionsWithCors } from '@/lib/api-cors';

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: teamId } = await params;
        const players = await prisma.player.findMany({
            where: { teamId },
            include: { user: true },
        });
        return jsonWithCors(req, { players });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUserFromRequest(req);
        if (!user || !isLeagueOpsRole(user.role)) {
            return jsonWithCors(req, { error: 'Unauthorized' }, { status: 401 });
        }

        const { id: teamId } = await params;
        const { playerId, role, isCaptain, isViceCaptain, isWicketkeeper } = await req.json();

        const existing = await prisma.player.findFirst({
            where: { id: playerId, teamId },
        });

        if (existing) {
            return jsonWithCors(req, { error: 'Player already in this team' }, { status: 400 });
        }

        const updatedPlayer = await prisma.player.update({
            where: { id: playerId },
            data: {
                teamId,
                role: role || undefined,
                isCaptain: isCaptain ?? undefined,
                isViceCaptain: isViceCaptain ?? undefined,
                isWicketkeeper: isWicketkeeper ?? undefined,
            },
        });

        return jsonWithCors(req, { success: true, player: updatedPlayer });
    } catch (error: any) {
        console.error('Add Player to Team Error:', error);
        return jsonWithCors(req, { error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
