"use client";

import { useState, useEffect } from "react";

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

function getVisibleCommentary(commentary?: string | null) {
  if (!commentary?.startsWith("__meta__")) return commentary || null;

  try {
    const parsed = JSON.parse(commentary.slice("__meta__".length)) as { text?: string | null };
    return parsed.text || null;
  } catch {
    return null;
  }
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

  const latestBall = last12[0];
  const keyMoments = last12.filter((ball) => ball.isWicket || ball.isBoundary || ball.isSix).slice(0, 4);

  return (
    <section className="overflow-hidden border border-white/10 bg-[#001c3a] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(18,50,77,0.92),rgba(0,28,58,0.96))] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b] animate-pulse" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9bb2d1]">Live updates</p>
            </div>
            <h3 className="mt-2 font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              Match feed
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9bb2d1]">
              Latest event: {getVisibleCommentary(latestBall.commentary) || generateCommentary(latestBall)}
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-[#12324d] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#d4e3ff]">
            Updated {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
        {keyMoments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {keyMoments.map((ball) => (
              <span
                key={ball.id}
                className={`px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${
                  ball.isWicket
                    ? "bg-[#93000a] text-[#ffdad6]"
                    : ball.isSix
                      ? "bg-[#1b3656] text-white"
                      : "bg-[#4ae183] text-[#003919]"
                }`}
              >
                Over {ball.overNumber}.{ball.ballNumber} · {ball.isWicket ? "Wicket" : ball.isSix ? "Six" : "Boundary"}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="divide-y divide-white/10">
          {last12.map((ball, i) => (
            <div key={ball.id} className={`flex items-start gap-4 px-5 py-4 sm:px-6 ${i === 0 ? "bg-[#0b2747]" : "bg-[#001c3a]"}`}>
              <div className="flex min-w-[72px] flex-col items-start">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                  {ball.overNumber}.{ball.ballNumber}
                </span>
                <span
                  className={`mt-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
                    ball.isWicket
                      ? "bg-[#93000a] text-[#ffdad6]"
                      : ball.isSix
                        ? "bg-[#1b3656] text-white"
                        : ball.isBoundary
                          ? "bg-[#4ae183] text-[#003919]"
                          : ball.isExtra
                            ? "bg-[#c8c8b0] text-[#303221]"
                            : ball.runs === 0
                              ? "bg-[#12324d] text-[#d4e3ff]"
                              : "bg-white text-[#00142b]"
                  }`}
                >
                  {ball.isWicket ? "W" : ball.isExtra ? (ball.extraType?.charAt(0) || "E") : ball.runs}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className={`text-sm leading-6 ${i === 0 ? "font-semibold text-white" : "text-[#d4e3ff]"}`}>
                  {getVisibleCommentary(ball.commentary) || generateCommentary(ball)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#12324d] px-2.5 py-1 text-[11px] font-medium text-[#d4e3ff]">
                    Innings {ball.inningsNum}
                  </span>
                  {ball.wicketType && (
                    <span className="rounded-full bg-[#93000a] px-2.5 py-1 text-[11px] font-medium text-[#ffdad6]">
                      {ball.wicketType.replace(/_/g, " ")}
                    </span>
                  )}
                  {ball.isExtra && ball.extraType && (
                    <span className="rounded-full bg-[#c8c8b0] px-2.5 py-1 text-[11px] font-medium text-[#303221]">
                      {ball.extraType.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="border-t border-white/10 bg-[#00142b] px-5 py-5 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9bb2d1]">Stream summary</p>
          <div className="mt-4 space-y-4">
            <div className="border border-white/10 bg-[#001c3a] p-4">
              <p className="text-2xl font-semibold text-white">{last12.length}</p>
              <p className="text-sm text-[#9bb2d1]">Recent updates shown</p>
            </div>
            <div className="border border-white/10 bg-[#001c3a] p-4">
              <p className="text-2xl font-semibold text-white">{keyMoments.length}</p>
              <p className="text-sm text-[#9bb2d1]">Key moments in this window</p>
            </div>
            <div className="border border-white/10 bg-[#001c3a] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9bb2d1]">Latest ball</p>
              <p className="mt-2 text-sm font-medium text-white">
                Over {latestBall.overNumber}.{latestBall.ballNumber}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
