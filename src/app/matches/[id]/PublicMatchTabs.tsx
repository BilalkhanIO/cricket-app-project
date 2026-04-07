"use client";

import { useMemo, useState } from "react";
import LiveCommentary from "./LiveCommentary";

type MatchData = {
  id: string;
  innings: any[];
  officials: any[];
  scorer: { name: string } | null;
  awards: any[];
  playingXIs: any[];
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  league: { name: string; season: string };
  matchFormat: string;
  overs: number;
  result: string | null;
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function formatDismissal(bat: any): string {
  if (!bat.isOut) return "not out";
  const type = (bat.wicketType || "OUT").toUpperCase();
  const bowlerName = bat.bowler?.user?.name;
  const fielderName = bat.fielder?.user?.name;
  if (type === "CAUGHT" || type === "CAUGHT_OUT") {
    if (fielderName && bowlerName) return `c ${fielderName} b ${bowlerName}`;
    if (bowlerName) return `c & b ${bowlerName}`;
    return "caught";
  }
  if (type === "BOWLED") return bowlerName ? `b ${bowlerName}` : "bowled";
  if (type === "LBW") return bowlerName ? `lbw b ${bowlerName}` : "lbw";
  if (type === "RUN_OUT" || type === "RUN OUT") return fielderName ? `run out (${fielderName})` : "run out";
  if (type === "STUMPED") return fielderName && bowlerName ? `st ${fielderName} b ${bowlerName}` : "stumped";
  if (type === "HIT_WICKET" || type === "HIT WICKET") return bowlerName ? `hit wicket b ${bowlerName}` : "hit wicket";
  return formatLabel(type).toLowerCase();
}

export default function PublicMatchTabs({ match }: { match: MatchData }) {
  const [activeTab, setActiveTab] = useState<"scorecards" | "commentary" | "overs" | "info">("scorecards");
  const [selectedInningsId, setSelectedInningsId] = useState(match.innings[0]?.id || "");

  const selectedInnings = useMemo(
    () => match.innings.find((innings) => innings.id === selectedInningsId) || match.innings[0] || null,
    [match.innings, selectedInningsId]
  );

  const tabButtonClass = (tab: typeof activeTab) =>
    `px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${
      activeTab === tab ? "bg-[#4ae183] text-[#003919]" : "bg-[#001c3a] text-[#d4e3ff] hover:bg-[#12324d]"
    }`;

  return (
    <section className="mt-14 space-y-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveTab("scorecards")} className={tabButtonClass("scorecards")}>
          Scorecards
        </button>
        <button type="button" onClick={() => setActiveTab("commentary")} className={tabButtonClass("commentary")}>
          Commentary
        </button>
        <button type="button" onClick={() => setActiveTab("overs")} className={tabButtonClass("overs")}>
          Overs
        </button>
        <button type="button" onClick={() => setActiveTab("info")} className={tabButtonClass("info")}>
          Playing XI & Officials
        </button>
      </div>

      {activeTab === "scorecards" && selectedInnings && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {match.innings.map((innings) => (
              <button
                key={innings.id}
                type="button"
                onClick={() => setSelectedInningsId(innings.id)}
                className={`px-4 py-3 text-xs font-black uppercase tracking-[0.18em] ${
                  selectedInningsId === innings.id ? "bg-[#c8c8b0] text-[#303221]" : "bg-[#12324d] text-[#d4e3ff]"
                }`}
              >
                {innings.team.shortName} innings {innings.inningsNumber}
              </button>
            ))}
          </div>

          <div className="border border-white/10 bg-[#001c3a] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7f9abd]">
                  Innings {selectedInnings.inningsNumber}
                </p>
                <p className="mt-2 font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
                  {selectedInnings.team.name}
                </p>
              </div>
              <p className="font-[var(--font-display)] text-4xl font-black text-white">
                {selectedInnings.totalRuns}/{selectedInnings.totalWickets}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border border-white/10 bg-[#001c3a]">
              <div className="border-b border-white/10 px-5 py-4">
                <h3 className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">Batting</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-white/10 bg-[#00142b] text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                    <tr>
                      <th className="px-4 py-3 text-left">Batter</th>
                      <th className="px-3 py-3 text-center">R</th>
                      <th className="px-3 py-3 text-center">B</th>
                      <th className="px-3 py-3 text-center">4s</th>
                      <th className="px-3 py-3 text-center">6s</th>
                      <th className="px-3 py-3 text-center">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInnings.battingScores.map((bat: any) => (
                      <tr key={bat.id} className="border-b border-white/10 last:border-b-0">
                        <td className="px-4 py-3">
                          <p className="font-bold uppercase tracking-[0.06em] text-white">{bat.player.user.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                            {formatDismissal(bat)}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-center font-black text-white">{bat.runs}</td>
                        <td className="px-3 py-3 text-center text-[#d4e3ff]">{bat.balls}</td>
                        <td className="px-3 py-3 text-center text-[#d4e3ff]">{bat.fours}</td>
                        <td className="px-3 py-3 text-center text-[#d4e3ff]">{bat.sixes}</td>
                        <td className="px-3 py-3 text-center text-[#d4e3ff]">
                          {bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(selectedInnings.extras > 0 || selectedInnings.wides > 0 || selectedInnings.noBalls > 0 || selectedInnings.byes > 0 || selectedInnings.legByes > 0) && (
                <div className="border-t border-white/10 px-5 py-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Extras</span>
                    <span className="text-sm font-black text-white">{selectedInnings.extras}</span>
                    {selectedInnings.wides > 0 && <span className="text-xs text-[#9bb2d1]">Wd {selectedInnings.wides}</span>}
                    {selectedInnings.noBalls > 0 && <span className="text-xs text-[#9bb2d1]">Nb {selectedInnings.noBalls}</span>}
                    {selectedInnings.byes > 0 && <span className="text-xs text-[#9bb2d1]">B {selectedInnings.byes}</span>}
                    {selectedInnings.legByes > 0 && <span className="text-xs text-[#9bb2d1]">Lb {selectedInnings.legByes}</span>}
                  </div>
                </div>
              )}
            </div>

            <div className="border border-white/10 bg-[#001c3a]">
              <div className="border-b border-white/10 px-5 py-4">
                <h3 className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">Bowling</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-white/10 bg-[#00142b] text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                    <tr>
                      <th className="px-4 py-3 text-left">Bowler</th>
                      <th className="px-3 py-3 text-center">O</th>
                      <th className="px-3 py-3 text-center">M</th>
                      <th className="px-3 py-3 text-center">R</th>
                      <th className="px-3 py-3 text-center">W</th>
                      <th className="px-3 py-3 text-center">Eco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInnings.bowlingScores.map((bowl: any) => (
                      <tr key={bowl.id} className="border-b border-white/10 last:border-b-0">
                        <td className="px-4 py-3 font-bold uppercase tracking-[0.06em] text-white">{bowl.player.user.name}</td>
                        <td className="px-3 py-3 text-center text-[#d4e3ff]">{bowl.overs.toFixed(1)}</td>
                        <td className="px-3 py-3 text-center text-[#d4e3ff]">{bowl.maidens ?? 0}</td>
                        <td className="px-3 py-3 text-center text-[#d4e3ff]">{bowl.runs}</td>
                        <td className="px-3 py-3 text-center font-black text-white">{bowl.wickets}</td>
                        <td className="px-3 py-3 text-center text-[#d4e3ff]">{bowl.economy != null ? bowl.economy.toFixed(2) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Fall of Wickets */}
          {selectedInnings.battingScores.filter((b: any) => b.isOut).length > 0 && (
            <div className="border border-white/10 bg-[#001c3a] p-5">
              <h3 className="mb-4 font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">
                Fall of wickets
              </h3>
              <div className="flex flex-wrap gap-3">
                {selectedInnings.battingScores
                  .filter((b: any) => b.isOut)
                  .map((bat: any, i: number) => (
                    <div key={bat.id} className="border border-white/10 bg-[#00142b] px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">
                        {i + 1}{i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} wicket
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">{bat.player.user.name}</p>
                      <p className="text-[10px] font-black text-[#4ae183]">
                        {bat.runs} ({bat.balls})
                        {bat.runsAtDismissal != null ? ` @ ${bat.runsAtDismissal}` : ""}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "commentary" && <LiveCommentary matchId={match.id} initialInnings={match.innings as any} />}

      {activeTab === "overs" && (
        <div className="space-y-6">
          {match.innings.map((innings) => (
            <div key={`${innings.id}-overs`} className="border border-white/10 bg-[#001c3a]">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">{innings.team.name}</p>
              </div>
              <div className="space-y-0">
                {innings.overs.length > 0 ? (
                  [...innings.overs].reverse().map((over: any) => (
                    <div key={over.id} className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 last:border-b-0">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7f9abd]">Over {over.overNumber}</p>
                        <p className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-white">
                          {over.runs} runs · {over.wickets} wickets
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {over.balls.map((ball: any) => (
                          <span key={ball.id} className="bg-[#12324d] px-3 py-2 text-xs font-bold text-[#d4e3ff]">
                            {over.overNumber}.{ball.ballNumber} · {ball.isWicket ? "W" : ball.isExtra ? ball.extraType?.charAt(0) || "E" : ball.runs}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-6 text-sm text-[#9bb2d1]">No over history recorded yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "info" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              Match
              <span className="block text-[#4ae183]">officials</span>
            </h2>
            <div className="border border-white/10 bg-[#001c3a] p-5">
              <div className="mb-4 border border-white/10 bg-[#0d2030] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7f9abd]">Access</p>
                <p className="mt-2 text-sm leading-6 text-[#d4e3ff]">
                  This public board is read-only. Live updates come from the assigned scorer inside the private scoring console.
                </p>
              </div>
              <div className="space-y-3">
                {match.officials.map((official) => (
                  <div key={official.id} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">{official.role}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold uppercase tracking-[0.08em] text-white">
                        {official.user?.name ?? official.name}
                      </span>
                      {official.user && (
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#4ae183]">✓</span>
                      )}
                    </div>
                  </div>
                ))}
                {match.scorer && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Scorer</span>
                    <span className="text-sm font-bold uppercase tracking-[0.08em] text-white">{match.scorer.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-[var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              Match
              <span className="block text-[#c8c8b0]">details</span>
            </h2>

            <div className="border border-white/10 bg-[#001c3a] p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Format</span>
                  <span className="text-sm font-bold uppercase tracking-[0.08em] text-white">{match.matchFormat}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">League</span>
                  <span className="text-sm font-bold uppercase tracking-[0.08em] text-white">{match.league.name} {match.league.season}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Result</span>
                  <span className="text-sm font-bold uppercase tracking-[0.08em] text-[#4ae183]">{match.result || "In progress"}</span>
                </div>
                {match.scorer && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9bb2d1]">Scorer</span>
                    <span className="text-sm font-bold uppercase tracking-[0.08em] text-white">{match.scorer.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-white/10 bg-[#001c3a] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#c8c8b0]">Playing XIs</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[match.homeTeam, match.awayTeam].map((team) => {
                  const xi = match.playingXIs.filter((entry) => entry.teamId === team.id);
                  return (
                    <div key={team.id}>
                      <p className="font-[var(--font-display)] text-xl font-black uppercase tracking-tight text-white">{team.name}</p>
                      <div className="mt-3 space-y-2">
                        {xi.length > 0 ? (
                          xi.map((entry) => (
                            <p key={entry.id} className="text-sm font-bold uppercase tracking-[0.08em] text-[#d4e3ff]">
                              {entry.battingOrder}. {entry.player.user.name}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-[#9bb2d1]">Playing XI not confirmed.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {match.awards[0]?.player && (
              <div className="border border-white/10 bg-[#001c3a] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#c8c8b0]">Man of the match</p>
                <p className="mt-2 font-[var(--font-display)] text-2xl font-black uppercase tracking-tight text-white">
                  {match.awards[0].player.user.name}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
