"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface Player {
  id: string;
  user: { name: string };
  isCaptain: boolean;
  isWicketkeeper: boolean;
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
  isCompleted: boolean;
  overs: any[];
  battingScores: any[];
  bowlingScores: any[];
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

export default function ScorerPage({ params }: { params: { matchId: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentInnings, setCurrentInnings] = useState<Innings | null>(null);
  const [currentOverId, setCurrentOverId] = useState<string | null>(null);
  const [ballInOver, setBallInOver] = useState(0);
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [currentBowler, setCurrentBowler] = useState("");
  const [wicketType, setWicketType] = useState("");
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [recentBalls, setRecentBalls] = useState<any[]>([]);
  const [phase, setPhase] = useState<"toss" | "playing_xi" | "start_innings" | "scoring">("toss");

  const fetchMatch = useCallback(async () => {
    const res = await fetch(`/api/matches/${params.matchId}`);
    const data = await res.json();
    if (data.match) {
      setMatch(data.match);
      determinePhase(data.match);
    }
    setLoading(false);
  }, [params.matchId]);

  const determinePhase = (m: Match) => {
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
    const res = await fetch(`/api/matches/${params.matchId}/toss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tossWinnerId: winnerId, tossDecision: decision }),
    });
    if (res.ok) fetchMatch();
  };

  const startInnings = async () => {
    if (!match) return;
    const battingTeamId = match.innings.length === 0
      ? (match.tossDecision === "bat" ? match.tossWinnerId! :
         match.tossWinnerId === match.homeTeam.id ? match.awayTeam.id : match.homeTeam.id)
      : (match.innings[0].teamId === match.homeTeam.id ? match.awayTeam.id : match.homeTeam.id);

    const target = match.innings.length === 1 ? match.innings[0].totalRuns + 1 : null;

    const res = await fetch(`/api/matches/${params.matchId}/innings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId: battingTeamId,
        inningsNumber: match.innings.length + 1,
        targetRuns: target,
      }),
    });
    if (res.ok) fetchMatch();
  };

  const startOver = async () => {
    if (!currentInnings || !currentBowler) return;
    const overNum = Math.floor(currentInnings.totalBalls / 6) + 1;

    const res = await fetch("/api/scoring/over", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inningsId: currentInnings.id,
        overNumber: overNum,
        bowlerId: currentBowler,
      }),
    });
    const data = await res.json();
    if (data.over) {
      setCurrentOverId(data.over.id);
      setBallInOver(0);
      setRecentBalls([]);
    }
  };

  const addBall = async (runs: number, extras?: { type: string; runs?: number }, isWicket?: boolean) => {
    if (!currentInnings || !currentOverId) return;
    setSubmitting(true);

    const body: any = {
      inningsId: currentInnings.id,
      overId: currentOverId,
      ballNumber: ballInOver + 1,
      overNumber: Math.floor(currentInnings.totalBalls / 6) + 1,
      batsmanId: striker,
      bowlerId: currentBowler,
      runs,
      isWicket: isWicket || false,
      wicketType: isWicket ? wicketType : null,
      isExtra: !!extras,
      extraType: extras?.type || null,
      extraRuns: extras?.runs || 0,
      isBoundary: runs === 4 && !extras,
      isSix: runs === 6 && !extras,
    };

    const res = await fetch("/api/scoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.ball) {
      const newBall = { ...body, id: data.ball.id };
      setRecentBalls((prev) => [...prev, newBall]);

      const isLegalBall = !extras || ["BYE", "LEG_BYE"].includes(extras.type || "");
      if (isLegalBall) {
        const newBallInOver = ballInOver + 1;
        if (newBallInOver >= 6) {
          setBallInOver(0);
          setCurrentOverId(null);
          setRecentBalls([]);
          // Rotate striker/non-striker
          const temp = striker;
          setStriker(nonStriker);
          setNonStriker(temp);
        } else {
          setBallInOver(newBallInOver);
        }
      }

      if (isWicket) {
        setShowWicketModal(false);
        setStriker("");
      }

      if (runs % 2 === 1) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
      }

      await fetchMatch();
    }

    setSubmitting(false);
  };

  const completeMatch = async (winnerId: string, winMargin: number, winType: string) => {
    const loser = winnerId === match?.homeTeam.id ? match?.awayTeam.id : match?.homeTeam.id;
    const result = `${winnerId === match?.homeTeam.id ? match?.homeTeam.name : match?.awayTeam.name} won by ${winMargin} ${winType}`;

    await fetch("/api/scoring/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: params.matchId, result, winnerTeamId: winnerId, winMargin, winType }),
    });
    fetchMatch();
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Link href={`/matches/${match.id}`} className="text-gray-400 hover:text-white">← Back</Link>
          <span className="text-white font-semibold">
            {match.homeTeam.shortName} vs {match.awayTeam.shortName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded font-medium ${
            match.status === "LIVE" ? "bg-red-500 animate-pulse" :
            match.status === "COMPLETED" ? "bg-green-500" : "bg-gray-600"
          }`}>
            {match.status}
          </span>
        </div>
      </div>

      {/* Match Completed */}
      {match.status === "COMPLETED" && (
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold mb-3">Match Completed</h2>
          <Link href={`/matches/${match.id}`} className="text-green-400 hover:underline">View Scorecard →</Link>
        </div>
      )}

      {/* Toss Phase */}
      {phase === "toss" && match.status !== "COMPLETED" && (
        <div className="max-w-lg mx-auto px-4 py-10">
          <h2 className="text-xl font-bold mb-6 text-center">Record Toss</h2>
          <div className="space-y-4">
            {[match.homeTeam, match.awayTeam].map((team) => (
              <div key={team.id} className="bg-gray-800 rounded-xl p-4">
                <h3 className="font-semibold mb-3 text-center"
                  style={{ color: team.jerseyColor || "#4ade80" }}>
                  {team.name} wins toss
                </h3>
                <div className="flex gap-3">
                  <Button fullWidth onClick={() => recordToss(team.id, "bat")} variant="primary">
                    Choose to Bat
                  </Button>
                  <Button fullWidth onClick={() => recordToss(team.id, "field")} variant="secondary">
                    Choose to Field
                  </Button>
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
                {match.tossWinnerId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name} won toss and chose to {match.tossDecision}
              </p>
            )}
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-300 mb-4">Set Playing XIs from Admin Panel, then start the innings.</p>
            <Button onClick={startInnings} size="lg">
              🎯 Start 1st Innings
            </Button>
          </div>
        </div>
      )}

      {/* Start Innings */}
      {phase === "start_innings" && match.status !== "COMPLETED" && (
        <div className="max-w-lg mx-auto px-4 py-10 text-center">
          {match.innings.length === 1 && (
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <p className="text-lg font-semibold mb-2">
                {match.innings[0].totalRuns}/{match.innings[0].totalWickets}
              </p>
              <p className="text-gray-400">Target: {match.innings[0].totalRuns + 1} runs</p>
            </div>
          )}
          <Button onClick={startInnings} size="lg">
            🏏 Start {match.innings.length + 1}{match.innings.length === 0 ? "st" : "nd"} Innings
          </Button>
        </div>
      )}

      {/* Scoring Phase */}
      {phase === "scoring" && currentInnings && match.status !== "COMPLETED" && (
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
          {/* Score Display */}
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-gray-400">
                  {currentInnings.inningsNumber === 1 ? "1st" : "2nd"} Innings —{" "}
                  {currentInnings.teamId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name}
                </p>
                <p className="text-4xl font-bold text-green-400">
                  {currentInnings.totalRuns}/{currentInnings.totalWickets}
                  <span className="text-xl text-gray-400 ml-2">({currentInnings.totalOvers.toFixed(1)})</span>
                </p>
              </div>
              {currentInnings.inningsNumber === 2 && match.innings[0] && (
                <div className="text-right">
                  <p className="text-sm text-gray-400">Target</p>
                  <p className="text-2xl font-bold text-yellow-400">{match.innings[0].totalRuns + 1}</p>
                  <p className="text-xs text-gray-400">
                    Need {match.innings[0].totalRuns + 1 - currentInnings.totalRuns} from{" "}
                    {(match.overs * 6 - currentInnings.totalBalls)} balls
                  </p>
                </div>
              )}
            </div>

            {/* Recent Balls */}
            <div className="flex gap-1.5 flex-wrap mt-3">
              {recentBalls.map((ball, i) => (
                <span
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    ball.isWicket ? "bg-red-600" :
                    ball.isSix ? "bg-purple-600" :
                    ball.isBoundary ? "bg-blue-600" :
                    ball.isExtra ? "bg-yellow-500 text-gray-900" :
                    ball.runs === 0 ? "bg-gray-600" : "bg-green-600"
                  }`}
                >
                  {ball.isWicket ? "W" : ball.isExtra ? (ball.extraType?.charAt(0) || "E") : ball.runs}
                </span>
              ))}
            </div>
          </div>

          {/* Player Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Striker"
              value={striker}
              onChange={(e) => setStriker(e.target.value)}
              options={playerOptions(battingTeamPlayers)}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Select
              label="Non-Striker"
              value={nonStriker}
              onChange={(e) => setNonStriker(e.target.value)}
              options={playerOptions(battingTeamPlayers)}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Select
              label="Bowler"
              value={currentBowler}
              onChange={(e) => setCurrentBowler(e.target.value)}
              options={playerOptions(bowlingTeamPlayers)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Start Over Button */}
          {!currentOverId && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 text-center">
              <p className="text-yellow-300 mb-3">Select bowler and start new over</p>
              <Button onClick={startOver} variant="primary" disabled={!currentBowler}>
                Start Over {Math.floor(currentInnings.totalBalls / 6) + 1}
              </Button>
            </div>
          )}

          {/* Scoring Buttons */}
          {currentOverId && striker && currentBowler && (
            <div className="bg-gray-800 rounded-xl p-4 space-y-3">
              <p className="text-sm text-gray-400 text-center">
                Over {Math.floor(currentInnings.totalBalls / 6) + 1}.{ballInOver} — {ballInOver}/6 balls
              </p>

              {/* Runs */}
              <div>
                <p className="text-xs text-gray-400 mb-2">RUNS</p>
                <div className="grid grid-cols-7 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                    <button
                      key={r}
                      onClick={() => addBall(r)}
                      disabled={submitting}
                      className={`h-12 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 ${
                        r === 4 ? "bg-blue-600 hover:bg-blue-700" :
                        r === 6 ? "bg-purple-600 hover:bg-purple-700" :
                        r === 0 ? "bg-gray-700 hover:bg-gray-600" :
                        "bg-green-700 hover:bg-green-600"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extras */}
              <div>
                <p className="text-xs text-gray-400 mb-2">EXTRAS</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Wide", type: "WIDE", runs: 1 },
                    { label: "No Ball", type: "NO_BALL", runs: 1 },
                    { label: "Bye", type: "BYE", runs: 0 },
                    { label: "Leg Bye", type: "LEG_BYE", runs: 0 },
                  ].map((extra) => (
                    <button
                      key={extra.type}
                      onClick={() => addBall(0, { type: extra.type, runs: extra.runs })}
                      disabled={submitting}
                      className="bg-yellow-700 hover:bg-yellow-600 px-2 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      {extra.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wicket */}
              <div>
                <p className="text-xs text-gray-400 mb-2">WICKET</p>
                {!showWicketModal ? (
                  <button
                    onClick={() => setShowWicketModal(true)}
                    className="w-full bg-red-700 hover:bg-red-600 px-4 py-3 rounded-xl font-bold text-lg"
                  >
                    🔴 WICKET
                  </button>
                ) : (
                  <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 space-y-3">
                    <p className="text-red-300 font-medium text-sm">Wicket Type</p>
                    <div className="grid grid-cols-3 gap-2">
                      {["BOWLED", "CAUGHT", "LBW", "RUN_OUT", "STUMPED", "HIT_WICKET"].map((wt) => (
                        <button
                          key={wt}
                          onClick={() => { setWicketType(wt); addBall(0, undefined, true); }}
                          className={`px-2 py-2 rounded-lg text-xs font-medium ${
                            wicketType === wt ? "bg-red-600" : "bg-gray-700 hover:bg-red-700"
                          }`}
                        >
                          {wt.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowWicketModal(false)}
                      className="w-full bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Complete Match */}
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-3">Complete Match</p>
            <div className="flex gap-3">
              <Button
                variant="success"
                onClick={() => completeMatch(match.homeTeam.id, 10, "wickets")}
              >
                {match.homeTeam.shortName} Won
              </Button>
              <Button
                variant="primary"
                onClick={() => completeMatch(match.awayTeam.id, 10, "wickets")}
              >
                {match.awayTeam.shortName} Won
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  await fetch(`/api/matches/${match.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "INNINGS_BREAK" }),
                  });
                  setPhase("start_innings");
                  fetchMatch();
                }}
              >
                Innings Break
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
