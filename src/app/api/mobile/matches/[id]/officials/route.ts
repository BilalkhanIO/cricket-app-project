import { NextRequest, NextResponse } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import { isLeagueOpsRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUserFromRequest(req);
        if (!user) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const officials = await prisma.matchOfficial.findMany({
            where: { matchId: id },
            include: { user: { select: { id: true, name: true, role: true } } }
        });

        return jsonWithCors(req, { officials });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to fetch officials" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUserFromRequest(req);
        if (!user || !isLeagueOpsRole(user.role)) {
            return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();
        const { name, role, userId } = data;

        if (!name || !role) {
            return jsonWithCors(req, { error: "Name and role are required" }, { status: 400 });
        }

        const official = await prisma.matchOfficial.create({
            data: {
                matchId: id,
                name,
                role,
                userId
            }
        });

        return jsonWithCors(req, { success: true, official });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to add official" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUserFromRequest(req);
        if (!user || !isLeagueOpsRole(user.role)) {
            return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const officialId = searchParams.get('officialId');

        if (!officialId) {
            return jsonWithCors(req, { error: "Official ID is required" }, { status: 400 });
        }

        await prisma.matchOfficial.delete({
            where: { id: officialId }
        });

        return jsonWithCors(req, { success: true });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to remove official" }, { status: 500 });
    }
}
