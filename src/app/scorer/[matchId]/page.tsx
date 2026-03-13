"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export const dynamic = 'force-dynamic';

interface Player {
  id: string;
  user: { name: string };
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
  runs: number;
  wickets: number;
  isCompleted: boolean;
  balls: BallEvent[];
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
  homeTeam: { id: string; name: string; shortName: string; jerseyColor: string };
  awayTeam: { id: string; name: string; shortName: string; jerseyColor: string };
  tossWinnerId: string | null;
  tossDecision: string | null;
  league: { oversPerInnings: number };
  innings: Innings[];
  playingXIs: { playerId: string; teamId: string; battingOrder: number; player: Player }[];
}

const WICKET_TYPES = ["BOWLED", "CAUGHT", "LBW", "RUN_OUT", "STUMPED", "HIT_WICKET", "RETIRED_HURT"];
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
        setBallInOver(lastOver.balls?.length || 0);
        setRecentBalls(lastOver.balls || []);
      } else {
        setCurrentOverId(null);
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

  const startOver = async () => {
    if (!currentInnings || !currentBowler) return;
    const overNum = Math.floor(currentInnings.totalBalls / 6) + 1;

    const res = await fetch("/api/scoring/over", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inningsId: currentInnings.id, overNumber: overNum, bowlerId: currentBowler }),
    });
    const data = await res.json();
    if (data.over) {
      setCurrentOverId(data.over.id);
      setBallInOver(0);
      setRecentBalls([]);
    }
  };

  const addBall = async (
    runs: number,
    extras?: { type: string; runs: number },
    isWicket?: boolean,
    wtParam?: string,
    fielderParam?: string,
  ) => {
    if (!currentInnings || !currentOverId) return;
    if (!striker) { setError("Select striker before recording a ball"); return; }
    if (!currentBowler) { setError("Select bowler before recording a ball"); return; }
    setError(null);
    setSubmitting(true);
    setExtraMode(null);

    const body = {
      inningsId: currentInnings.id,
      overId: currentOverId,
      ballNumber: ballInOver + 1,
      overNumber: Math.floor(currentInnings.totalBalls / 6) + 1,
      batsmanId: striker,
      bowlerId: currentBowler,
      runs,
      isWicket: isWicket || false,
      wicketType: isWicket ? (wtParam || "") : null,
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
      setError(data.error || "Failed to record ball");
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
      if (isLegalBall) {
        setPartnershipBalls((prev) => prev + 1);
        const newBallInOver = ballInOver + 1;
        if (newBallInOver >= 6) {
          setBallInOver(0);
          setCurrentOverId(null);
          setRecentBalls([]);
          // Swap batsmen at end of over
          const temp = striker;
          setStriker(nonStriker);
          setNonStriker(temp);
        } else {
          setBallInOver(newBallInOver);
        }
      }

      setPartnershipRuns((prev) => prev + runs + (extras?.runs || 0));

      if (isWicket) {
        setShowWicketModal(false);
        setSelectedWicketType("");
        setFielder("");
        setStriker("");
        setPartnershipRuns(0);
        setPartnershipBalls(0);
      } else if (isLegalBall && runs % 2 === 1) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
      }

      if (data.matchCompleted && data.result) {
        setMatchResult(data.result);
        setShowMomModal(true);
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
      if (ballInOver > 0) setBallInOver((prev) => prev - 1);
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
    fetchMatch();
  };

  const handleAutoComplete = (result: string) => {
    setMatchResult(result);
    setShowMomModal(true);
  };

  if (!session || !["SUPER_ADMIN", "LEAGUE_ADMIN", "SCORER"].includes(session.user.role)) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-3">Access Denied</h2>
          <p className="text-gray-400">Only scorers can access this panel.</p>
          <Link href="/login" className="text-green-400 mt-4 block">Login as Scorer</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Match not found</p>
      </div>
    );
  }

  const battingTeamPlayers = currentInnings
    ? match.playingXIs.filter((p) => p.teamId === currentInnings.teamId)
    : [];
  const bowlingTeamId = currentInnings
    ? (currentInnings.teamId === match.homeTeam.id ? match.awayTeam.id : match.homeTeam.id)
    : null;
  const bowlingTeamPlayers = bowlingTeamId
    ? match.playingXIs.filter((p) => p.teamId === bowlingTeamId)
    : [];

  const playerOptions = (players: typeof battingTeamPlayers) => [
    { value: "", label: "Select player..." },
    ...players.map((p) => ({ value: p.playerId, label: p.player.user.name })),
  ];

  const firstInnings = match.innings.find((i) => i.inningsNumber === 1);
  const maxBalls = match.overs * 6;

  const currentRunRate = currentInnings && currentInnings.totalBalls > 0
    ? (currentInnings.totalRuns / currentInnings.totalBalls) * 6
    : 0;

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

  // Fall of wickets
  const dismissedBatters = currentInnings?.battingScores.filter((b) => b.isOut) || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href={`/matches/${match.id}`} className="text-gray-400 hover:text-white text-sm">← Back</Link>
          <span className="text-white font-semibold text-sm">
            {match.homeTeam.shortName} vs {match.awayTeam.shortName}
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded font-medium ${
          match.status === "LIVE" ? "bg-red-500 animate-pulse" :
          match.status === "COMPLETED" ? "bg-green-600" : "bg-gray-600"
        }`}>
          {match.status}
        </span>
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
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-yellow-500"
              >
                <option value="">-- Skip / Select later --</option>
                {match.playingXIs.map((p) => (
                  <option key={p.playerId} value={p.playerId}>
                    {p.player.user.name} ({p.teamId === match.homeTeam.id ? match.homeTeam.shortName : match.awayTeam.shortName})
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
          <h2 className="text-xl font-bold mb-6 text-center">Record Toss</h2>
          <div className="space-y-4">
            {[match.homeTeam, match.awayTeam].map((team) => (
              <div key={team.id} className="bg-gray-800 rounded-xl p-5">
                <h3 className="font-semibold mb-3 text-center" style={{ color: team.jerseyColor || "#4ade80" }}>
                  {team.name} wins toss
                </h3>
                <div className="flex gap-3">
                  <button onClick={() => recordToss(team.id, "bat")}
                    className="flex-1 bg-green-700 hover:bg-green-600 px-4 py-3 rounded-lg font-medium transition-colors">
                    Choose to Bat
                  </button>
                  <button onClick={() => recordToss(team.id, "field")}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-medium transition-colors">
                    Choose to Field
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playing XI Phase */}
      {phase === "playing_xi" && match.status !== "COMPLETED" && (
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Toss Recorded ✓</h2>
            {match.tossWinnerId && (
              <p className="text-gray-400">
                {match.tossWinnerId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name}{" "}
                won toss and chose to {match.tossDecision}
              </p>
            )}
          </div>

          {/* Show Playing XIs if set */}
          {match.playingXIs.length > 0 ? (
            <div className="bg-gray-800 rounded-xl p-5 mb-5">
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
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 mb-5 text-center">
              <p className="text-yellow-300 text-sm">Playing XIs not set yet.</p>
              <Link href={`/admin/matches`} className="text-yellow-400 underline text-xs mt-1 block">
                Go to Admin → Matches to set Playing XIs
              </Link>
            </div>
          )}

          <button onClick={startInnings}
            className="w-full bg-green-700 hover:bg-green-600 px-6 py-4 rounded-xl font-bold text-lg transition-colors">
            Start 1st Innings
          </button>
        </div>
      )}

      {/* Start Innings (Innings Break) */}
      {phase === "start_innings" && match.status !== "COMPLETED" && (
        <div className="max-w-lg mx-auto px-4 py-10 text-center">
          {match.innings.length === 1 && (
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
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
            className="bg-green-700 hover:bg-green-600 px-8 py-4 rounded-xl font-bold text-lg transition-colors">
            Start {match.innings.length + 1}{match.innings.length === 0 ? "st" : "nd"} Innings
          </button>
        </div>
      )}

      {/* Scoring Phase */}
      {phase === "scoring" && currentInnings && match.status !== "COMPLETED" && (
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">

          {/* Error banner */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-2 text-red-300 text-sm flex justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">✕</button>
            </div>
          )}

          {/* Score Header */}
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  {currentInnings.inningsNumber === 1 ? "1st" : "2nd"} Innings —{" "}
                  <span className="font-medium">
                    {currentInnings.teamId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name}
                  </span>
                </p>
                <p className="text-4xl font-bold text-green-400 leading-none">
                  {currentInnings.totalRuns}/{currentInnings.totalWickets}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {currentInnings.totalOvers.toFixed(1)} / {match.overs} overs
                </p>
              </div>
              {currentInnings.inningsNumber === 2 && firstInnings && (
                <div className="text-right bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Target</p>
                  <p className="text-2xl font-bold text-yellow-400">{firstInnings.totalRuns + 1}</p>
                  <p className="text-xs text-red-400 font-medium">
                    Need {Math.max(0, runsNeeded)} from {ballsLeft}b
                  </p>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-gray-700 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-400">CRR</p>
                <p className="font-bold text-green-400 text-sm">{currentRunRate.toFixed(2)}</p>
              </div>
              {requiredRunRate !== null ? (
                <div className="bg-gray-700 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400">RRR</p>
                  <p className={`font-bold text-sm ${requiredRunRate > currentRunRate ? "text-red-400" : "text-green-400"}`}>
                    {requiredRunRate.toFixed(2)}
                  </p>
                </div>
              ) : currentInnings.inningsNumber === 1 && projectedScore > 0 ? (
                <div className="bg-gray-700 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400">Projected</p>
                  <p className="font-bold text-blue-400 text-sm">{projectedScore}</p>
                </div>
              ) : null}
              <div className="bg-gray-700 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-400">Partnership</p>
                <p className="font-bold text-purple-400 text-sm">{partnershipRuns} ({partnershipBalls}b)</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-2 text-center">
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
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">At The Crease</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: striker, score: strikerScore, label: "* (Striker)" },
                  { id: nonStriker, score: nonStrikerScore, label: "(Non-striker)" },
                ].map(({ id, score, label }) => {
                  const playerName = battingTeamPlayers.find((p) => p.playerId === id)?.player.user.name || "—";
                  return (
                    <div key={label} className="bg-gray-700/50 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-green-400 text-xs font-medium">{label}</span>
                      </div>
                      <p className="font-semibold text-sm text-white">{id ? playerName : "—"}</p>
                      {score ? (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {score.runs} ({score.balls}b) · {score.fours}×4 · {score.sixes}×6
                          {score.balls > 0 && (
                            <span className="ml-1">· SR: {((score.runs / score.balls) * 100).toFixed(0)}</span>
                          )}
                        </p>
                      ) : id ? (
                        <p className="text-xs text-gray-500">0 (0b)</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current over balls */}
          {currentOverId && (
            <div className="bg-gray-800 rounded-xl p-3">
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

          {/* Player Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Striker *</label>
              <select
                value={striker}
                onChange={(e) => setStriker(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              >
                {playerOptions(battingTeamPlayers).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Non-Striker</label>
              <select
                value={nonStriker}
                onChange={(e) => setNonStriker(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              >
                {playerOptions(battingTeamPlayers).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Bowler *</label>
              <select
                value={currentBowler}
                onChange={(e) => setCurrentBowler(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              >
                {playerOptions(bowlingTeamPlayers).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Over */}
          {!currentOverId && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 text-center">
              <p className="text-yellow-300 text-sm mb-3">
                Select bowler and start Over {Math.floor(currentInnings.totalBalls / 6) + 1}
              </p>
              <button
                onClick={startOver}
                disabled={!currentBowler || submitting}
                className="bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-lg font-semibold transition-colors"
              >
                Start Over {Math.floor(currentInnings.totalBalls / 6) + 1}
              </button>
            </div>
          )}

          {/* Scoring Buttons */}
          {currentOverId && (
            <div className="bg-gray-800 rounded-xl p-4 space-y-4">
              {/* Undo button */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Score Ball</p>
                <button
                  onClick={undoLastBall}
                  disabled={submitting || (currentInnings.overs.reduce((s, o) => s + o.balls.length, 0) === 0)}
                  className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 disabled:opacity-30 bg-orange-900/20 px-3 py-1.5 rounded-lg border border-orange-700/50 transition-colors"
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
                <div className="grid grid-cols-7 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                    <button
                      key={r}
                      onClick={() => addBall(r)}
                      disabled={submitting || !!extraMode}
                      className={`h-14 rounded-xl font-bold text-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
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
                  <div className="grid grid-cols-4 gap-2">
                    {["WIDE", "NO_BALL", "BYE", "LEG_BYE"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setExtraMode(type)}
                        disabled={submitting}
                        className="bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 px-2 py-3 rounded-lg text-xs font-semibold transition-colors"
                      >
                        {type.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-3">
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
                    <div className="grid grid-cols-4 gap-2">
                      {EXTRA_OPTIONS[extraMode]?.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => addBall(opt.runs, { type: extraMode, runs: opt.extraRuns })}
                          disabled={submitting}
                          className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 py-3 rounded-lg text-xs font-bold transition-colors"
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
                    onClick={() => { setShowWicketModal(true); setSelectedWicketType(""); setFielder(""); }}
                    disabled={submitting || !!extraMode}
                    className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 px-4 py-4 rounded-xl font-bold text-xl transition-colors"
                  >
                    W I C K E T
                  </button>
                ) : (
                  <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 space-y-4">
                    <p className="text-red-300 font-semibold text-sm">Select Dismissal Type:</p>

                    {/* Wicket type grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {WICKET_TYPES.map((wt) => (
                        <button
                          key={wt}
                          onClick={() => { setSelectedWicketType(wt); setFielder(""); }}
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
                          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
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

                    {/* Runs on same ball (e.g., no-ball + wicket) */}

                    {/* Confirm & Cancel */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (selectedWicketType) {
                            addBall(0, undefined, true, selectedWicketType, fielder || undefined);
                          }
                        }}
                        disabled={!selectedWicketType || submitting}
                        className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-bold transition-colors"
                      >
                        Confirm Out — {selectedWicketType ? selectedWicketType.replace(/_/g, " ") : "Select type"}
                      </button>
                      <button
                        onClick={() => { setShowWicketModal(false); setSelectedWicketType(""); setFielder(""); }}
                        className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
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
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowScorecard((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-300">Live Batting Scorecard</span>
              <span className="text-gray-400 text-sm">{showScorecard ? "▲" : "▼"}</span>
            </button>

            {showScorecard && (
              <div className="border-t border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-700 text-gray-400">
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
                <div className="border-t border-gray-700">
                  <p className="text-xs text-gray-400 px-3 py-2 font-medium uppercase tracking-wide">Bowling</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-700 text-gray-400">
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
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Runs Per Over</p>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={overData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                  <XAxis dataKey="over" tick={{ fill: "#9ca3af", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: unknown, n: string) => [v, n === "runs" ? "Runs" : "Wickets"]}
                  />
                  <Bar dataKey="runs" fill="#16a34a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Over Summary */}
          {overData.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-4">
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
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Match Control</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => completeMatch(match.homeTeam.id, 10, "wickets")}
                className="bg-green-800 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {match.homeTeam.shortName} Won
              </button>
              <button
                onClick={() => completeMatch(match.awayTeam.id, 10, "wickets")}
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
