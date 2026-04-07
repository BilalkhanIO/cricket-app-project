import prisma from "@/lib/prisma";

type BallMeta = {
  dismissedBatsmanId?: string | null;
  dismissedBatsmanOrder?: number | null;
  text?: string | null;
};

export function parseBallMeta(commentary: string | null | undefined): BallMeta | null {
  if (!commentary?.startsWith("__meta__")) return null;

  try {
    return JSON.parse(commentary.slice("__meta__".length)) as BallMeta;
  } catch {
    return null;
  }
}

function isLegalDelivery(ball: {
  isExtra: boolean;
  extraType: string | null;
}) {
  return !ball.isExtra || ball.extraType === "BYE" || ball.extraType === "LEG_BYE";
}

function countsAgainstTeamWicket(ball: {
  isWicket: boolean;
  wicketType: string | null;
}) {
  return ball.isWicket && ball.wicketType !== "RETIRED_HURT";
}

function countsAgainstBowlerWicket(ball: {
  isWicket: boolean;
  wicketType: string | null;
}) {
  return countsAgainstTeamWicket(ball) && !["RUN_OUT", "RETIRED_OUT"].includes(ball.wicketType || "");
}

function ballsForBatter(ball: {
  batsmanId: string | null;
  isExtra: boolean;
  extraType: string | null;
}) {
  return Boolean(ball.batsmanId) && (!ball.isExtra || ball.extraType === "NO_BALL");
}

