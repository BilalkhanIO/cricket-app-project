"use client";

import { useState, useEffect, useCallback, use, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/components/ui/ToastProvider";

export const dynamic = 'force-dynamic';

interface Player {
  id: string;
  user: { name: string; profileImage?: string | null };
  isCaptain: boolean;
  isWicketkeeper: boolean;
}

interface BattingScore {
  id: string;
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  wicketType: string | null;
  battingOrder: number;
  player: { user: { name: string } };
}

interface BowlingScore {
  id: string;
  playerId: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
  player: { user: { name: string } };
}

interface BallEvent {
  id: string;
  ballNumber: number;
  overNumber: number;
  runs: number;
  isWicket: boolean;
  wicketType: string | null;
  isExtra: boolean;
  extraType: string | null;
  extraRuns: number;
  isBoundary: boolean;
  isSix: boolean;
}

interface Over {
  id: string;
  overNumber: number;
  bowlerId?: string | null;
  runs: number;
  wickets: number;
  isCompleted: boolean;
  balls: BallEvent[];
}

interface TeamView {
  id: string;
  name: string;
  shortName: string;
  jerseyColor: string | null;
  players: Player[];
}

interface Innings {
  id: string;
  inningsNumber: number;
  teamId: string;
  totalRuns: number;
  totalWickets: number;
  totalBalls: number;
  totalOvers: number;
  extras: number;
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  targetRuns: number | null;
  isCompleted: boolean;
  overs: Over[];
  battingScores: BattingScore[];
  bowlingScores: BowlingScore[];
}

interface Match {
  id: string;
  status: string;
  overs: number;
  scorerId: string | null;
  homeTeam: TeamView;
  awayTeam: TeamView;
  tossWinnerId: string | null;
  tossDecision: string | null;
  league: { oversPerInnings: number };
  innings: Innings[];
  playingXIs: { playerId: string; teamId: string; battingOrder: number; player: Player }[];
}

interface ScoringPlayerOption {
  playerId: string;
  player: Player;
  battingOrder: number;
  teamId?: string;
}

const WICKET_TYPES = ["BOWLED", "CAUGHT", "LBW", "RUN_OUT", "STUMPED", "HIT_WICKET", "RETIRED_HURT", "RETIRED_OUT"];
const FIELDER_REQUIRED = ["CAUGHT", "RUN_OUT", "STUMPED"];

// extraRuns = total runs from this extra delivery (for WIDE: 1=simple wide, 5=wide+4)
const EXTRA_OPTIONS: Record<string, { label: string; runs: number; extraRuns: number }[]> = {
  WIDE: [
    { label: "1 (wd)", runs: 0, extraRuns: 1 },
    { label: "2 (wd+1)", runs: 0, extraRuns: 2 },
    { label: "3 (wd+2)", runs: 0, extraRuns: 3 },
    { label: "5 (wd+4)", runs: 0, extraRuns: 5 },
  ],
  NO_BALL: [
    { label: "1 (nb)", runs: 0, extraRuns: 1 },
    { label: "2 (nb+1)", runs: 1, extraRuns: 1 },
    { label: "5 (nb+4)", runs: 4, extraRuns: 1 },
    { label: "7 (nb+6)", runs: 6, extraRuns: 1 },
  ],
  BYE: [
    { label: "1", runs: 0, extraRuns: 1 },
    { label: "2", runs: 0, extraRuns: 2 },
    { label: "3", runs: 0, extraRuns: 3 },
    { label: "4", runs: 0, extraRuns: 4 },
  ],
  LEG_BYE: [
    { label: "1", runs: 0, extraRuns: 1 },
    { label: "2", runs: 0, extraRuns: 2 },
    { label: "3", runs: 0, extraRuns: 3 },
    { label: "4", runs: 0, extraRuns: 4 },
  ],
};

function oversNotationToBalls(overs: number) {
  const whole = Math.trunc(overs);
  const balls = Math.round((overs - whole) * 10 + Number.EPSILON);
  return whole * 6 + Math.max(0, Math.min(5, balls));
}

function countLegalBalls(balls: BallEvent[]) {
  return balls.filter((ball) => !ball.isExtra || ball.extraType === "BYE" || ball.extraType === "LEG_BYE").length;
}

function BallDot({ ball }: { ball: BallEvent }) {
  const label = ball.isWicket ? "W" : ball.isExtra ? (ball.extraType?.charAt(0) || "E") : ball.runs;
  const color = ball.isWicket
    ? "bg-red-600 text-white"
    : ball.isSix
    ? "bg-purple-600 text-white"
    : ball.isBoundary
    ? "bg-blue-600 text-white"
    : ball.isExtra
    ? "bg-yellow-500 text-gray-900"
    : ball.runs === 0
    ? "bg-gray-600 text-gray-300"
    : "bg-green-600 text-white";
  return (
    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${color}`}>
      {label}
    </span>
  );
}

export default function ScorerPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentInnings, setCurrentInnings] = useState<Innings | null>(null);
  const [currentOverId, setCurrentOverId] = useState<string | null>(null);
  const [ballInOver, setBallInOver] = useState(0);
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [currentBowler, setCurrentBowler] = useState("");
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [selectedWicketType, setSelectedWicketType] = useState("");
  const [fielder, setFielder] = useState("");
  const [dismissedBatter, setDismissedBatter] = useState<"STRIKER" | "NON_STRIKER">("STRIKER");
  const [recentBalls, setRecentBalls] = useState<BallEvent[]>([]);
  const [phase, setPhase] = useState<"toss" | "playing_xi" | "start_innings" | "scoring">("toss");
  const [matchResult, setMatchResult] = useState<string | null>(null);
  const [partnershipRuns, setPartnershipRuns] = useState(0);
  const [partnershipBalls, setPartnershipBalls] = useState(0);
  const [extraMode, setExtraMode] = useState<string | null>(null);
  const [showScorecard, setShowScorecard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMomModal, setShowMomModal] = useState(false);
  const [momPlayerId, setMomPlayerId] = useState("");

  const getTeamPlayerPool = useCallback(
    (teamId: string | null): ScoringPlayerOption[] => {
      if (!match || !teamId) return [];
      const xiPlayers = match.playingXIs
        .filter((p) => p.teamId === teamId)
        .sort((a, b) => (a.battingOrder || 99) - (b.battingOrder || 99));
      if (xiPlayers.length > 0) return xiPlayers;

      const team = teamId === match.homeTeam.id ? match.homeTeam : match.awayTeam;
      return [...(team.players || [])]
        .sort((a, b) => a.user.name.localeCompare(b.user.name))
        .map((p, idx) => ({
          playerId: p.id,
          player: p,
          battingOrder: idx + 1,
          teamId,
        }));
    },
    [match]
  );

  const battingTeamPlayers = useMemo(
    () => getTeamPlayerPool(currentInnings?.teamId || null),
    [getTeamPlayerPool, currentInnings?.teamId]
  );
  const bowlingTeamId = useMemo(
    () =>
      currentInnings
        ? currentInnings.teamId === match?.homeTeam.id
          ? match?.awayTeam.id || null
          : match?.homeTeam.id || null
        : null,
    [currentInnings, match]
  );
  const bowlingTeamPlayers = useMemo(
    () => getTeamPlayerPool(bowlingTeamId),
    [getTeamPlayerPool, bowlingTeamId]
  );

  const fetchMatch = useCallback(async () => {
    const res = await fetch(`/api/matches/${matchId}`);
    const data = await res.json();
    if (data.match) {
      setMatch(data.match);
      determinePhase(data.match);
    }
    setLoading(false);
  }, [matchId]);

  const determinePhase = (m: Match) => {
    if (m.status === "COMPLETED") return;
    if (!m.tossWinnerId) { setPhase("toss"); return; }
    if (m.status === "TOSS" || m.status === "UPCOMING") { setPhase("playing_xi"); return; }

    const activeInnings = m.innings.find((i) => !i.isCompleted);
    if (activeInnings) {
      setCurrentInnings(activeInnings);
      const lastOver = activeInnings.overs[activeInnings.overs.length - 1];
      if (lastOver && !lastOver.isCompleted) {
        setCurrentOverId(lastOver.id);
        setBallInOver(countLegalBalls(lastOver.balls || []));
        setCurrentBowler(lastOver.bowlerId || "");
        setRecentBalls(lastOver.balls || []);
      } else {
        setCurrentOverId(null);
        setBallInOver(0);
        setCurrentBowler("");
        setRecentBalls([]);
      }
      setPhase("scoring");
    } else if (m.innings.length === 0 || m.innings.every((i) => i.isCompleted)) {
      setPhase("start_innings");
    }
  };

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 5000);
    return () => clearInterval(interval);
  }, [fetchMatch]);

  const recordToss = async (winnerId: string, decision: string) => {
    await fetch(`/api/matches/${matchId}/toss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tossWinnerId: winnerId, tossDecision: decision }),
    });
    fetchMatch();
  };

  const startInnings = async () => {
    if (!match) return;
    const battingTeamId = match.innings.length === 0
      ? (match.tossDecision === "bat" ? match.tossWinnerId! :
        match.tossWinnerId === match.homeTeam.id ? match.awayTeam.id : match.homeTeam.id)
      : (match.innings[0].teamId === match.homeTeam.id ? match.awayTeam.id : match.homeTeam.id);

    const target = match.innings.length === 1 ? match.innings[0].totalRuns + 1 : null;

    const res = await fetch(`/api/matches/${matchId}/innings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: battingTeamId, inningsNumber: match.innings.length + 1, targetRuns: target }),
    });
    if (res.ok) fetchMatch();
  };

  const selectNextBowler = useCallback(() => {
    if (!currentInnings || bowlingTeamPlayers.length === 0) return "";
    const lastCompletedOver = [...currentInnings.overs]
      .filter((o) => o.isCompleted)
      .sort((a, b) => b.overNumber - a.overNumber)[0];
    const previousBowlerId = lastCompletedOver?.bowlerId || null;

    const candidates = bowlingTeamPlayers
      .filter((p) => p.playerId !== previousBowlerId)
      .map((p) => {
        const s = currentInnings.bowlingScores.find((b) => b.playerId === p.playerId);
        return {
          ...p,
          balls: s ? oversNotationToBalls(s.overs) : 0,
          runs: s?.runs ?? 0,
        };
      })
      .sort((a, b) => a.balls - b.balls || a.runs - b.runs || a.player.user.name.localeCompare(b.player.user.name));

    return candidates[0]?.playerId || bowlingTeamPlayers[0]?.playerId || "";
  }, [bowlingTeamPlayers, currentInnings]);

  const startOver = useCallback(async (forcedBowlerId?: string) => {
    const bowlerId = forcedBowlerId || currentBowler;
    if (!currentInnings || !bowlerId) return;
    if (!striker || !nonStriker) {
      const message = "Select both batters before starting the over";
      setError(message);
      showToast(message, "error");
      return;
    }
    if (striker === nonStriker) {
      const message = "Striker and non-striker must be different players";
      setError(message);
      showToast(message, "error");
      return;
    }
    setError(null);
    const overNum = Math.floor(currentInnings.totalBalls / 6) + 1;

    const res = await fetch("/api/scoring/over", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inningsId: currentInnings.id, overNumber: overNum, bowlerId }),
    });
    const data = await res.json();
    if (data.over) {
      setCurrentOverId(data.over.id);
      setBallInOver(0);
      setRecentBalls([]);
      setCurrentBowler(bowlerId);
      showToast(`Over ${overNum} started`, "success");
      return true;
    }
    if (!res.ok) {
      const message = data.error || "Failed to start over";
      setError(message);
      showToast(message, "error");
    }
    return false;
  }, [currentBowler, currentInnings, nonStriker, showToast, striker]);

  const updateCurrentOverBowler = useCallback(async (bowlerId: string) => {
    if (!currentOverId) {
      setCurrentBowler(bowlerId);
      setError(null);
      return;
    }

    if (ballInOver > 0) {
      const message = "Bowler can only be changed before the first ball of the over";
      setError(message);
      showToast(message, "error");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/scoring/over", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overId: currentOverId, bowlerId }),
    });

    const data = await res.json();
    if (!res.ok) {
      const message = data.error || "Failed to update bowler";
      setError(message);
      showToast(message, "error");
      setSubmitting(false);
      return;
    }

    setCurrentBowler(bowlerId);
    await fetchMatch();
    showToast("Bowler updated", "success");
    setSubmitting(false);
  }, [ballInOver, currentOverId, fetchMatch, showToast]);

  const getNextBatter = useCallback(
    (exclude: string[] = []) => {
      if (!currentInnings) return "";
      const dismissed = new Set(currentInnings.battingScores.filter((b) => b.isOut).map((b) => b.playerId));
      for (const pid of exclude) dismissed.add(pid);
      const next = battingTeamPlayers.find((p) => !dismissed.has(p.playerId));
      return next?.playerId || "";
    },
    [battingTeamPlayers, currentInnings]
  );

  const getBattingOrder = useCallback(
    (playerId: string) => battingTeamPlayers.find((player) => player.playerId === playerId)?.battingOrder || 99,
    [battingTeamPlayers]
  );

  useEffect(() => {
    if (!match || !currentInnings || phase !== "scoring" || match.status === "COMPLETED") return;

    if (!striker || !nonStriker || striker === nonStriker) {
      const liveBatters = currentInnings.battingScores
        .filter((batter) => !batter.isOut)
        .sort((a, b) => a.battingOrder - b.battingOrder)
        .map((batter) => batter.playerId);

      const first = liveBatters.find((playerId) => playerId !== nonStriker) || striker || getNextBatter([nonStriker]);
      const second =
        liveBatters.find((playerId) => playerId !== first) ||
        nonStriker ||
        getNextBatter([first]);

      if (first && first !== striker) setStriker(first);
      if (second && second !== nonStriker && second !== first) setNonStriker(second);
    }

    if (!currentBowler && bowlingTeamPlayers.length > 0) {
      const nextBowler = selectNextBowler();
      if (nextBowler) setCurrentBowler(nextBowler);
    }

  }, [
    bowlingTeamPlayers,
    currentBowler,
    currentInnings,
    currentOverId,
    getNextBatter,
    match,
    nonStriker,
    phase,
    selectNextBowler,
    striker,
  ]);

  const addBall = async (
    runs: number,
    extras?: { type: string; runs: number },
    isWicket?: boolean,
    wtParam?: string,
    fielderParam?: string,
    dismissedBatterParam?: "STRIKER" | "NON_STRIKER",
  ) => {
    if (!currentInnings || !currentOverId) return;
    if (!striker) { const message = "Select striker before recording a ball"; setError(message); showToast(message, "error"); return; }
    if (!nonStriker) { const message = "Select non-striker before recording a ball"; setError(message); showToast(message, "error"); return; }
    if (striker === nonStriker) { const message = "Striker and non-striker must be different players"; setError(message); showToast(message, "error"); return; }
    if (!currentBowler) { const message = "Select bowler before recording a ball"; setError(message); showToast(message, "error"); return; }
    setError(null);
    setSubmitting(true);
    setExtraMode(null);

    const dismissedPlayerId =
      isWicket && dismissedBatterParam === "NON_STRIKER"
        ? nonStriker
        : striker;

    const body = {
      inningsId: currentInnings.id,
      overId: currentOverId,
      ballNumber: ballInOver + 1,
      overNumber: Math.floor(currentInnings.totalBalls / 6) + 1,
      batsmanId: striker,
      batsmanOrder: getBattingOrder(striker),
      bowlerId: currentBowler,
      runs,
      isWicket: isWicket || false,
      wicketType: isWicket ? (wtParam || "") : null,
      dismissedBatsmanId: isWicket ? dismissedPlayerId : null,
      dismissedBatsmanOrder: isWicket ? getBattingOrder(dismissedPlayerId) : null,
      isExtra: !!extras,
      extraType: extras?.type || null,
      extraRuns: extras?.runs || 0,
      isBoundary: runs === 4 && !extras,
      isSix: runs === 6 && !extras,
      fielderIds: fielderParam || null,
    };

    const res = await fetch("/api/scoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      const message = data.error || "Failed to record ball";
      setError(message);
      showToast(message, "error");
      setSubmitting(false);
      return;
    }

    if (data.ball) {
      const newBall: BallEvent = {
        id: data.ball.id,
        ballNumber: body.ballNumber,
        overNumber: body.overNumber,
        runs,
        isWicket: body.isWicket,
        wicketType: body.wicketType,
        isExtra: body.isExtra,
        extraType: body.extraType,
        extraRuns: body.extraRuns,
        isBoundary: body.isBoundary,
        isSix: body.isSix,
      };
      setRecentBalls((prev) => [...prev, newBall]);

      const isLegalBall = !extras || ["BYE", "LEG_BYE"].includes(extras.type);
      const completesOver = isLegalBall && ballInOver + 1 >= 6;
      let nextStriker = striker;
      let nextNonStriker = nonStriker;

      if (isLegalBall) {
        setPartnershipBalls((prev) => prev + 1);
        const newBallInOver = ballInOver + 1;
        if (completesOver) {
          setBallInOver(0);
          setCurrentOverId(null);
          setCurrentBowler("");
          setRecentBalls([]);
        } else {
          setBallInOver(newBallInOver);
        }
      }

      setPartnershipRuns((prev) => prev + runs + (extras?.runs || 0));

      if (isWicket) {
        setShowWicketModal(false);
        setSelectedWicketType("");
        setFielder("");
        setDismissedBatter("STRIKER");
        const outPlayer = dismissedBatterParam === "NON_STRIKER" ? nonStriker : striker;
        const survivor = dismissedBatterParam === "NON_STRIKER" ? striker : nonStriker;
        const nextBatter = getNextBatter([striker, nonStriker]);
        if (outPlayer === striker) {
          nextStriker = nextBatter;
          nextNonStriker = survivor;
        } else {
          nextStriker = striker;
          nextNonStriker = nextBatter;
        }
        setPartnershipRuns(0);
        setPartnershipBalls(0);
      } else {
        const strikeRuns =
          extras && ["BYE", "LEG_BYE"].includes(extras.type) ? extras.runs : runs;
        if (strikeRuns % 2 === 1) {
          [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
        }
      }
      if (completesOver) {
        [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
      }

      setStriker(nextStriker);
      setNonStriker(nextNonStriker);

      if (data.matchCompleted && data.result) {
        setMatchResult(data.result);
        setShowMomModal(true);
        showToast("Match result is ready to finalize", "success");
      }

      await fetchMatch();
    }

    setSubmitting(false);
  };

  const undoLastBall = async () => {
    if (!currentInnings) return;
    setSubmitting(true);

    const res = await fetch("/api/scoring/undo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inningsId: currentInnings.id }),
    });

    if (res.ok) {
      setRecentBalls((prev) => prev.slice(0, -1));
      await fetchMatch();
    }
    setSubmitting(false);
  };

  const completeMatch = async (winnerId: string, winMargin: number, winType: string) => {
    if (!match) return;
    const winnerName = winnerId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name;
    const result = `${winnerName} won by ${winMargin} ${winType}`;
    await fetch("/api/scoring/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, result, winnerTeamId: winnerId, winMargin, winType, playerOfMatchId: momPlayerId || null }),
    });
    setShowMomModal(false);
    showToast("Match completed", "success");
    fetchMatch();
  };

  const handleAutoComplete = (result: string) => {
    setMatchResult(result);
    setShowMomModal(true);
  };

  const getManualOutcome = useCallback(
    (winnerId: string) => {
      if (!match) {
        return { winMargin: 0, winType: "runs" };
      }

      const firstInningsLocal = match.innings.find((innings) => innings.inningsNumber === 1);

      if (!currentInnings || !firstInningsLocal) {
        return { winMargin: 0, winType: "runs" };
      }

      const defendingTeamId = firstInningsLocal.teamId;
      const chasingTeamId = defendingTeamId === match.homeTeam.id ? match.awayTeam.id : match.homeTeam.id;

      if (currentInnings.inningsNumber === 2) {
        if (winnerId === chasingTeamId) {
          const wicketsLeft = Math.max(0, 10 - currentInnings.totalWickets);
          return { winMargin: wicketsLeft, winType: "wickets" };
        }

        const runsMargin = Math.max(0, firstInningsLocal.totalRuns - currentInnings.totalRuns);
        return { winMargin: runsMargin, winType: "runs" };
      }

      return { winMargin: Math.max(0, currentInnings.totalRuns), winType: "runs" };
    },
    [currentInnings, match]
  );

  if (!session || !["SUPER_ADMIN", "LEAGUE_ADMIN", "SCORER"].includes(session.user.role)) {
    return (
      <div className="min-h-screen bg-[#00142b] text-white flex items-center justify-center px-4">
        <div className="border border-white/10 bg-[#001c3a] p-8 text-center max-w-md w-full">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">Scoring access</p>
          <h2 className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tight mt-3">Access denied</h2>
          <p className="text-[#9bb2d1] mt-3 text-sm leading-7">Only scorers and authorized admins can access this scoring console.</p>
          <Link href="/login" className="mt-5 inline-block bg-[#4ae183] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#003919]">Login as scorer</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#00142b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-[#4ae183] border-t-transparent rounded-full"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">Loading match console</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#00142b] text-white flex items-center justify-center px-4">
        <div className="border border-white/10 bg-[#001c3a] p-8 text-center">
          <p className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight">Match not found</p>
        </div>
      </div>
    );
  }

  // Only the assigned scorer (or admin) can access this panel
  const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "LEAGUE_ADMIN";
  const isAssignedScorer = match.scorerId === session.user.id;
  if (!isAdmin && !isAssignedScorer) {
    return (
      <div className="min-h-screen bg-[#00142b] text-white flex items-center justify-center px-4">
        <div className="border border-white/10 bg-[#001c3a] p-8 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tight mb-3">Not your match</h2>
          <p className="text-[#9bb2d1] mb-4 text-sm leading-7">
            You are not the assigned scorer for this match. Contact the league admin if this is a mistake.
          </p>
          <Link href="/dashboard/scorer" className="inline-block bg-[#4ae183] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#003919]">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const playerOptions = (players: ScoringPlayerOption[]) => [
    { value: "", label: "Select player..." },
    ...players.map((p) => ({ value: p.playerId, label: p.player.user.name })),
  ];
  const hasBothXIs =
    match.playingXIs.some((p) => p.teamId === match.homeTeam.id) &&
    match.playingXIs.some((p) => p.teamId === match.awayTeam.id);
  const allMatchPlayers: ScoringPlayerOption[] = hasBothXIs
    ? match.playingXIs
    : [
        ...match.homeTeam.players.map((p, idx) => ({ playerId: p.id, player: p, battingOrder: idx + 1, teamId: match.homeTeam.id })),
        ...match.awayTeam.players.map((p, idx) => ({ playerId: p.id, player: p, battingOrder: idx + 1, teamId: match.awayTeam.id })),
      ];

  const firstInnings = match.innings.find((i) => i.inningsNumber === 1);
  const maxBalls = match.overs * 6;

  const currentRunRate = currentInnings && currentInnings.totalBalls > 0
    ? (currentInnings.totalRuns / currentInnings.totalBalls) * 6
    : 0;
  const canEditBatters = !currentOverId || ballInOver === 0;
  const canEditBowler = !currentOverId || ballInOver === 0;
  const selectionError =
    striker && nonStriker && striker === nonStriker
      ? "Striker and non-striker must be different players."
      : null;
  const canStartOver =
    !submitting &&
    !currentOverId &&
    !!striker &&
    !!nonStriker &&
    !!currentBowler &&
    !selectionError;

  let requiredRunRate: number | null = null;
  let runsNeeded = 0;
  let ballsLeft = 0;

  if (currentInnings && currentInnings.inningsNumber === 2 && firstInnings) {
    const target = firstInnings.totalRuns + 1;
    runsNeeded = target - currentInnings.totalRuns;
    ballsLeft = maxBalls - currentInnings.totalBalls;
    if (ballsLeft > 0 && runsNeeded > 0) {
      requiredRunRate = (runsNeeded / ballsLeft) * 6;
    }
  }

  const projectedScore = currentInnings && currentInnings.totalBalls > 0
    ? Math.round((currentInnings.totalRuns / currentInnings.totalBalls) * maxBalls)
    : 0;

  const overData = currentInnings
    ? currentInnings.overs.map((over) => ({
        over: `O${over.overNumber}`,
        runs: over.runs || 0,
        wickets: over.wickets || 0,
      }))
    : [];

  // Current over balls (for display)
  const currentOverBalls = currentOverId && currentInnings
    ? currentInnings.overs.find((o) => o.id === currentOverId)?.balls || recentBalls
    : recentBalls;

  // Current bowler spell
  const currentBowlerScore = currentInnings?.bowlingScores.find((b) => b.playerId === currentBowler);

  // Active batters (not out)
  const activeBatters = currentInnings?.battingScores.filter((b) => !b.isOut) || [];
  const strikerScore = activeBatters.find((b) => b.playerId === striker);
  const nonStrikerScore = activeBatters.find((b) => b.playerId === nonStriker);
  const fieldSelectClass =
    "w-full appearance-none border border-white/10 bg-[#00142b] px-3 py-3 text-sm font-medium text-white outline-none transition focus:border-[#4ae183] disabled:cursor-not-allowed disabled:opacity-60";
  const setupCardClass = "border border-white/10 bg-[#001c3a] p-4 sm:p-5";

  // Fall of wickets
  const dismissedBatters = currentInnings?.battingScores.filter((b) => b.isOut) || [];

  return (
    <div className="min-h-screen bg-[#00142b] text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(0,20,43,0.94)] backdrop-blur-xl">
        <div className="border-b border-white/10 bg-[rgba(15,34,51,0.72)] px-3 sm:px-4 py-2">
          <div className="mx-auto max-w-screen-xl flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#9bb2d1]">
            <span>Scoring console</span>
            <span>{phase.replace(/_/g, " ")}</span>
          </div>
        </div>
        <div className="mx-auto max-w-screen-xl px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href={`/matches/${match.id}`} className="shrink-0 bg-[#001c3a] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#d4e3ff] hover:bg-[#0b2747]">
              Back
            </Link>
            <div className="min-w-0">
              <p className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white truncate">
                {match.homeTeam.shortName} vs {match.awayTeam.shortName}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1] truncate">
                {match.league.oversPerInnings || match.overs} overs
              </p>
            </div>
          </div>
          <span className={`text-[10px] px-3 py-2 font-black uppercase tracking-[0.18em] ${
            match.status === "LIVE" ? "bg-[#93000a] text-[#ffdad6] animate-pulse" :
            match.status === "COMPLETED" ? "bg-[#4ae183] text-[#003919]" : "bg-[#12324d] text-[#d4e3ff]"
          }`}>
            {match.status}
          </span>
        </div>
      </div>

      {/* Man of the Match Modal */}
      {showMomModal && matchResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">🏆</div>
              <h2 className="text-2xl font-bold text-white mb-1">Match Complete!</h2>
              <p className="text-green-400 font-medium">{matchResult}</p>
            </div>

            <div className="mb-5">
              <label className="text-sm text-gray-300 font-medium block mb-2">
                🏅 Select Man of the Match:
              </label>
              <select
                value={momPlayerId}
                onChange={(e) => setMomPlayerId(e.target.value)}
                className={fieldSelectClass}
              >
                <option value="">-- Skip / Select later --</option>
                {allMatchPlayers.map((p) => (
                  <option key={p.playerId} value={p.playerId}>
                    {p.player.user.name} ({p.teamId === match.homeTeam.id ? match.homeTeam.shortName : p.teamId === match.awayTeam.id ? match.awayTeam.shortName : "TEAM"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  // Save MoM via complete API if manually triggered, or just close
                  if (momPlayerId) {
                    await fetch("/api/scoring/complete", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        matchId,
                        result: matchResult,
                        winnerTeamId: null,
                        playerOfMatchId: momPlayerId,
                      }),
                    }).catch(() => {});
                  }
                  setShowMomModal(false);
                }}
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {momPlayerId ? "Save MoM & Continue" : "Skip MoM"}
              </button>
              <Link
                href={`/matches/${match.id}`}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg text-center transition-colors"
              >
                View Scorecard →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Match Completed */}
      {match.status === "COMPLETED" && !matchResult && (
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold mb-3">Match Completed</h2>
          {match.innings[1]?.isCompleted && (
            <p className="text-gray-400 mb-4">
              {firstInnings && `${firstInnings.totalRuns}/${firstInnings.totalWickets}`}
              {" vs "}
              {match.innings[1] && `${match.innings[1].totalRuns}/${match.innings[1].totalWickets}`}
            </p>
          )}
          <Link href={`/matches/${match.id}`} className="text-green-400 hover:underline">View Full Scorecard →</Link>
        </div>
      )}

      {/* Toss Phase */}
      {phase === "toss" && match.status !== "COMPLETED" && (
        <div className="max-w-lg mx-auto px-4 py-10">
          <div className="border border-white/10 bg-[#001c3a] p-6">
          <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight mb-6 text-center">Record toss</h2>
          <div className="space-y-4">
            {[match.homeTeam, match.awayTeam].map((team) => (
              <div key={team.id} className="border border-white/10 bg-[#00142b] p-5">
                <h3 className="font-semibold mb-3 text-center" style={{ color: team.jerseyColor || "#4ade80" }}>
                  {team.name} wins toss
                </h3>
                <div className="flex gap-3">
                  <button onClick={() => recordToss(team.id, "bat")}
                    className="flex-1 bg-[#4ae183] hover:bg-[#6bfe9c] px-4 py-3 font-medium text-[#003919] transition-colors">
                    Choose to Bat
                  </button>
                  <button onClick={() => recordToss(team.id, "field")}
                    className="flex-1 bg-[#12324d] hover:bg-[#1b3656] px-4 py-3 font-medium transition-colors">
                    Choose to Field
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {/* Playing XI Phase */}
      {phase === "playing_xi" && match.status !== "COMPLETED" && (
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="border border-white/10 bg-[#001c3a] p-6">
          <div className="text-center mb-6">
            <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight mb-2">Toss recorded</h2>
            {match.tossWinnerId && (
              <p className="text-[#9bb2d1]">
                {match.tossWinnerId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name}{" "}
                won toss and chose to {match.tossDecision}
              </p>
            )}
          </div>

          {/* Show Playing XIs if set */}
          {match.playingXIs.length > 0 ? (
            <div className="border border-white/10 bg-[#00142b] p-5 mb-5">
              <p className="text-sm text-green-400 font-medium mb-3">✓ Playing XIs are set</p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                {[match.homeTeam, match.awayTeam].map((team) => {
                  const xi = match.playingXIs.filter((p) => p.teamId === team.id);
                  return (
                    <div key={team.id}>
                      <p className="font-medium text-gray-300 mb-1" style={{ color: team.jerseyColor || undefined }}>
                        {team.shortName} ({xi.length})
                      </p>
                      {xi.map((p, i) => (
                        <p key={p.playerId} className="text-gray-400">{i + 1}. {p.player.user.name}</p>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 mb-5 text-center">
              <p className="text-yellow-300 text-sm">Playing XIs not set yet.</p>
              <p className="text-yellow-400 text-xs mt-1">
                Scoring will continue using full active team rosters automatically.
              </p>
            </div>
          )}

          <button onClick={startInnings}
            className="w-full bg-[#4ae183] hover:bg-[#6bfe9c] px-6 py-4 font-bold text-lg text-[#003919] transition-colors">
            Start 1st Innings
          </button>
          </div>
        </div>
      )}

      {/* Start Innings (Innings Break) */}
      {phase === "start_innings" && match.status !== "COMPLETED" && (
        <div className="max-w-lg mx-auto px-4 py-10 text-center">
          <div className="border border-white/10 bg-[#001c3a] p-6">
          {match.innings.length === 1 && (
            <div className="border border-white/10 bg-[#00142b] p-6 mb-6">
              <p className="text-sm text-gray-400 mb-1">Innings Break</p>
              <p className="text-3xl font-bold text-green-400">
                {match.innings[0].totalRuns}/{match.innings[0].totalWickets}
              </p>
              <p className="text-gray-400 mt-1">({match.innings[0].totalOvers.toFixed(1)} overs)</p>
              <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                <p className="text-yellow-300 font-semibold">Target: {match.innings[0].totalRuns + 1} runs</p>
                <p className="text-gray-400 text-sm mt-1">
                  {match.innings[0].totalRuns === 0 ? "Chase anything to win!" :
                    `Need ${match.innings[0].totalRuns + 1} from ${match.overs} overs`}
                </p>
              </div>
            </div>
          )}
          <button onClick={startInnings}
            className="bg-[#4ae183] hover:bg-[#6bfe9c] px-8 py-4 font-bold text-lg text-[#003919] transition-colors">
            Start {match.innings.length + 1}{match.innings.length === 0 ? "st" : "nd"} Innings
          </button>
          </div>
        </div>
      )}

      {/* Scoring Phase */}
      {phase === "scoring" && currentInnings && match.status !== "COMPLETED" && (
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4 pb-20">

          {/* Error banner */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-2 text-red-300 text-sm flex justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">✕</button>
            </div>
          )}

          {!hasBothXIs && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-4 py-2 text-yellow-300 text-xs">
              XI not finalized for one/both teams. Auto scoring is using full team rosters.
            </div>
          )}

          {/* Score Header */}
          <div className="border border-white/10 bg-[#001c3a] p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  {currentInnings.inningsNumber === 1 ? "1st" : "2nd"} Innings —{" "}
                  <span className="font-medium">
                    {currentInnings.teamId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name}
                  </span>
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-green-400 leading-none">
                  {currentInnings.totalRuns}/{currentInnings.totalWickets}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {currentInnings.totalOvers.toFixed(1)} / {match.overs} overs
                </p>
              </div>
              {currentInnings.inningsNumber === 2 && firstInnings && (
                <div className="text-right bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-2.5 sm:p-3">
                  <p className="text-xs text-gray-400">Target</p>
                  <p className="text-2xl font-bold text-yellow-400">{firstInnings.totalRuns + 1}</p>
                  <p className="text-xs text-red-400 font-medium">
                    Need {Math.max(0, runsNeeded)} from {ballsLeft}b
                  </p>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-[#00142b] border border-white/10 p-2 text-center">
                <p className="text-xs text-gray-400">CRR</p>
                <p className="font-bold text-green-400 text-sm">{currentRunRate.toFixed(2)}</p>
              </div>
              {requiredRunRate !== null ? (
                <div className="bg-[#00142b] border border-white/10 p-2 text-center">
                  <p className="text-xs text-gray-400">RRR</p>
                  <p className={`font-bold text-sm ${requiredRunRate > currentRunRate ? "text-red-400" : "text-green-400"}`}>
                    {requiredRunRate.toFixed(2)}
                  </p>
                </div>
              ) : currentInnings.inningsNumber === 1 && projectedScore > 0 ? (
                <div className="bg-[#00142b] border border-white/10 p-2 text-center">
                  <p className="text-xs text-gray-400">Projected</p>
                  <p className="font-bold text-blue-400 text-sm">{projectedScore}</p>
                </div>
              ) : null}
              <div className="bg-[#00142b] border border-white/10 p-2 text-center">
                <p className="text-xs text-gray-400">Partnership</p>
                <p className="font-bold text-purple-400 text-sm">{partnershipRuns} ({partnershipBalls}b)</p>
              </div>
              <div className="bg-[#00142b] border border-white/10 p-2 text-center">
                <p className="text-xs text-gray-400">Extras</p>
                <p className="font-bold text-yellow-400 text-sm">{currentInnings.extras}</p>
              </div>
            </div>

            {/* Extras breakdown */}
            {currentInnings.extras > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                W: {currentInnings.wides} · NB: {currentInnings.noBalls} · B: {currentInnings.byes} · LB: {currentInnings.legByes}
              </p>
            )}
          </div>

          {/* Current batters at crease */}
          {(strikerScore || nonStrikerScore || striker || nonStriker) && (
            <div className={setupCardClass}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Batters in</p>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7f9abd]">`*` on strike</p>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { id: striker, score: strikerScore, isStriker: true },
                  { id: nonStriker, score: nonStrikerScore, isStriker: false },
                ].map(({ id, score, isStriker }) => {
                  const playerName = battingTeamPlayers.find((p) => p.playerId === id)?.player.user.name || "—";
                  return (
                    <div key={`${id || "empty"}-${isStriker ? "striker" : "non-striker"}`} className="border border-white/10 bg-[#00142b] px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-white">
                          {isStriker && id ? "* " : ""}
                          {id ? playerName : "Select batter"}
                        </p>
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7f9abd]">
                          {isStriker ? "Striker" : "Non-striker"}
                        </span>
                      </div>
                      {score ? (
                        <p className="mt-1 text-xs text-[#9bb2d1]">
                          {score.runs} ({score.balls}b) · {score.fours}x4 · {score.sixes}x6
                        </p>
                      ) : id ? (
                        <p className="mt-1 text-xs text-[#7f9abd]">0 (0b)</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current over balls */}
          {currentOverId && (
            <div className="border border-white/10 bg-[#001c3a] p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400 font-medium">
                  Over {Math.floor(currentInnings.totalBalls / 6) + 1} · {ballInOver}/6 balls
                </p>
                {currentBowlerScore && (
                  <p className="text-xs text-gray-400">
                    {battingTeamPlayers.length > 0
                      ? bowlingTeamPlayers.find((p) => p.playerId === currentBowler)?.player.user.name || ""
                      : ""}{" "}
                    {currentBowlerScore.overs.toFixed(1)}-{currentBowlerScore.maidens}-{currentBowlerScore.runs}-{currentBowlerScore.wickets}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {currentOverBalls.length === 0 ? (
                  <span className="text-gray-600 text-xs">No balls bowled yet</span>
                ) : (
                  currentOverBalls.map((ball, i) => <BallDot key={i} ball={ball} />)
                )}
              </div>
            </div>
          )}

          {/* Over setup */}
          <div className={setupCardClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                  {currentOverId ? `Over ${Math.floor(currentInnings.totalBalls / 6) + 1} live setup` : `Start over ${Math.floor(currentInnings.totalBalls / 6) + 1}`}
                </p>
                <p className="mt-1 text-xs text-[#7f9abd]">
                  Batters stay editable until the first ball. Bowler locks after the first ball.
                </p>
              </div>
              {!currentOverId && (
                <button
                  onClick={() => startOver()}
                  disabled={!canStartOver}
                  className="shrink-0 bg-[#4ae183] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#003919] transition hover:bg-[#6bfe9c] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Starting..." : "Start over"}
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#9bb2d1]">
                  Striker
                </label>
                <select
                  value={striker}
                  onChange={(e) => {
                    setStriker(e.target.value);
                    setError(null);
                  }}
                  disabled={!canEditBatters}
                  className={fieldSelectClass}
                >
                  {playerOptions(battingTeamPlayers).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#9bb2d1]">
                  Non-striker
                </label>
                <select
                  value={nonStriker}
                  onChange={(e) => {
                    setNonStriker(e.target.value);
                    setError(null);
                  }}
                  disabled={!canEditBatters}
                  className={fieldSelectClass}
                >
                  {playerOptions(battingTeamPlayers).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#9bb2d1]">
                  Bowler
                </label>
                <select
                  value={currentBowler}
                  onChange={(e) => {
                    void updateCurrentOverBowler(e.target.value);
                  }}
                  disabled={!canEditBowler || submitting}
                  className={fieldSelectClass}
                >
                  {playerOptions(bowlingTeamPlayers).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectionError && (
              <div className="mt-3 border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                {selectionError}
              </div>
            )}
          </div>

          {/* Scoring Buttons */}
          {currentOverId && (
            <div className="border border-white/10 bg-[#001c3a] p-4 space-y-4">
              {/* Undo button */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Score Ball</p>
                <button
                  onClick={undoLastBall}
                  disabled={submitting || (currentInnings.overs.reduce((s, o) => s + o.balls.length, 0) === 0)}
                  className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 disabled:opacity-30 bg-orange-900/20 px-3 py-1.5 border border-orange-700/50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Undo Last Ball
                </button>
              </div>

              {/* Runs */}
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">RUNS</p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                    <button
                      key={r}
                      onClick={() => addBall(r)}
                      disabled={submitting || !!extraMode}
                      className={`h-12 sm:h-14 font-bold text-lg sm:text-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        r === 4 ? "bg-blue-600 hover:bg-blue-500" :
                        r === 6 ? "bg-purple-600 hover:bg-purple-500" :
                        r === 0 ? "bg-gray-700 hover:bg-gray-600" :
                        "bg-green-700 hover:bg-green-600"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extras - Two Step */}
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">EXTRAS</p>
                {!extraMode ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["WIDE", "NO_BALL", "BYE", "LEG_BYE"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setExtraMode(type)}
                        disabled={submitting}
                        className="bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 px-2 py-3 text-xs font-semibold transition-colors min-h-11"
                      >
                        {type.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-900/20 border border-yellow-700/50 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-yellow-300 text-sm font-medium">
                        {extraMode.replace("_", " ")} — Select runs:
                      </p>
                      <button
                        onClick={() => setExtraMode(null)}
                        className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {EXTRA_OPTIONS[extraMode]?.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => addBall(opt.runs, { type: extraMode, runs: opt.extraRuns })}
                          disabled={submitting}
                          className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 py-3 text-xs font-bold transition-colors min-h-11"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Wicket */}
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">WICKET</p>
                {!showWicketModal ? (
                  <button
                    onClick={() => { setShowWicketModal(true); setSelectedWicketType(""); setFielder(""); setDismissedBatter("STRIKER"); }}
                    disabled={submitting || !!extraMode}
                    className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 px-4 py-4 font-bold text-xl transition-colors"
                  >
                    W I C K E T
                  </button>
                ) : (
                  <div className="bg-red-900/20 border border-red-700/50 p-4 space-y-4">
                    <p className="text-red-300 font-semibold text-sm">Select Dismissal Type:</p>

                    {/* Wicket type grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {WICKET_TYPES.map((wt) => (
                        <button
                          key={wt}
                          onClick={() => { setSelectedWicketType(wt); setFielder(""); setDismissedBatter("STRIKER"); }}
                          className={`px-2 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                            selectedWicketType === wt
                              ? "bg-red-600 ring-2 ring-red-400"
                              : "bg-gray-700 hover:bg-red-800"
                          }`}
                        >
                          {wt.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>

                    {/* Fielder selection */}
                    {selectedWicketType && FIELDER_REQUIRED.includes(selectedWicketType) && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">
                          Fielder ({selectedWicketType === "STUMPED" ? "Wicketkeeper" : "Select fielder"}):
                        </label>
                        <select
                          value={fielder}
                          onChange={(e) => setFielder(e.target.value)}
                          className={fieldSelectClass}
                        >
                          <option value="">Select fielder...</option>
                          {bowlingTeamPlayers.map((p) => (
                            <option key={p.playerId} value={p.playerId}>
                              {p.player.user.name}
                              {p.player.isWicketkeeper ? " (WK)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedWicketType === "RUN_OUT" && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">
                          Which batter is out?
                        </label>
                        <select
                          value={dismissedBatter}
                          onChange={(e) => setDismissedBatter(e.target.value as "STRIKER" | "NON_STRIKER")}
                          className={fieldSelectClass}
                        >
                          <option value="STRIKER">
                            Striker{striker ? ` - ${battingTeamPlayers.find((p) => p.playerId === striker)?.player.user.name || ""}` : ""}
                          </option>
                          <option value="NON_STRIKER">
                            Non-striker{nonStriker ? ` - ${battingTeamPlayers.find((p) => p.playerId === nonStriker)?.player.user.name || ""}` : ""}
                          </option>
                        </select>
                      </div>
                    )}

                    {/* Runs on same ball (e.g., no-ball + wicket) */}

                    {/* Confirm & Cancel */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (selectedWicketType) {
                            addBall(0, undefined, true, selectedWicketType, fielder || undefined, dismissedBatter);
                          }
                        }}
                        disabled={!selectedWicketType || submitting}
                        className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 font-bold transition-colors"
                      >
                        Confirm Out — {selectedWicketType ? selectedWicketType.replace(/_/g, " ") : "Select type"}
                      </button>
                      <button
                        onClick={() => { setShowWicketModal(false); setSelectedWicketType(""); setFielder(""); setDismissedBatter("STRIKER"); }}
                        className="px-4 py-3 bg-[#12324d] hover:bg-[#1b3656] text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Scorecard Toggle */}
          <div className="border border-white/10 bg-[#001c3a] overflow-hidden">
            <button
              onClick={() => setShowScorecard((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-300">Live Batting Scorecard</span>
              <span className="text-gray-400 text-sm">{showScorecard ? "▲" : "▼"}</span>
            </button>

            {showScorecard && (
              <div className="border-t border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#00142b] text-[#9bb2d1]">
                        <th className="text-left px-3 py-2">Batter</th>
                        <th className="px-2 py-2 text-center">R</th>
                        <th className="px-2 py-2 text-center">B</th>
                        <th className="px-2 py-2 text-center">4s</th>
                        <th className="px-2 py-2 text-center">6s</th>
                        <th className="px-2 py-2 text-center">SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInnings.battingScores.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-3 text-gray-500">No batting data</td>
                        </tr>
                      ) : (
                        currentInnings.battingScores.map((bat) => (
                          <tr key={bat.id} className={`border-t border-gray-700/50 ${
                            bat.playerId === striker || bat.playerId === nonStriker
                              ? "bg-green-900/20" : ""
                          }`}>
                            <td className="px-3 py-2">
                              <span className={`font-medium ${bat.isOut ? "text-gray-400" : "text-white"}`}>
                                {bat.player.user.name}
                                {bat.playerId === striker && " *"}
                              </span>
                              {bat.isOut ? (
                                <span className="text-gray-500 ml-1 text-xs">(out)</span>
                              ) : (
                                <span className="text-green-400 ml-1 text-xs">batting</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center font-bold text-white">{bat.runs}</td>
                            <td className="px-2 py-2 text-center text-gray-400">{bat.balls}</td>
                            <td className="px-2 py-2 text-center text-gray-400">{bat.fours}</td>
                            <td className="px-2 py-2 text-center text-gray-400">{bat.sixes}</td>
                            <td className="px-2 py-2 text-center text-gray-400">
                              {bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(0) : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bowling scorecard */}
                <div className="border-t border-white/10">
                  <p className="text-xs text-gray-400 px-3 py-2 font-medium uppercase tracking-wide">Bowling</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#00142b] text-[#9bb2d1]">
                        <th className="text-left px-3 py-2">Bowler</th>
                        <th className="px-2 py-2 text-center">O</th>
                        <th className="px-2 py-2 text-center">M</th>
                        <th className="px-2 py-2 text-center">R</th>
                        <th className="px-2 py-2 text-center">W</th>
                        <th className="px-2 py-2 text-center">Eco</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInnings.bowlingScores.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-3 text-gray-500">No bowling data</td>
                        </tr>
                      ) : (
                        currentInnings.bowlingScores.map((bowl) => (
                          <tr key={bowl.id} className={`border-t border-gray-700/50 ${
                            bowl.playerId === currentBowler ? "bg-blue-900/20" : ""
                          }`}>
                            <td className="px-3 py-2 font-medium text-white">
                              {bowl.player.user.name}
                              {bowl.playerId === currentBowler && (
                                <span className="text-blue-400 text-xs ml-1">*</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-400">{bowl.overs.toFixed(1)}</td>
                            <td className="px-2 py-2 text-center text-gray-400">{bowl.maidens}</td>
                            <td className="px-2 py-2 text-center text-gray-400">{bowl.runs}</td>
                            <td className="px-2 py-2 text-center font-bold text-white">{bowl.wickets}</td>
                            <td className="px-2 py-2 text-center text-gray-400">
                              {bowl.overs > 0 ? (bowl.runs / bowl.overs).toFixed(1) : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Fall of wickets */}
                {dismissedBatters.length > 0 && (
                  <div className="border-t border-gray-700 px-3 py-2">
                    <p className="text-xs text-gray-400 font-medium mb-1">Fall of Wickets</p>
                    <div className="flex flex-wrap gap-2">
                      {dismissedBatters.map((b, i) => (
                        <span key={b.id} className="text-xs bg-red-900/30 border border-red-800/50 rounded px-2 py-0.5 text-red-300">
                          {i + 1}. {b.player.user.name} ({b.wicketType?.replace(/_/g, " ")})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Manhattan Chart */}
          {overData.length > 0 && (
            <div className="border border-white/10 bg-[#001c3a] p-4">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Runs Per Over</p>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={overData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                  <XAxis dataKey="over" tick={{ fill: "#9ca3af", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, fontSize: 11 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [`${v}`, ""] as any}
                  />
                  <Bar dataKey="runs" fill="#16a34a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Over Summary */}
          {overData.length > 0 && (
            <div className="border border-white/10 bg-[#001c3a] p-4">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Over Summary</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-700">
                      <th className="text-left py-1.5">Over</th>
                      <th className="text-center py-1.5">Runs</th>
                      <th className="text-center py-1.5">Wkts</th>
                      <th className="text-left py-1.5 pl-2">Balls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...currentInnings.overs].reverse().map((over) => (
                      <tr key={over.id} className="border-b border-gray-700/50">
                        <td className="py-1.5 text-gray-300">O{over.overNumber}</td>
                        <td className="text-center py-1.5 font-medium text-white">{over.runs}</td>
                        <td className="text-center py-1.5">
                          {over.wickets > 0
                            ? <span className="text-red-400 font-medium">{over.wickets}W</span>
                            : <span className="text-gray-500">-</span>}
                        </td>
                        <td className="py-1.5 pl-2">
                          <div className="flex gap-1">
                            {over.balls.map((ball, i) => <BallDot key={i} ball={ball} />)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Manual Match Control */}
          <div className="border border-white/10 bg-[#001c3a] p-4">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Match Control</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const outcome = getManualOutcome(match.homeTeam.id);
                  completeMatch(match.homeTeam.id, outcome.winMargin, outcome.winType);
                }}
                className="bg-green-800 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {match.homeTeam.shortName} Won
              </button>
              <button
                onClick={() => {
                  const outcome = getManualOutcome(match.awayTeam.id);
                  completeMatch(match.awayTeam.id, outcome.winMargin, outcome.winType);
                }}
                className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {match.awayTeam.shortName} Won
              </button>
              <button
                onClick={async () => {
                  await fetch(`/api/matches/${match.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "INNINGS_BREAK" }),
                  });
                  setPhase("start_innings");
                  fetchMatch();
                }}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Innings Break
              </button>
              <button
                onClick={async () => {
                  await fetch("/api/scoring/complete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ matchId, result: "Match Tied", winnerTeamId: null, winMargin: 0, winType: "tie" }),
                  });
                  fetchMatch();
                }}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Tie / No Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
