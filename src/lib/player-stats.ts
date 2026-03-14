import prisma from "@/lib/prisma";
import { ballsToOversNotation, calcEconomyFromBalls, oversNotationToBalls } from "@/lib/utils";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";


type BattingRow = {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
};

type BowlingRow = {
  playerId: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
};

type InningsInput = {
  battingScores: BattingRow[];
  bowlingScores: BowlingRow[];
};

type PlayerMatchDelta = {
  matchesPlayed: number;
  innings: number;
  dismissals: number;
  notOuts: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  thirties: number;
  fifties: number;
  hundreds: number;
  highestScore: number;
  wickets: number;
  oversBowled: number;
  ballsBowled: number;
  maidens: number;
  runsConceded: number;
  bestBowling: string | null;
};

function parseBestBowling(v: string | null | undefined): { wickets: number; runs: number } | null {
  if (!v) return null;
  const parts = v.split("/");
  if (parts.length !== 2) return null;
  const wickets = Number(parts[0]);
  const runs = Number(parts[1]);
  if (!Number.isFinite(wickets) || !Number.isFinite(runs)) return null;
  return { wickets, runs };
}

function formatBestBowling(wickets: number, runs: number) {
  return `${wickets}/${runs}`;
}

function betterBestBowling(
  a: { wickets: number; runs: number } | null,
  b: { wickets: number; runs: number } | null
) {
  if (!a) return b;
  if (!b) return a;
  if (b.wickets > a.wickets) return b;
  if (b.wickets < a.wickets) return a;
  if (b.runs < a.runs) return b;
  return a;
}

function deriveStats(totals: {
  runs: number;
  ballsFaced: number;
  dismissals: number;
  wickets: number;
  runsConceded: number;
  ballsBowled: number;
}) {
  const strikeRate = totals.ballsFaced > 0 ? Number(((totals.runs / totals.ballsFaced) * 100).toFixed(2)) : 0;
  const average = totals.dismissals > 0 ? Number((totals.runs / totals.dismissals).toFixed(2)) : totals.runs;
  const economy = calcEconomyFromBalls(totals.runsConceded, totals.ballsBowled);
  const bowlingAverage = totals.wickets > 0 ? Number((totals.runsConceded / totals.wickets).toFixed(2)) : 0;
  const bowlingStrikeRate = totals.wickets > 0 ? Number((totals.ballsBowled / totals.wickets).toFixed(2)) : 0;
  return { strikeRate, average, economy, bowlingAverage, bowlingStrikeRate };
}

