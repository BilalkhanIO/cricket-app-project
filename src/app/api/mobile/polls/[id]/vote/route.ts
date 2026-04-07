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
        const { optionId } = await req.json();
        if (!optionId) return jsonWithCors(req, { error: "Option ID is required" }, { status: 400 });

        const poll = await prisma.poll.findUnique({
            where: { id },
            include: { options: true }
        });

        if (!poll) return jsonWithCors(req, { error: "Poll not found" }, { status: 404 });

        if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
            return jsonWithCors(req, { error: "This poll has expired" }, { status: 400 });
        }

        const validOption = poll.options.some(opt => opt.id === optionId);
        if (!validOption) return jsonWithCors(req, { error: "Invalid option selected" }, { status: 400 });

        const vote = await prisma.pollVote.upsert({
            where: {
                pollId_userId: {
                    pollId: id,
                    userId: user.id
                }
            },
            update: {
                optionId: optionId
            },
            create: {
                pollId: id,
                userId: user.id,
                optionId: optionId
            }
        });

        return jsonWithCors(req, { success: true, vote });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to submit vote" }, { status: 500 });
    }
}
