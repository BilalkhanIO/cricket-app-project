"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Player {
  id: string;
  jerseyNumber: number | null;
  role: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isWicketkeeper: boolean;
  user: { name: string };
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  jerseyColor: string;
  players: Player[];
}

interface PlayingXIEntry {
  playerId: string;
  battingOrder: number;
  isSubstitute: boolean;
}

export default function PlayingXIPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = use(params);
  const router = useRouter();

  const [match, setMatch] = useState<any>(null);
  const [homeXI, setHomeXI] = useState<PlayingXIEntry[]>([]);
  const [awayXI, setAwayXI] = useState<PlayingXIEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/matches/${matchId}`)
      .then((r) => r.json())
      .then(({ match }) => {
        if (match) {
          setMatch(match);
          // Pre-populate from existing XI
          const existingHome = match.playingXIs
            .filter((p: any) => p.teamId === match.homeTeamId)
            .map((p: any) => ({ playerId: p.playerId, battingOrder: p.battingOrder || 1, isSubstitute: p.isSubstitute }));
          const existingAway = match.playingXIs
            .filter((p: any) => p.teamId === match.awayTeamId)
            .map((p: any) => ({ playerId: p.playerId, battingOrder: p.battingOrder || 1, isSubstitute: p.isSubstitute }));
          setHomeXI(existingHome);
          setAwayXI(existingAway);
        }
        setLoading(false);
      });
  }, [matchId]);

  const togglePlayer = (
    teamType: "home" | "away",
    playerId: string,
    xi: PlayingXIEntry[],
    setXI: (v: PlayingXIEntry[]) => void
  ) => {
    const exists = xi.find((p) => p.playerId === playerId);
    if (exists) {
      setXI(xi.filter((p) => p.playerId !== playerId));
    } else {
      setXI([...xi, { playerId, battingOrder: xi.length + 1, isSubstitute: false }]);
    }
  };

  const saveXI = async () => {
    setSaving(true);
    try {
      await fetch(`/api/matches/${matchId}/playing-xi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: match.homeTeamId, players: homeXI }),
      });
      await fetch(`/api/matches/${matchId}/playing-xi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: match.awayTeamId, players: awayXI }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!match) return <p className="text-gray-500">Match not found.</p>;

  const renderTeamSelector = (
    team: any,
    xi: PlayingXIEntry[],
    setXI: (v: PlayingXIEntry[]) => void
  ) => {
    const teamPlayers: Player[] = team.players || [];
    const xiLimit = match.league?.playingXISize || 11;

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div
          className="px-5 py-4 text-white font-bold flex items-center justify-between"
          style={{ backgroundColor: team.jerseyColor || "#1B3A5C" }}
        >
          <span>{team.name}</span>
          <span className="text-sm font-normal opacity-80">
            {xi.length}/{xiiLimit} selected
          </span>
        </div>

        {teamPlayers.length === 0 ? (
          <div className="px-5 py-6 text-sm text-gray-400 text-center">
            No players in squad.{" "}
            <Link href="/admin/players" className="text-blue-500 underline">Add players</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {teamPlayers.map((player) => {
              const isSelected = xi.some((p) => p.playerId === player.id);
              return (
                <label
                  key={player.id}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                    isSelected ? "bg-green-50" : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePlayer(team.id === match.homeTeamId ? "home" : "away", player.id, xi, setXI)}
                    className="w-4 h-4 accent-green-600"
                    disabled={!isSelected && xi.length >= xiiLimit}
                  />
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {player.jerseyNumber || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-900 text-sm">{player.user.name}</span>
                      {player.isCaptain && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded">C</span>}
                      {player.isViceCaptain && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 rounded">VC</span>}
                      {player.isWicketkeeper && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 rounded">WK</span>}
                    </div>
                    <p className="text-xs text-gray-400">{player.role.replace(/_/g, " ")}</p>
                  </div>
                  {isSelected && (
                    <span className="text-xs font-bold text-green-600">
                      #{xi.findIndex((p) => p.playerId === player.id) + 1}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Fetch team players (need to include team.players in match API or fetch separately)
  // We use match.playingXIs and cross-reference from a teams API
  // Actually we need to get team players - let's fetch them
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);

  return <PlayingXIClient matchId={matchId} match={match} initialHomeXI={homeXI} initialAwayXI={awayXI} />;
}

// Separated client logic for team player loading
function PlayingXIClient({
  matchId,
  match,
  initialHomeXI,
  initialAwayXI,
}: {
  matchId: string;
  match: any;
  initialHomeXI: PlayingXIEntry[];
  initialAwayXI: PlayingXIEntry[];
}) {
  const [homeXI, setHomeXI] = useState<PlayingXIEntry[]>(initialHomeXI);
  const [awayXI, setAwayXI] = useState<PlayingXIEntry[]>(initialAwayXI);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      const [homeRes, awayRes] = await Promise.all([
        fetch(`/api/teams/${match.homeTeamId}`),
        fetch(`/api/teams/${match.awayTeamId}`),
      ]);
      const homeData = await homeRes.json();
      const awayData = await awayRes.json();
      setHomePlayers(homeData.team?.players || []);
      setAwayPlayers(awayData.team?.players || []);
      setLoadingPlayers(false);
    };
    fetchPlayers();
  }, [match.homeTeamId, match.awayTeamId]);

  const xiiLimit = match.league?.playingXISize || 11;

  const togglePlayer = (
    playerId: string,
    xi: PlayingXIEntry[],
    setXI: (v: PlayingXIEntry[]) => void
  ) => {
    const exists = xi.find((p) => p.playerId === playerId);
    if (exists) {
      setXI(xi.filter((p) => p.playerId !== playerId));
    } else {
      setXI([...xi, { playerId, battingOrder: xi.length + 1, isSubstitute: false }]);
    }
  };

  const saveXI = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch(`/api/matches/${matchId}/playing-xi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId: match.homeTeamId, players: homeXI }),
        }),
        fetch(`/api/matches/${matchId}/playing-xi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId: match.awayTeamId, players: awayXI }),
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const renderTeam = (
    teamId: string,
    team: { id: string; name: string; shortName: string; jerseyColor: string },
    players: Player[],
    xi: PlayingXIEntry[],
    setXI: (v: PlayingXIEntry[]) => void
  ) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        className="px-5 py-4 text-white font-bold flex items-center justify-between"
        style={{ backgroundColor: team.jerseyColor || "#1B3A5C" }}
      >
        <span>{team.name}</span>
        <span className={`text-sm font-normal opacity-90 ${xi.length === xiiLimit ? "text-green-200 font-bold" : ""}`}>
          {xi.length}/{xiiLimit} selected
        </span>
      </div>

      {loadingPlayers ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading squad...</div>
      ) : players.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-400">
          No players in squad.
        </div>
      ) : (
        <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
          {players.map((player) => {
            const isSelected = xi.some((p) => p.playerId === player.id);
            const order = xi.findIndex((p) => p.playerId === player.id) + 1;
            return (
              <label
                key={player.id}
                className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                  isSelected ? "bg-green-50 border-l-4 border-green-500" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePlayer(player.id, xi, setXI)}
                  className="w-4 h-4 accent-green-600"
                  disabled={!isSelected && xi.length >= xiiLimit}
                />
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: isSelected ? (team.jerseyColor || "#16a34a") + "33" : "#f3f4f6",
                    color: isSelected ? (team.jerseyColor || "#16a34a") : "#6b7280",
                  }}
                >
                  {player.jerseyNumber || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">{player.user.name}</span>
                    {player.isCaptain && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-semibold">C</span>}
                    {player.isViceCaptain && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">VC</span>}
                    {player.isWicketkeeper && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">WK</span>}
                  </div>
                  <p className="text-xs text-gray-400">{player.role.replace(/_/g, " ")}</p>
                </div>
                {isSelected && (
                  <span className="text-sm font-bold text-green-600 w-6 text-center">#{order}</span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/matches" className="text-sm text-gray-500 hover:text-gray-700">← Matches</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Playing XI — {match.homeTeam.shortName} vs {match.awayTeam.shortName}
          </h1>
          <p className="text-sm text-gray-500">Select {xiiLimit} players per team</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              ✓ Saved!
            </span>
          )}
          <button
            onClick={saveXI}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            {saving ? "Saving..." : "Save Playing XIs"}
          </button>
        </div>
      </div>

      {/* Validation warnings */}
      <div className="flex gap-3 text-sm">
        {homeXI.length !== xiiLimit && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg">
            {match.homeTeam.name}: {homeXI.length}/{xiiLimit} selected
          </div>
        )}
        {awayXI.length !== xiiLimit && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg">
            {match.awayTeam.name}: {awayXI.length}/{xiiLimit} selected
          </div>
        )}
        {homeXI.length === xiiLimit && awayXI.length === xiiLimit && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg font-medium">
            ✓ Both Playing XIs complete. Ready to start!
          </div>
        )}
      </div>

      {/* Team selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTeam(match.homeTeamId, match.homeTeam, homePlayers, homeXI, setHomeXI)}
        {renderTeam(match.awayTeamId, match.awayTeam, awayPlayers, awayXI, setAwayXI)}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={saveXI}
          disabled={saving || (homeXI.length !== xiiLimit || awayXI.length !== xiiLimit)}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {saving ? "Saving..." : `Save & Confirm Playing XIs`}
        </button>
        <Link
          href={`/scorer/${matchId}`}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          🎯 Go to Scoring Panel
        </Link>
        <Link
          href={`/matches/${matchId}`}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          View Match
        </Link>
      </div>
    </div>
  );
}