export async function replayInningsState(inningsId: string) {
  const innings = await prisma.innings.findUnique({
    where: { id: inningsId },
    include: {
      overs: {
        include: {
          balls: {
            orderBy: [{ overNumber: "asc" }, { ballNumber: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: { overNumber: "asc" },
      },
      ballEvents: {
        orderBy: [{ overNumber: "asc" }, { ballNumber: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!innings) {
    throw new Error("Innings not found");
  }

  const balls = innings.ballEvents;

  const totalRuns = balls.reduce((sum, ball) => sum + ball.runs + ball.extraRuns, 0);
  const totalWickets = balls.filter((ball) => countsAgainstTeamWicket(ball)).length;
  const totalBalls = balls.filter((ball) => isLegalDelivery(ball)).length;
  const wides = balls
    .filter((ball) => ball.extraType === "WIDE")
    .reduce((sum, ball) => sum + ball.extraRuns, 0);
  const noBalls = balls.filter((ball) => ball.extraType === "NO_BALL").length;
  const byes = balls
    .filter((ball) => ball.extraType === "BYE")
    .reduce((sum, ball) => sum + ball.extraRuns, 0);
  const legByes = balls
    .filter((ball) => ball.extraType === "LEG_BYE")
    .reduce((sum, ball) => sum + ball.extraRuns, 0);
  const extras = wides + noBalls + byes + legByes;
  const totalOvers = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;

  await prisma.innings.update({
    where: { id: inningsId },
    data: {
      totalRuns,
      totalWickets,
      totalBalls,
      totalOvers,
      extras,
      wides,
      noBalls,
      byes,
      legByes,
    },
  });

  for (const over of innings.overs) {
    const overRuns = over.balls.reduce((sum, ball) => sum + ball.runs + ball.extraRuns, 0);
    const overWickets = over.balls.filter((ball) => countsAgainstTeamWicket(ball)).length;
    const overLegalBalls = over.balls.filter((ball) => isLegalDelivery(ball)).length;
    const bowlerRunsConceded = over.balls.reduce((sum, ball) => {
      if (ball.extraType === "BYE" || ball.extraType === "LEG_BYE") return sum;
      return sum + ball.runs + ball.extraRuns;
    }, 0);

    await prisma.over.update({
      where: { id: over.id },
      data: {
        runs: overRuns,
        wickets: overWickets,
        isCompleted: overLegalBalls >= 6,
        isMaiden: overLegalBalls >= 6 && bowlerRunsConceded === 0,
      },
    });
  }

  await prisma.battingScorecard.deleteMany({ where: { inningsId } });
  await prisma.bowlingScorecard.deleteMany({ where: { inningsId } });

  const battingMap = new Map<
    string,
    {
      playerId: string;
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      battingOrder: number;
      isOut: boolean;
      wicketType: string | null;
      bowlerId: string | null;
      fielderId: string | null;
    }
  >();

  const bowlingMap = new Map<
    string,
    {
      playerId: string;
      runs: number;
      wickets: number;
      wides: number;
      noBalls: number;
      legalBalls: number;
    }
  >();

  for (const ball of balls) {
    const meta = parseBallMeta(ball.commentary);

    if (ball.batsmanId && !battingMap.has(ball.batsmanId)) {
      battingMap.set(ball.batsmanId, {
        playerId: ball.batsmanId,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        battingOrder: 99,
        isOut: false,
        wicketType: null,
        bowlerId: null,
        fielderId: null,
      });
    }

    if (ball.batsmanId && ballsForBatter(ball)) {
      const batter = battingMap.get(ball.batsmanId)!;
      batter.runs += ball.runs;
      batter.balls += 1;
      if (ball.isBoundary && !ball.isSix) batter.fours += 1;
      if (ball.isSix) batter.sixes += 1;
    }

    const dismissedPlayerId = meta?.dismissedBatsmanId || ball.batsmanId;
    const dismissedBatsmanOrder = meta?.dismissedBatsmanOrder || 99;
    if (ball.isWicket && dismissedPlayerId) {
      const dismissed = battingMap.get(dismissedPlayerId) || {
        playerId: dismissedPlayerId,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        battingOrder: dismissedBatsmanOrder,
        isOut: false,
        wicketType: null,
        bowlerId: null,
        fielderId: null,
      };
      dismissed.battingOrder = Math.min(dismissed.battingOrder, dismissedBatsmanOrder || 99);
      dismissed.isOut = countsAgainstTeamWicket(ball);
      dismissed.wicketType = ball.wicketType || null;
      dismissed.bowlerId = ball.bowlerId || null;
      dismissed.fielderId = ball.fielderIds || null;
      battingMap.set(dismissedPlayerId, dismissed);
    }

    if (ball.bowlerId) {
      const bowling = bowlingMap.get(ball.bowlerId) || {
        playerId: ball.bowlerId,
        runs: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
        legalBalls: 0,
      };
      bowling.runs += ball.runs + ball.extraRuns;
      if (countsAgainstBowlerWicket(ball)) bowling.wickets += 1;
      if (ball.extraType === "WIDE") bowling.wides += 1;
      if (ball.extraType === "NO_BALL") bowling.noBalls += 1;
      if (isLegalDelivery(ball)) bowling.legalBalls += 1;
      bowlingMap.set(ball.bowlerId, bowling);
    }
  }

  if (battingMap.size > 0) {
    await prisma.battingScorecard.createMany({
      data: Array.from(battingMap.values()).map((entry) => ({
        inningsId,
        playerId: entry.playerId,
        runs: entry.runs,
        balls: entry.balls,
        fours: entry.fours,
        sixes: entry.sixes,
        strikeRate: entry.balls > 0 ? Number(((entry.runs * 100) / entry.balls).toFixed(2)) : 0,
        isOut: entry.isOut,
        wicketType: entry.wicketType,
        bowlerId: entry.bowlerId,
        fielderId: entry.fielderId,
        battingOrder: entry.battingOrder,
      })),
    });
  }

  if (bowlingMap.size > 0) {
    const bowlerOvers = innings.overs.reduce<Record<string, number>>((accumulator, over) => {
      if (!over.bowlerId) return accumulator;
      const legalBalls = over.balls.filter((ball) => isLegalDelivery(ball)).length;
      const bowlerRunsConceded = over.balls.reduce((sum, ball) => {
        if (ball.extraType === "BYE" || ball.extraType === "LEG_BYE") return sum;
        return sum + ball.runs + ball.extraRuns;
      }, 0);
      if (legalBalls >= 6 && bowlerRunsConceded === 0) {
        accumulator[over.bowlerId] = (accumulator[over.bowlerId] || 0) + 1;
      }
      return accumulator;
    }, {});

    await prisma.bowlingScorecard.createMany({
      data: Array.from(bowlingMap.values()).map((entry) => ({
        inningsId,
        playerId: entry.playerId,
        overs: Math.floor(entry.legalBalls / 6) + (entry.legalBalls % 6) / 10,
        maidens: bowlerOvers[entry.playerId] || 0,
        runs: entry.runs,
        wickets: entry.wickets,
        economy:
          entry.legalBalls > 0 ? Number((((entry.runs * 6) / entry.legalBalls)).toFixed(2)) : 0,
        wides: entry.wides,
        noBalls: entry.noBalls,
      })),
    });
  }

  return prisma.innings.findUnique({
    where: { id: inningsId },
    include: {
      overs: {
        include: { balls: true },
        orderBy: { overNumber: "asc" },
      },
      battingScores: true,
      bowlingScores: true,
    },
  });
}
