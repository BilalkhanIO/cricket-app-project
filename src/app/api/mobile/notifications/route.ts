import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
    try {
        const user = getMobileUserFromRequest(req);
        if (!user) {
            return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get("unread") === "true";
        const limit = Math.min(Number(searchParams.get("limit") || 30), 100);

        const notifications = await prisma.notification.findMany({
            where: {
                userId: user.id,
                ...(unreadOnly && { isRead: false }),
            },
            include: {
                match: {
                    select: {
                        id: true,
                        title: true,
                        homeTeam: { select: { shortName: true } },
                        awayTeam: { select: { shortName: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: user.id, isRead: false },
        });

        return jsonWithCors(req, { notifications, unreadCount });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch notifications" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = getMobileUserFromRequest(req);
        if (!user) {
            return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
        }

        const { notificationIds, markAllRead } = await req.json();

        if (markAllRead) {
            await prisma.notification.updateMany({
                where: { userId: user.id, isRead: false },
                data: { isRead: true },
            });
        } else if (notificationIds?.length) {
            await prisma.notification.updateMany({
                where: { id: { in: notificationIds }, userId: user.id },
                data: { isRead: true },
            });
        }

        return jsonWithCors(req, { success: true });
    } catch {
        return jsonWithCors(req, { error: "Failed to update notifications" }, { status: 500 });
    }
}
