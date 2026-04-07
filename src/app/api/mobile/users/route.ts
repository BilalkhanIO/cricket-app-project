import { NextRequest, NextResponse } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
    try {
        const user = await getMobileUserFromRequest(req);
        if (!user || user.role !== 'SUPER_ADMIN') {
            return jsonWithCors(req, { error: "Unauthorized. Super Admin only." }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return jsonWithCors(req, { users });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to fetch users" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const adminUser = await getMobileUserFromRequest(req);
        if (!adminUser || adminUser.role !== 'SUPER_ADMIN') {
            return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const { id, role, isActive } = data;

        if (!id) return jsonWithCors(req, { error: "User ID is required" }, { status: 400 });

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                role: role || undefined,
                isActive: typeof isActive === 'boolean' ? isActive : undefined
            },
            select: { id: true, name: true, role: true, isActive: true }
        });

        return jsonWithCors(req, { success: true, user: updatedUser });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to update user" }, { status: 500 });
    }
}
