"use client";

import { useState } from "react";

interface MomCardProps {
  player: {
    id: string;
    user: { name: string; profileImage?: string | null; city?: string | null };
    role: string;
    jerseyNumber?: number | null;
    battingStats?: { runs: number; balls: number; fours: number; sixes: number } | null;
    bowlingStats?: { overs: number; wickets: number; runs: number } | null;
  };
  matchTitle: string;
  result: string;
  matchId: string;
  leagueName: string;
}

export default function MomCard({ player, matchTitle, result, matchId, leagueName }: MomCardProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const matchUrl = typeof window !== "undefined"
    ? `${window.location.origin}/matches/${matchId}`
    : `/matches/${matchId}`;

  const shareText = `🏏 Man of the Match: ${player.user.name}\n${matchTitle} — ${leagueName}\n${result}\n\nCheck out the scorecard: ${matchUrl}`;

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `MoM: ${player.user.name}`, text: shareText, url: matchUrl });
        setShared(true);
      } catch {
        // user cancelled or not supported
      }
      return;
    }
    // Fallback to copy
    handleCopy();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `🏏 Man of the Match: ${player.user.name}\n${matchTitle} — ${leagueName}\n${result}`
  )}&url=${encodeURIComponent(matchUrl)}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const initials = player.user.name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl overflow-hidden">
      {/* Card visual area (shareable feel) */}
      <div className="bg-gradient-to-br from-[#1B3A5C] to-[#2D5484] p-6 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center gap-5">
          {/* Player photo */}
          {player.user.profileImage ? (
            <img
              src={player.user.profileImage}
              alt={player.user.name}
              className="w-20 h-20 rounded-full border-4 border-yellow-400/50 object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-yellow-400/50 bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-yellow-300 text-xs font-semibold uppercase tracking-widest mb-1">
              🏅 Man of the Match
            </p>
            <h3 className="text-2xl font-bold truncate">{player.user.name}</h3>
            <p className="text-white/70 text-sm mt-0.5">
              {player.role.replace(/_/g, " ")}
              {player.jerseyNumber ? ` · #${player.jerseyNumber}` : ""}
              {player.user.city ? ` · ${player.user.city}` : ""}
            </p>
          </div>
        </div>

        {/* Performance summary */}
        {(player.battingStats || player.bowlingStats) && (
          <div className="relative mt-5 flex gap-4">
            {player.battingStats && player.battingStats.balls > 0 && (
              <div className="flex-1 bg-white/10 rounded-xl px-4 py-3">
                <p className="text-xs text-white/60 mb-2 font-medium uppercase tracking-wide">Batting</p>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-xl font-bold text-yellow-300">{player.battingStats.runs}</p>
                    <p className="text-xs text-white/60">Runs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{player.battingStats.balls}</p>
                    <p className="text-xs text-white/60">Balls</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{player.battingStats.fours}</p>
                    <p className="text-xs text-white/60">4s</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{player.battingStats.sixes}</p>
                    <p className="text-xs text-white/60">6s</p>
                  </div>
                </div>
              </div>
            )}
            {player.bowlingStats && player.bowlingStats.overs > 0 && (
              <div className="flex-1 bg-white/10 rounded-xl px-4 py-3">
                <p className="text-xs text-white/60 mb-2 font-medium uppercase tracking-wide">Bowling</p>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-xl font-bold text-yellow-300">{player.bowlingStats.wickets}</p>
                    <p className="text-xs text-white/60">Wkts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{player.bowlingStats.runs}</p>
                    <p className="text-xs text-white/60">Runs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">{player.bowlingStats.overs.toFixed(1)}</p>
                    <p className="text-xs text-white/60">Overs</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        <div className="relative mt-4 text-center">
          <p className="text-sm text-white/80 font-medium">{result}</p>
        </div>
      </div>

      {/* Share buttons */}
      <div className="px-6 py-4">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Share this moment</p>
        <div className="flex flex-wrap gap-2">
          {/* Native share (mobile) */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-[#1B3A5C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2D5484] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {shared ? "Shared!" : "Share"}
          </button>

          {/* Twitter/X */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Post on X
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#20b858] transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-[#769FCD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[#769FCD]">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
