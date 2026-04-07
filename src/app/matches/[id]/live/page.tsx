import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MatchLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.match.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!match) notFound();
  // Always redirect to canonical match page; the live tab is shown there automatically
  redirect(`/matches/${id}`);
}
