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
      matchFormat: true,
      tournamentType: true,
      _count: { select: { teams: true, matches: true } },
    },
  });

  if (!league) return new Response("Not found", { status: 404 });

  const statusColor =
    league.status === "ACTIVE" ? "#4ae183" :
    league.status === "COMPLETED" ? "#1b3656" : "#c8c8b0";
  const statusTextColor =
    league.status === "ACTIVE" ? "#003919" :
    league.status === "COMPLETED" ? "#d4e3ff" : "#303221";

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
          padding: "64px",
          position: "relative",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(74,225,131,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,225,131,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          {/* Top */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                backgroundColor: "#1b3656",
                padding: "4px 12px",
                fontSize: "10px",
                fontWeight: 900,
                letterSpacing: "0.24em",
                color: "#d4e3ff",
                textTransform: "uppercase",
              }}
            >
              League
            </div>
            <div
              style={{
                backgroundColor: statusColor,
                padding: "4px 12px",
                fontSize: "10px",
                fontWeight: 900,
                letterSpacing: "0.22em",
                color: statusTextColor,
                textTransform: "uppercase",
              }}
            >
              {league.status}
            </div>
          </div>

          {/* Centre */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                fontSize: "72px",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {league.name}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#4ae183", letterSpacing: "0.06em" }}>
              {league.season}
            </div>
            <div style={{ fontSize: "14px", color: "#9bb2d1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em" }}>
              {league.matchFormat} · {league.tournamentType.replace(/_/g, " ")}
            </div>
          </div>

          {/* Bottom stats */}
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundColor: "#001c3a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "16px 24px",
                }}
              >
                <div style={{ fontSize: "36px", fontWeight: 900, color: "#fff" }}>{league._count.teams}</div>
                <div style={{ fontSize: "10px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>Teams</div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundColor: "#001c3a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "16px 24px",
                }}
              >
                <div style={{ fontSize: "36px", fontWeight: 900, color: "#fff" }}>{league._count.matches}</div>
                <div style={{ fontSize: "10px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>Matches</div>
              </div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: "11px", color: "#9bb2d1", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              CricketLeague
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
