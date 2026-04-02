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
        const authUser = getMobileUserFromRequest(req);
        if (!authUser) {
            return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                profileImage: true,
                city: true,
                dateOfBirth: true,
                role: true,
                battingStyle: true,
                bowlingStyle: true,
                specialty: true,
                isVerified: true,
                createdAt: true,
                playerProfile: {
                    include: {
                        team: { select: { id: true, name: true, shortName: true, logo: true } },
                        playerStats: { orderBy: { matchesPlayed: "desc" }, take: 1 },
                    },
                },
                _count: {
                    select: {
                        notifications: { where: { isRead: false } },
                    },
                },
            },
        });

        if (!user) {
            return jsonWithCors(req, { error: "User not found" }, { status: 404 });
        }

        return jsonWithCors(req, { user });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch profile" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const authUser = getMobileUserFromRequest(req);
        if (!authUser) {
            return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();

        const allowedFields = ["name", "phone", "city", "profileImage", "battingStyle", "bowlingStyle", "specialty"];
        const updates: Record<string, unknown> = {};

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updates[field] = data[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return jsonWithCors(req, { error: "No valid fields to update" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: authUser.id },
            data: updates,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                profileImage: true,
                city: true,
                role: true,
            },
        });

        return jsonWithCors(req, { user });
    } catch {
        return jsonWithCors(req, { error: "Failed to update profile" }, { status: 500 });
    }
}
