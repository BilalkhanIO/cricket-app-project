import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      status: true,
      result: true,
      matchFormat: true,
      matchDate: true,
      homeTeam: { select: { name: true, shortName: true, jerseyColor: true } },
      awayTeam: { select: { name: true, shortName: true, jerseyColor: true } },
      league: { select: { name: true, season: true } },
      innings: {
        select: {
          teamId: true,
          inningsNumber: true,
          totalRuns: true,
          totalWickets: true,
          totalOvers: true,
          isCompleted: true,
        },
        orderBy: { inningsNumber: "asc" },
      },
    },
  });

  if (!match) {
    return new Response("Not found", { status: 404 });
  }

  const homeInn = match.innings.find((i) => i.teamId === match.homeTeam.name || i.inningsNumber === 1);
  const awayInn = match.innings.find((i) => i.teamId !== homeInn?.teamId || i.inningsNumber === 2);

  const isLive = ["LIVE", "INNINGS_BREAK", "TOSS"].includes(match.status);
  const isCompleted = match.status === "COMPLETED";

  const statusColor = isLive ? "#93000a" : isCompleted ? "#4ae183" : "#1b3656";
  const statusText = isLive ? "LIVE" : isCompleted ? "COMPLETED" : match.status.replace(/_/g, " ");

  const formatScore = (inn: typeof homeInn) =>
    inn ? `${inn.totalRuns}/${inn.totalWickets}` : "—";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#00142b",
          fontFamily: "sans-serif",
          padding: "48px",
          position: "relative",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(74,225,131,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,225,131,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", gap: "24px" }}>
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  backgroundColor: "#1b3656",
                  padding: "4px 10px",
                  fontSize: "10px",
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  color: "#d4e3ff",
                  textTransform: "uppercase",
                }}
              >
                {match.league.name}
              </div>
              <div style={{ fontSize: "10px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                {match.league.season}
              </div>
            </div>
            <div
              style={{
                backgroundColor: statusColor,
                padding: "4px 12px",
                fontSize: "10px",
                fontWeight: 900,
                letterSpacing: "0.22em",
                color: isCompleted ? "#003919" : "#fff",
                textTransform: "uppercase",
              }}
            >
              {statusText}
            </div>
          </div>

          {/* Teams and scores */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1 }}>
            {/* Home team */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  backgroundColor: match.homeTeam.jerseyColor || "#1b3656",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                {match.homeTeam.shortName.charAt(0)}
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", textTransform: "uppercase" }}>
                {match.homeTeam.shortName}
              </div>
              <div style={{ fontSize: "14px", color: "#9bb2d1", fontWeight: 700 }}>
                {match.homeTeam.name}
              </div>
              {homeInn && (
                <div style={{ fontSize: "40px", fontWeight: 900, color: "#fff" }}>
                  {formatScore(homeInn)}
                </div>
              )}
            </div>

            {/* VS */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#4ae183", letterSpacing: "0.1em" }}>vs</div>
              <div style={{ fontSize: "12px", color: "#9bb2d1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                {match.matchFormat}
              </div>
            </div>

            {/* Away team */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  backgroundColor: match.awayTeam.jerseyColor || "#12324d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                {match.awayTeam.shortName.charAt(0)}
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", textTransform: "uppercase" }}>
                {match.awayTeam.shortName}
              </div>
              <div style={{ fontSize: "14px", color: "#9bb2d1", fontWeight: 700 }}>
                {match.awayTeam.name}
              </div>
              {awayInn && (
                <div style={{ fontSize: "40px", fontWeight: 900, color: "#9bb2d1" }}>
                  {formatScore(awayInn)}
                </div>
              )}
            </div>
          </div>

          {/* Result or bottom bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "13px", color: "#4ae183", fontWeight: 700 }}>
              {match.result || (isLive ? "Match in progress" : "")}
            </div>
            <div style={{ fontSize: "11px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              CricketLeague
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
