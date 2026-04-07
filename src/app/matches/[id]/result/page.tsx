import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MatchResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.match.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!match) notFound();
  redirect(`/matches/${id}`);
}
