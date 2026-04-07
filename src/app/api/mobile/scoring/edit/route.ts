import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import { canScoreMatch } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { ROLE } from "@/lib/roles";
import { replayInningsState } from "@/lib/scoring-replay";

export const dynamic = "force-dynamic";

function buildBallCommentary(
  commentary: string | null | undefined,
  dismissedBatsmanId: string | null,
  dismissedBatsmanOrder: number | null,
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

export async function PATCH(req: NextRequest) {
  try {
    const user = getMobileUserFromRequest(req);
    if (!user) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
    if (!canScoreMatch(user.role)) {
      return jsonWithCors(req, { error: "Forbidden" }, { status: 403 });
    }

    const {
      eventId,
      batsmanId,
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
    } = await req.json();

    if (!eventId) {
      return jsonWithCors(req, { error: "eventId is required" }, { status: 400 });
    }
    if ((runs ?? 0) < 0 || (extraRuns ?? 0) < 0) {
      return jsonWithCors(req, { error: "Runs cannot be negative" }, { status: 400 });
    }

    const event = await prisma.ballEvent.findUnique({
      where: { id: eventId },
      include: {
        innings: {
          select: {
            id: true,
            teamId: true,
            matchId: true,
            match: {
              select: {
                id: true,
                status: true,
                scorerId: true,
                homeTeamId: true,
                awayTeamId: true,
              },
            },
          },
        },
        over: {
          select: { bowlerId: true },
        },
      },
    });

    if (!event) return jsonWithCors(req, { error: "Ball event not found" }, { status: 404 });
    if (event.innings.match.status === "COMPLETED") {
      return jsonWithCors(
        req,
        { error: "Editing completed matches is not supported by this route" },
        { status: 409 },
      );
    }
    if (user.role === ROLE.SCORER && event.innings.match.scorerId !== user.id) {
      return jsonWithCors(req, { error: "You are not the assigned scorer for this match" }, { status: 403 });
    }

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

    const nextExtraType = isExtra ? extraType : null;
    if (isExtra && (!nextExtraType || !validExtras.has(nextExtraType))) {
      return jsonWithCors(req, { error: "Invalid extra type" }, { status: 400 });
    }
    if (isWicket && (!wicketType || !validWicketTypes.has(wicketType))) {
      return jsonWithCors(req, { error: "Invalid wicket type" }, { status: 400 });
    }
    if (isWicket && ["CAUGHT", "RUN_OUT", "STUMPED"].includes(wicketType || "") && !fielderIds) {
      return jsonWithCors(req, { error: "Fielder is required for selected wicket type" }, { status: 400 });
    }
    if (isWicket && nextExtraType === "WIDE" && !["RUN_OUT", "STUMPED", "HIT_WICKET"].includes(wicketType || "")) {
      return jsonWithCors(req, { error: "Invalid wicket type on a wide ball" }, { status: 400 });
    }
    if (isWicket && nextExtraType === "NO_BALL" && wicketType !== "RUN_OUT") {
      return jsonWithCors(req, { error: "Only run out is allowed on a no-ball" }, { status: 400 });
    }

    const bowlingTeamId =
      event.innings.teamId === event.innings.match.homeTeamId
        ? event.innings.match.awayTeamId
        : event.innings.match.homeTeamId;

    if (batsmanId) {
      const batter = await prisma.player.findUnique({
        where: { id: batsmanId },
        select: { teamId: true },
      });
      if (!batter || batter.teamId !== event.innings.teamId) {
        return jsonWithCors(req, { error: "Invalid batsman for batting team" }, { status: 400 });
      }
    }

    const nextDismissedPlayerId = dismissedBatsmanId || batsmanId || null;
    if (isWicket && nextDismissedPlayerId) {
      const dismissedPlayer = await prisma.player.findUnique({
        where: { id: nextDismissedPlayerId },
        select: { teamId: true },
      });
      if (!dismissedPlayer || dismissedPlayer.teamId !== event.innings.teamId) {
        return jsonWithCors(req, { error: "Invalid dismissed batter for batting team" }, { status: 400 });
      }
    }

    if (bowlerId) {
      const bowler = await prisma.player.findUnique({
        where: { id: bowlerId },
        select: { teamId: true },
      });
      if (!bowler || bowler.teamId !== bowlingTeamId) {
        return jsonWithCors(req, { error: "Invalid bowler for bowling team" }, { status: 400 });
      }
    }

    if (event.over.bowlerId && bowlerId && event.over.bowlerId !== bowlerId) {
      return jsonWithCors(
        req,
        { error: "Ball bowler must match the selected over bowler" },
        { status: 400 },
      );
    }

    const oldValue = JSON.stringify(event);

    const updatedBall = await prisma.ballEvent.update({
      where: { id: eventId },
      data: {
        batsmanId: batsmanId || null,
        bowlerId: bowlerId || null,
        runs: runs || 0,
        runsOffBat: runs || 0,
        isWicket: Boolean(isWicket),
        wicketType: wicketType || null,
        fielderIds: fielderIds || null,
        fielderId: fielderIds || null,
        isExtra: Boolean(isExtra),
        extraType: nextExtraType,
        extraRuns: extraRuns || 0,
        playerOutId: isWicket ? nextDismissedPlayerId : null,
        strikerId: batsmanId || null,
        deliveryType: nextExtraType || "NORMAL",
        isLegalDelivery: !isExtra || nextExtraType === "BYE" || nextExtraType === "LEG_BYE",
        isBoundary: Boolean(isBoundary),
        isSix: Boolean(isSix),
        editedBy: user.id,
        editedAt: new Date(),
        editedFlag: true,
        revisionNo: { increment: 1 },
        commentary: buildBallCommentary(
          commentary,
          isWicket ? nextDismissedPlayerId : null,
          isWicket ? dismissedBatsmanOrder || null : null,
        ),
      },
    });

    const innings = await replayInningsState(event.innings.id);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        matchId: event.innings.matchId,
        action: "BALL_EVENT_EDIT",
        entity: "BallEvent",
        entityId: eventId,
        oldValue,
        newValue: JSON.stringify(updatedBall),
      },
    });

    await prisma.ballEventAudit.create({
      data: {
        eventId,
        inningsId: event.innings.id,
        matchId: event.innings.matchId,
        changedBy: user.id,
        action: "EDIT",
        oldValue,
        newValue: JSON.stringify(updatedBall),
        revisionNo: updatedBall.revisionNo,
      },
    });

    return jsonWithCors(req, {
      ball: updatedBall,
      innings,
      message: "Ball event updated and innings replayed",
    });
  } catch (error) {
    console.error("Mobile scoring edit error:", error);
    return jsonWithCors(req, { error: "Failed to edit ball event" }, { status: 500 });
  }
}
