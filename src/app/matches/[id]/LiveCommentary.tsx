"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

interface BallEvent {
  id: string;
  overNumber: number;
  ballNumber: number;
  runs: number;
  isWicket: boolean;
  wicketType?: string | null;
  isExtra: boolean;
  extraType?: string | null;
  extraRuns: number;
  isBoundary: boolean;
  isSix: boolean;
  commentary?: string | null;
}

interface Innings {
  id: string;
  inningsNumber: number;
  teamId: string;
  totalRuns: number;
  totalWickets: number;
  overs: { balls: BallEvent[] }[];
}

function generateCommentary(ball: BallEvent): string {
  const overRef = `Ball ${ball.overNumber}.${ball.ballNumber}:`;
  if (ball.isWicket) {
    return `${overRef} WICKET! ${ball.wicketType?.replace("_", " ").toLowerCase() || "out"}`;
  }
  if (ball.isSix) {
    return `${overRef} SIX! Magnificent hit for 6 runs!`;
  }
  if (ball.isBoundary) {
    return `${overRef} FOUR! Ball races to the boundary for 4 runs`;
  }
  if (ball.isExtra) {
    const type = ball.extraType?.replace("_", " ").toLowerCase() || "extra";
    return `${overRef} ${type.toUpperCase()} — ${ball.extraRuns + (ball.extraType === "WIDE" ? 1 : 0)} run(s) added`;
  }
  if (ball.runs === 0) {
    return `${overRef} Dot ball — no run`;
  }
  return `${overRef} ${ball.runs} run${ball.runs !== 1 ? "s" : ""} taken`;
}

export default function LiveCommentary({ matchId, initialInnings }: { matchId: string; initialInnings: Innings[] }) {
  const [innings, setInnings] = useState<Innings[]>(initialInnings);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.match?.innings) {
            setInnings(data.match.innings);
            setLastUpdate(new Date());
          }
        }
      } catch {}
    };

    const interval = setInterval(fetchUpdates, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  // Collect recent ball events
  const recentBalls: (BallEvent & { inningsNum: number })[] = [];
  innings.forEach((inn) => {
    inn.overs.forEach((over) => {
      over.balls.forEach((ball) => {
        recentBalls.push({ ...ball, inningsNum: inn.inningsNumber });
      });
    });
  });

  // Sort by over/ball and take last 12
  recentBalls.sort((a, b) => {
    if (a.overNumber !== b.overNumber) return a.overNumber - b.overNumber;
    return a.ballNumber - b.ballNumber;
  });
  const last12 = recentBalls.slice(-12).reverse();

  if (last12.length === 0) return null;

  return (
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Live Commentary
          </h3>
          <span className="text-xs text-gray-400">
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-gray-50">
          {last12.map((ball, i) => (
            <div
              key={ball.id}
              className={`flex items-start gap-3 px-4 py-2.5 ${i === 0 ? "bg-yellow-50" : ""}`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  ball.isWicket ? "bg-red-500 text-white" :
                  ball.isSix ? "bg-purple-500 text-white" :
                  ball.isBoundary ? "bg-blue-500 text-white" :
                  ball.isExtra ? "bg-yellow-400 text-gray-900" :
                  ball.runs === 0 ? "bg-gray-200 text-gray-600" :
                  "bg-green-500 text-white"
                }`}
              >
                {ball.isWicket ? "W" : ball.isExtra ? (ball.extraType?.charAt(0) || "E") : ball.runs}
              </span>
              <div className="flex-1">
                <p className={`text-sm ${i === 0 ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                  {ball.commentary || generateCommentary(ball)}
                </p>
                <p className="text-xs text-gray-400">Innings {ball.inningsNum} · Over {ball.overNumber}.{ball.ballNumber}</p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
