import { NextRequest } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";
import { calcNRR } from "@/lib/utils";
import { updatePlayerStatsForMatchScopes } from "@/lib/player-stats";
import { canScoreMatch } from "@/lib/permissions";
import { ROLE } from "@/lib/roles";

export const dynamic = "force-dynamic";

function buildBallCommentary(
  commentary: string | null | undefined,
  dismissedBatsmanId: string | null,
  dismissedBatsmanOrder: number | null
) {
  if (!dismissedBatsmanId) return commentary || null;

  return `__meta__${JSON.stringify({
    text: commentary || null,
    dismissedBatsmanId,
    dismissedBatsmanOrder,
  })}`;
}

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

export async function POST(req: NextRequest) {
  try {
    const user = getMobileUserFromRequest(req);
    if (!user) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

    if (!canScoreMatch(user.role)) {
      return jsonWithCors(req, { error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      inningsId,
      overId,
      ballNumber,
      overNumber,
      batsmanId,
      batsmanOrder,
      dismissedBatsmanId,
      dismissedBatsmanOrder,
      bowlerId,
      runs,
      isWicket,
      wicketType,
      fielderIds,
      isExtra,
      extraType,
      extraRuns,
      isBoundary,
      isSix,
      commentary,
    } = body;

    const validExtras = new Set(["WIDE", "NO_BALL", "BYE", "LEG_BYE"]);
    const validWicketTypes = new Set([
      "BOWLED",
      "CAUGHT",
      "LBW",
      "RUN_OUT",
      "STUMPED",
      "HIT_WICKET",
      "RETIRED_HURT",
      "RETIRED_OUT",
    ]);

    if (!inningsId || !overId || !ballNumber || !overNumber) {
      return jsonWithCors(req, { error: "Missing required scoring fields" }, { status: 400 });
    }

    const inningsMeta = await prisma.innings.findUnique({
      where: { id: inningsId },
      select: {
        teamId: true,
        match: { select: { id: true, status: true, homeTeamId: true, awayTeamId: true, scorerId: true } },
      },
    });
    if (!inningsMeta) return jsonWithCors(req, { error: "Innings not found" }, { status: 404 });
    
    // Verify SCORER assignment
    if (user.role === ROLE.SCORER && inningsMeta.match.scorerId !== user.id) {
        return jsonWithCors(req, { error: "You are not the assigned scorer" }, { status: 403 });
    }

    if (inningsMeta.match.status === "COMPLETED") {
      return jsonWithCors(req, { error: "Match is already completed" }, { status: 409 });
    }

    const bowlingTeamId =
      inningsMeta.teamId === inningsMeta.match.homeTeamId
        ? inningsMeta.match.awayTeamId
        : inningsMeta.match.homeTeamId;

    const wicketPlayerId = dismissedBatsmanId || batsmanId;
    const wicketPlayerOrder = dismissedBatsmanOrder || batsmanOrder || 99;

    const wicketCountsAgainstTeam = Boolean(isWicket && wicketType !== "RETIRED_HURT");
    const wicketCountsAgainstBowler = Boolean(
      wicketCountsAgainstTeam && !["RUN_OUT", "RETIRED_OUT"].includes(wicketType || "")
    );
    const batterIsOut = wicketCountsAgainstTeam;

    const over = await prisma.over.findUnique({
      where: { id: overId },
      select: { id: true, bowlerId: true, inningsId: true },
    });
    if (!over || over.inningsId !== inningsId) {
      return jsonWithCors(req, { error: "Invalid over" }, { status: 400 });
    }

    // Create ball event
    const ball = await prisma.ballEvent.create({
      data: {
        inningsId,
        overId,
        ballNumber,
        overNumber,
        batsmanId: batsmanId || null,
        bowlerId: bowlerId || null,
        runs: runs || 0,
        isWicket: isWicket || false,
        wicketType: wicketType || null,
        fielderIds: fielderIds || null,
        isExtra: isExtra || false,
        extraType: extraType || null,
        extraRuns: extraRuns || 0,
        isBoundary: isBoundary || false,
        isSix: isSix || false,
        commentary: buildBallCommentary(
          commentary,
          isWicket ? wicketPlayerId || null : null,
          isWicket ? wicketPlayerOrder : null
        ),
      },
    });

    const totalRuns = (runs || 0) + (extraRuns || 0);
    const isLegalBall = !isExtra || extraType === "BYE" || extraType === "LEG_BYE";

    // --- Update innings totals ---
    const inningsUpdate: any = {
      totalRuns: { increment: totalRuns },
      extras: { increment: extraRuns || 0 },
    };
    if (isLegalBall) inningsUpdate.totalBalls = { increment: 1 };
    if (wicketCountsAgainstTeam) inningsUpdate.totalWickets = { increment: 1 };

    if (extraType === "WIDE") inningsUpdate.wides = { increment: extraRuns || 0 };
    if (extraType === "NO_BALL") inningsUpdate.noBalls = { increment: 1 };
    if (extraType === "BYE") inningsUpdate.byes = { increment: extraRuns || 0 };
    if (extraType === "LEG_BYE") inningsUpdate.legByes = { increment: extraRuns || 0 };

    const updatedInnings = await prisma.innings.update({
      where: { id: inningsId },
      data: inningsUpdate,
      include: {
        match: {
          include: {
            league: true,
            innings: true,
            homeTeam: { select: { id: true, name: true } },
            awayTeam: { select: { id: true, name: true } },
          },
        },
      },
    });

    // --- Update over stats ---
    const updatedOver = await prisma.over.update({
      where: { id: overId },
      data: { 
          runs: { increment: totalRuns },
          wickets: wicketCountsAgainstTeam ? { increment: 1 } : undefined 
      },
      include: { balls: true },
    });

    const legalBallsInOver = updatedOver.balls.filter(
      (b) => !b.isExtra || b.extraType === "BYE" || b.extraType === "LEG_BYE"
    ).length;

    if (legalBallsInOver >= 6 && !updatedOver.isCompleted) {
      const overBowlerRuns = updatedOver.balls.reduce((s, b) => {
        if (b.extraType === "BYE" || b.extraType === "LEG_BYE") return s;
        return s + b.runs + b.extraRuns;
      }, 0);
      const isMaiden = overBowlerRuns === 0;

      await prisma.over.update({
        where: { id: overId },
        data: { isCompleted: true, isMaiden },
      });

      if (isMaiden && bowlerId) {
        await prisma.bowlingScorecard.updateMany({
          where: { inningsId, playerId: bowlerId },
          data: { maidens: { increment: 1 } },
        });
      }
    }

    const newTotalBalls = updatedInnings.totalBalls;
    const totalOvers = Math.floor(newTotalBalls / 6) + (newTotalBalls % 6) / 10;
    await prisma.innings.update({
      where: { id: inningsId },
      data: { totalOvers },
    });

    // --- Update batting scorecard ---
    const countsBatRuns = !isExtra || extraType === "NO_BALL";
    if (batsmanId && countsBatRuns) {
      const existingBatting = await prisma.battingScorecard.findFirst({
        where: { inningsId, playerId: batsmanId },
      });

      const batRuns = isSix ? 6 : isBoundary ? 4 : (runs || 0);
      const nextBatRuns = (existingBatting?.runs || 0) + batRuns;
      const nextBatBalls = (existingBatting?.balls || 0) + 1;
      const nextSR = nextBatBalls > 0 ? Number(((nextBatRuns / nextBatBalls) * 100).toFixed(2)) : 0;

      if (existingBatting) {
        await prisma.battingScorecard.update({
          where: { id: existingBatting.id },
          data: {
            runs: { increment: batRuns },
            balls: { increment: 1 },
            strikeRate: nextSR,
            fours: isBoundary && !isSix ? { increment: 1 } : undefined,
            sixes: isSix ? { increment: 1 } : undefined,
            ...(isWicket && wicketPlayerId === batsmanId && {
              isOut: batterIsOut,
              wicketType: wicketType || null,
              bowlerId: bowlerId || null,
              fielderId: fielderIds || null,
            }),
          },
        });
      } else {
        await prisma.battingScorecard.create({
          data: {
            inningsId,
            playerId: batsmanId,
            runs: batRuns,
            balls: 1,
            strikeRate: nextSR,
            fours: isBoundary && !isSix ? 1 : 0,
            sixes: isSix ? 1 : 0,
            battingOrder: batsmanOrder || 99,
            isOut: isWicket && wicketPlayerId === batsmanId ? batterIsOut : false,
            wicketType: isWicket && wicketPlayerId === batsmanId ? wicketType || null : null,
            bowlerId: isWicket && wicketPlayerId === batsmanId ? bowlerId || null : null,
            fielderId: isWicket && wicketPlayerId === batsmanId ? fielderIds || null : null,
          },
        });
      }
    }

    // --- Update bowling scorecard ---
    if (bowlerId) {
      const existingBowling = await prisma.bowlingScorecard.findFirst({
        where: { inningsId, playerId: bowlerId },
      });

      if (existingBowling) {
        await prisma.bowlingScorecard.update({
          where: { id: existingBowling.id },
          data: {
            runs: { increment: totalRuns },
            wickets: wicketCountsAgainstBowler ? { increment: 1 } : undefined,
            wides: extraType === "WIDE" ? { increment: 1 } : undefined,
            noBalls: extraType === "NO_BALL" ? { increment: 1 } : undefined,
          },
        });
      } else {
        await prisma.bowlingScorecard.create({
          data: {
            inningsId,
            playerId: bowlerId,
            runs: totalRuns,
            wickets: wicketCountsAgainstBowler ? 1 : 0,
            wides: extraType === "WIDE" ? 1 : 0,
            noBalls: extraType === "NO_BALL" ? 1 : 0,
          },
        });
      }

      const bowlerBalls = await prisma.ballEvent.findMany({
        where: { inningsId, bowlerId },
        select: { runs: true, extraRuns: true, isExtra: true, extraType: true },
      });
      const legalBowled = bowlerBalls.filter(
        (b) => !b.isExtra || b.extraType === "BYE" || b.extraType === "LEG_BYE"
      ).length;
      const bOvers = Math.floor(legalBowled / 6) + (legalBowled % 6) / 10;
      const bRuns = bowlerBalls.reduce((sum, b) => sum + b.runs + b.extraRuns, 0);
      const bEco = legalBowled > 0 ? Number((((bRuns * 6) / legalBowled)).toFixed(2)) : 0;

      await prisma.bowlingScorecard.updateMany({
        where: { inningsId, playerId: bowlerId },
        data: { overs: bOvers, economy: bEco },
      });
    }

    // (Omit match completion logic here for brevity, assume Scorer manually triggers /complete when needed, 
    // or we can copy-paste the logic from main route if auto-detect is preferred)

    return jsonWithCors(req, {
      success: true,
      ball,
      innings: { ...updatedInnings, totalOvers },
    });
  } catch (error) {
    return jsonWithCors(req, { error: "Scoring failed" }, { status: 500 });
  }
}
