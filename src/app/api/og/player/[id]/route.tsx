import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const player = await prisma.player.findUnique({
    where: { id },
    select: {
      role: true,
      battingHand: true,
      bowlingType: true,
      jerseyNumber: true,
      isCaptain: true,
      isWicketkeeper: true,
      user: {
        select: {
          name: true,
          battingStyle: true,
          bowlingStyle: true,
        },
      },
      team: { select: { name: true, shortName: true, jerseyColor: true } },
      playerStats: {
        where: { leagueId: OVERALL_LEAGUE_KEY },
        take: 1,
        select: {
          runs: true,
          innings: true,
          wickets: true,
          average: true,
          strikeRate: true,
          fifties: true,
          hundreds: true,
        },
      },
    },
  });

  if (!player) {
    return new Response("Not found", { status: 404 });
  }

  const stats = player.playerStats[0];
  const initials = player.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const role = player.role ?? "Player";
  const teamColor = player.team?.jerseyColor || "#1b3656";

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

        {/* Team colour strip on left */}
        <div style={{ width: "8px", height: "100%", backgroundColor: teamColor, flexShrink: 0, position: "relative" }} />

        {/* Main content */}
        <div style={{ display: "flex", flex: 1, padding: "48px", gap: "48px", position: "relative" }}>
          {/* Left — avatar + name */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "16px", flex: 1 }}>
            {/* Avatar */}
            <div
              style={{
                width: "96px",
                height: "96px",
                backgroundColor: teamColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                fontWeight: 900,
                color: "#fff",
              }}
            >
              {initials}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  textTransform: "uppercase",
                }}
              >
                {player.user.name}
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <div
                  style={{
                    backgroundColor: "#1b3656",
                    padding: "3px 10px",
                    fontSize: "10px",
                    fontWeight: 900,
                    letterSpacing: "0.2em",
                    color: "#d4e3ff",
                    textTransform: "uppercase",
                  }}
                >
                  {role}
                </div>
                {player.team && (
                  <div
                    style={{
                      backgroundColor: teamColor,
                      padding: "3px 10px",
                      fontSize: "10px",
                      fontWeight: 900,
                      letterSpacing: "0.2em",
                      color: "#fff",
                      textTransform: "uppercase",
                    }}
                  >
                    {player.team.shortName}
                  </div>
                )}
                {player.isCaptain && (
                  <div
                    style={{
                      backgroundColor: "#c8c8b0",
                      padding: "3px 10px",
                      fontSize: "10px",
                      fontWeight: 900,
                      letterSpacing: "0.2em",
                      color: "#303221",
                      textTransform: "uppercase",
                    }}
                  >
                    Captain
                  </div>
                )}
              </div>

              {player.team && (
                <div style={{ fontSize: "14px", color: "#9bb2d1", fontWeight: 700 }}>
                  {player.team.name}
                </div>
              )}
            </div>
          </div>

          {/* Right — career stats */}
          {stats && (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px", minWidth: "280px" }}>
              <div style={{ fontSize: "10px", fontWeight: 900, letterSpacing: "0.22em", color: "#9bb2d1", textTransform: "uppercase" }}>
                Career Stats
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {[
                  { label: "Runs", value: stats.runs },
                  { label: "Wkts", value: stats.wickets },
                  { label: "Innings", value: stats.innings },
                  { label: "50s", value: stats.fifties },
                  { label: "100s", value: stats.hundreds },
                  ...(stats.average > 0 ? [{ label: "Avg", value: stats.average.toFixed(1) }] : []),
                  ...(stats.strikeRate > 0 ? [{ label: "SR", value: stats.strikeRate.toFixed(1) }] : []),
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      backgroundColor: "#001c3a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      padding: "12px 16px",
                      minWidth: "72px",
                    }}
                  >
                    <div style={{ fontSize: "28px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: "10px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "4px" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            right: "48px",
            fontSize: "11px",
            color: "#9bb2d1",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          CricketLeague
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
