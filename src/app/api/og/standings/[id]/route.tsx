import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const league = await prisma.league.findUnique({
    where: { id },
    select: {
      name: true,
      season: true,
      status: true,
      pointsTable: {
        include: { team: { select: { name: true, shortName: true, jerseyColor: true } } },
        orderBy: [{ points: "desc" }, { netRunRate: "desc" }],
        take: 8,
      },
    },
  });

  if (!league) return new Response("Not found", { status: 404 });

  const rows = league.pointsTable;

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
          padding: "52px",
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

        <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", gap: "20px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  backgroundColor: "#1b3656",
                  padding: "4px 12px",
                  fontSize: "10px",
                  fontWeight: 900,
                  letterSpacing: "0.24em",
                  color: "#d4e3ff",
                  textTransform: "uppercase",
                  alignSelf: "flex-start",
                }}
              >
                Standings
              </div>
              <div
                style={{
                  fontSize: "42px",
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  textTransform: "uppercase",
                }}
              >
                {league.name}
              </div>
              <div style={{ fontSize: "16px", color: "#4ae183", fontWeight: 700, letterSpacing: "0.08em" }}>
                {league.season}
              </div>
            </div>
            <div
              style={{
                backgroundColor: league.status === "ACTIVE" ? "#4ae183" : "#1b3656",
                padding: "4px 12px",
                fontSize: "10px",
                fontWeight: 900,
                letterSpacing: "0.22em",
                color: league.status === "ACTIVE" ? "#003919" : "#d4e3ff",
                textTransform: "uppercase",
              }}
            >
              {league.status}
            </div>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: "flex",
              gap: "0",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
              paddingBottom: "8px",
            }}
          >
            <div style={{ width: "32px", fontSize: "9px", fontWeight: 900, color: "#9bb2d1", letterSpacing: "0.18em", textTransform: "uppercase" }}>#</div>
            <div style={{ flex: 1, fontSize: "9px", fontWeight: 900, color: "#9bb2d1", letterSpacing: "0.18em", textTransform: "uppercase" }}>Team</div>
            {["P", "W", "L", "NR", "NRR", "Pts"].map((col) => (
              <div key={col} style={{ width: "60px", textAlign: "right", fontSize: "9px", fontWeight: 900, color: "#9bb2d1", letterSpacing: "0.18em", textTransform: "uppercase" }}>{col}</div>
            ))}
          </div>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            {rows.map((row, i) => (
              <div
                key={row.teamId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: i === 0 ? "rgba(74,225,131,0.08)" : "rgba(0,28,58,0.8)",
                  borderLeft: i < 2 ? `3px solid ${row.team.jerseyColor || "#4ae183"}` : "3px solid transparent",
                  paddingLeft: "10px",
                  paddingRight: "12px",
                  paddingTop: "10px",
                  paddingBottom: "10px",
                }}
              >
                <div style={{ width: "32px", fontSize: "14px", fontWeight: 900, color: i === 0 ? "#4ae183" : "#9bb2d1" }}>{i + 1}</div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      backgroundColor: row.team.jerseyColor || "#1b3656",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: 900,
                      color: "#fff",
                    }}
                  >
                    {row.team.shortName?.charAt(0) || "?"}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {row.team.shortName}
                  </div>
                </div>
                {[
                  row.matchesPlayed,
                  row.wins,
                  row.losses,
                  row.noResults,
                  row.netRunRate.toFixed(3),
                  row.points,
                ].map((val, vi) => (
                  <div key={vi} style={{ width: "60px", textAlign: "right", fontSize: "14px", fontWeight: vi === 5 ? 900 : 700, color: vi === 5 ? "#4ae183" : "#d4e3ff" }}>
                    {val}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ fontSize: "11px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              CricketLeague
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
