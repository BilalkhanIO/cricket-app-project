import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;

  const award = await prisma.award.findFirst({
    where: { matchId, awardType: "MAN_OF_MATCH" },
    include: {
      player: {
        include: {
          user: { select: { name: true } },
          team: { select: { name: true, shortName: true, jerseyColor: true } },
        },
      },
      match: {
        select: {
          result: true,
          homeTeam: { select: { shortName: true } },
          awayTeam: { select: { shortName: true } },
          league: { select: { name: true, season: true } },
          innings: {
            select: {
              battingScores: {
                where: { player: { id: { not: "" } } },
                select: { playerId: true, runs: true, balls: true, isOut: true },
              },
              bowlingScores: {
                select: { playerId: true, overs: true, wickets: true, runs: true },
              },
            },
          },
        },
      },
    },
  });

  if (!award?.player || !award?.match) return new Response("Not found", { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const player = award.player!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const match = award.match!;
  const teamColor = player.team?.jerseyColor || "#1b3656";

  // Find player's match performance
  const allBatting = match.innings.flatMap((inn) => inn.battingScores);
  const allBowling = match.innings.flatMap((inn) => inn.bowlingScores);
  const batting = allBatting.find((b) => b.playerId === player.id);
  const bowling = allBowling.find((b) => b.playerId === player.id);

  const initials = player.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#00142b",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Grid bg */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(74,225,131,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,225,131,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Gold accent top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", backgroundColor: "#c8c8b0" }} />

        {/* Team color left strip */}
        <div style={{ width: "8px", height: "100%", backgroundColor: teamColor, flexShrink: 0, position: "relative" }} />

        <div style={{ display: "flex", flex: 1, flexDirection: "column", padding: "48px", justifyContent: "space-between", position: "relative" }}>
          {/* Top: MOM badge + match info */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  backgroundColor: "#c8c8b0",
                  padding: "4px 14px",
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "0.24em",
                  color: "#303221",
                  textTransform: "uppercase",
                  alignSelf: "flex-start",
                }}
              >
                Man of the Match
              </div>
              <div style={{ fontSize: "13px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {match.homeTeam.shortName} vs {match.awayTeam.shortName} · {match.league.name}
              </div>
            </div>
            <div style={{ fontSize: "13px", color: "#4ae183", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "right" }}>
              {match.result || "In Progress"}
            </div>
          </div>

          {/* Centre: Player identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                backgroundColor: teamColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                fontWeight: 900,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  fontSize: "64px",
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  textTransform: "uppercase",
                }}
              >
                {player.user.name}
              </div>
              <div style={{ fontSize: "14px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                {player.team?.shortName || ""} · {player.team?.name || ""}
              </div>
            </div>
          </div>

          {/* Bottom: Match performance */}
          <div style={{ display: "flex", gap: "16px" }}>
            {batting && (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "#001c3a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "16px 28px",
                  }}
                >
                  <div style={{ fontSize: "44px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{batting.runs}</div>
                  <div style={{ fontSize: "10px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "4px" }}>Runs</div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "#001c3a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "16px 28px",
                  }}
                >
                  <div style={{ fontSize: "44px", fontWeight: 900, color: "#d4e3ff", lineHeight: 1 }}>{batting.balls}</div>
                  <div style={{ fontSize: "10px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "4px" }}>Balls</div>
                </div>
              </>
            )}
            {bowling && bowling.wickets > 0 && (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "#001c3a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "16px 28px",
                  }}
                >
                  <div style={{ fontSize: "44px", fontWeight: 900, color: "#4ae183", lineHeight: 1 }}>{bowling.wickets}</div>
                  <div style={{ fontSize: "10px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "4px" }}>Wickets</div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "#001c3a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "16px 28px",
                  }}
                >
                  <div style={{ fontSize: "44px", fontWeight: 900, color: "#d4e3ff", lineHeight: 1 }}>{bowling.runs}</div>
                  <div style={{ fontSize: "10px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "4px" }}>Runs</div>
                </div>
              </>
            )}
            <div style={{ marginLeft: "auto", fontSize: "11px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", alignSelf: "flex-end" }}>
              CricketLeague
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