async function upsertPlayerScopeStats(
  playerId: string,
  leagueId: string,
  delta: PlayerMatchDelta
) {
  const existing = await prisma.playerStats.findUnique({
    where: { playerId_leagueId: { playerId, leagueId } },
  });

  if (!existing) {
    const derived = deriveStats({
      runs: delta.runs,
      ballsFaced: delta.ballsFaced,
      dismissals: delta.dismissals,
      wickets: delta.wickets,
      runsConceded: delta.runsConceded,
      ballsBowled: delta.ballsBowled,
    });

    await prisma.playerStats.create({
      data: {
        playerId,
        leagueId,
        matchesPlayed: delta.matchesPlayed,
        innings: delta.innings,
        dismissals: delta.dismissals,
        notOuts: delta.notOuts,
        runs: delta.runs,
        ballsFaced: delta.ballsFaced,
        fours: delta.fours,
        sixes: delta.sixes,
        thirties: delta.thirties,
        fifties: delta.fifties,
        hundreds: delta.hundreds,
        strikeRate: derived.strikeRate,
        average: derived.average,
        highestScore: delta.highestScore,
        wickets: delta.wickets,
        ballsBowled: delta.ballsBowled,
        oversBowled: ballsToOversNotation(delta.ballsBowled),
        maidens: delta.maidens,
        runsConceded: delta.runsConceded,
        economy: derived.economy,
        bowlingAverage: derived.bowlingAverage,
        bowlingStrikeRate: derived.bowlingStrikeRate,
        bestBowling: delta.bestBowling,
      },
    });
    return;
  }

  const updatedTotals = {
    matchesPlayed: existing.matchesPlayed + delta.matchesPlayed,
    innings: existing.innings + delta.innings,
    dismissals: existing.dismissals + delta.dismissals,
    notOuts: existing.notOuts + delta.notOuts,
    runs: existing.runs + delta.runs,
    ballsFaced: existing.ballsFaced + delta.ballsFaced,
    fours: existing.fours + delta.fours,
    sixes: existing.sixes + delta.sixes,
    thirties: existing.thirties + delta.thirties,
    fifties: existing.fifties + delta.fifties,
    hundreds: existing.hundreds + delta.hundreds,
    highestScore: Math.max(existing.highestScore, delta.highestScore),
    wickets: existing.wickets + delta.wickets,
    ballsBowled: existing.ballsBowled + delta.ballsBowled,
    oversBowled: 0,
    maidens: existing.maidens + delta.maidens,
    runsConceded: existing.runsConceded + delta.runsConceded,
  };
  updatedTotals.oversBowled = ballsToOversNotation(updatedTotals.ballsBowled);

  const existingBest = parseBestBowling(existing.bestBowling);
  const deltaBest = parseBestBowling(delta.bestBowling);
  const best = betterBestBowling(existingBest, deltaBest);
  const derived = deriveStats({
    runs: updatedTotals.runs,
    ballsFaced: updatedTotals.ballsFaced,
    dismissals: updatedTotals.dismissals,
    wickets: updatedTotals.wickets,
    runsConceded: updatedTotals.runsConceded,
    ballsBowled: updatedTotals.ballsBowled,
  });

  await prisma.playerStats.update({
    where: { playerId_leagueId: { playerId, leagueId } },
    data: {
      ...updatedTotals,
      strikeRate: derived.strikeRate,
      average: derived.average,
      economy: derived.economy,
      bowlingAverage: derived.bowlingAverage,
      bowlingStrikeRate: derived.bowlingStrikeRate,
      bestBowling: best ? formatBestBowling(best.wickets, best.runs) : null,
      updatedAt: new Date(),
    },
  });
}

export async function updatePlayerStatsForMatchScopes(
  innings: InningsInput[],
  leagueId: string
) {
  const deltas = new Map<string, PlayerMatchDelta>();

  const ensure = (playerId: string) => {
    if (!deltas.has(playerId)) {
      deltas.set(playerId, {
        matchesPlayed: 1,
        innings: 0,
        dismissals: 0,
        notOuts: 0,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        thirties: 0,
        fifties: 0,
        hundreds: 0,
        highestScore: 0,
        wickets: 0,
        oversBowled: 0,
        ballsBowled: 0,
        maidens: 0,
        runsConceded: 0,
        bestBowling: null,
      });
    }
    return deltas.get(playerId)!;
  };

  for (const inn of innings) {
    for (const bat of inn.battingScores) {
      const p = ensure(bat.playerId);
      p.innings += 1;
      p.runs += bat.runs;
      p.ballsFaced += bat.balls;
      p.fours += bat.fours;
      p.sixes += bat.sixes;
      if (bat.isOut) p.dismissals += 1;
      else p.notOuts += 1;
      if (bat.runs >= 100) p.hundreds += 1;
      else if (bat.runs >= 50) p.fifties += 1;
      else if (bat.runs >= 30) p.thirties += 1;
      p.highestScore = Math.max(p.highestScore, bat.runs);
    }

    for (const bowl of inn.bowlingScores) {
      const p = ensure(bowl.playerId);
      p.wickets += bowl.wickets;
      p.oversBowled += bowl.overs;
      p.ballsBowled += oversNotationToBalls(bowl.overs);
      p.maidens += bowl.maidens;
      p.runsConceded += bowl.runs;
      const curBest = parseBestBowling(p.bestBowling);
      const bowlBest = { wickets: bowl.wickets, runs: bowl.runs };
      const better = betterBestBowling(curBest, bowlBest);
      p.bestBowling = better ? formatBestBowling(better.wickets, better.runs) : p.bestBowling;
    }
  }

  for (const [playerId, delta] of deltas) {
    await upsertPlayerScopeStats(playerId, leagueId, delta);
    await upsertPlayerScopeStats(playerId, OVERALL_LEAGUE_KEY, delta);
  }
}
