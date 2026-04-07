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

        const announcements = await prisma.announcement.findMany({
            where: user.role === 'SUPER_ADMIN' ? {} : { isPublic: true },
            include: {
                league: { select: { id: true, name: true } },
                author: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return jsonWithCors(req, { announcements });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to fetch announcements" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getMobileUserFromRequest(req);
        if (!user || !isLeagueOpsRole(user.role)) {
            return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const { title, content, leagueId, isPublic, importance } = data;

        if (!title || !content) {
            return jsonWithCors(req, { error: "Title and content are required" }, { status: 400 });
        }

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                leagueId,
                isPublic: isPublic ?? true,
                authorId: user.id
            },
            include: {
                league: { select: { id: true, name: true } },
                author: { select: { id: true, name: true } }
            }
        });

        return jsonWithCors(req, { success: true, announcement });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to create announcement" }, { status: 500 });
    }
}
