import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    // Create Super Admin
    const adminPassword = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.upsert({
      where: { email: "admin@cricket.app" },
      update: {},
      create: {
        name: "Super Admin",
        email: "admin@cricket.app",
        password: adminPassword,
        role: "SUPER_ADMIN",
        isVerified: true,
      },
    });

    // Create League Admin
    const leagueAdminPw = await bcrypt.hash("league123", 12);
    const leagueAdmin = await prisma.user.upsert({
      where: { email: "leagueadmin@cricket.app" },
      update: {},
      create: {
        name: "League Admin",
        email: "leagueadmin@cricket.app",
        password: leagueAdminPw,
        role: "LEAGUE_ADMIN",
        isVerified: true,
        city: "Karachi",
      },
    });

    // Create Team Managers
    const managerPw = await bcrypt.hash("manager123", 12);
    const manager1 = await prisma.user.upsert({
      where: { email: "manager1@cricket.app" },
      update: {},
      create: {
        name: "Ali Hassan",
        email: "manager1@cricket.app",
        password: managerPw,
        role: "TEAM_MANAGER",
        isVerified: true,
        city: "Lahore",
      },
    });
    const manager2 = await prisma.user.upsert({
      where: { email: "manager2@cricket.app" },
      update: {},
      create: {
        name: "Usman Khan",
        email: "manager2@cricket.app",
        password: managerPw,
        role: "TEAM_MANAGER",
        isVerified: true,
        city: "Karachi",
      },
    });

    // Create Scorer
    const scorerPw = await bcrypt.hash("scorer123", 12);
    const scorer = await prisma.user.upsert({
      where: { email: "scorer@cricket.app" },
      update: {},
      create: {
        name: "Scorer User",
        email: "scorer@cricket.app",
        password: scorerPw,
        role: "SCORER",
        isVerified: true,
      },
    });

    // Create Players
    const playerPw = await bcrypt.hash("player123", 12);
    const playerUsers = [];
    const playerNames = [
      "Babar Azam", "Shaheen Afridi", "Mohammad Rizwan", "Fakhar Zaman",
      "Naseem Shah", "Shadab Khan", "Imam ul Haq", "Haris Rauf",
      "Rohit Sharma", "Virat Kohli", "Jasprit Bumrah", "KL Rahul",
      "Ravindra Jadeja", "Hardik Pandya", "Shubman Gill", "Mohammed Siraj",
      "Kane Williamson", "Trent Boult", "Devon Conway", "Mitchell Santner",
      "Jos Buttler", "Ben Stokes", "Jofra Archer", "Joe Root",
    ];

    for (let i = 0; i < playerNames.length; i++) {
      const email = `player${i + 1}@cricket.app`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          name: playerNames[i],
          email,
          password: playerPw,
          role: "PLAYER",
          isVerified: true,
        },
      });
      playerUsers.push(user);
    }

    // Create Venue
    const venue = await prisma.venue.upsert({
      where: { id: "venue-main" },
      update: {},
      create: {
        id: "venue-main",
        name: "National Cricket Stadium",
        address: "Stadium Road",
        city: "Karachi",
        pitchType: "Flat",
        boundarySize: "65m",
        facilities: "Floodlights, Scoreboard, Dressing Rooms",
      },
    });

    const venue2 = await prisma.venue.upsert({
      where: { id: "venue-lahore" },
      update: {},
      create: {
        id: "venue-lahore",
        name: "Gaddafi Stadium",
        address: "Ferozpur Road",
        city: "Lahore",
        pitchType: "Good",
        boundarySize: "70m",
        facilities: "Floodlights, Scoreboard",
      },
    });

    // Create Teams
    const team1 = await prisma.team.upsert({
      where: { id: "team-lions" },
      update: {},
      create: {
        id: "team-lions",
        name: "Karachi Lions",
        shortName: "KL",
        jerseyColor: "#1a73e8",
        city: "Karachi",
        description: "Pride of Karachi",
        managerId: manager1.id,
      },
    });

    const team2 = await prisma.team.upsert({
      where: { id: "team-tigers" },
      update: {},
      create: {
        id: "team-tigers",
        name: "Lahore Tigers",
        shortName: "LT",
        jerseyColor: "#e83a1a",
        city: "Lahore",
        description: "The Roaring Tigers",
        managerId: manager2.id,
      },
    });

    // Create League
    const league = await prisma.league.upsert({
      where: { id: "league-psl" },
      update: {},
      create: {
        id: "league-psl",
        name: "Pakistan Super League 2024",
        description: "The premier T20 cricket league of Pakistan",
        season: "2024",
        year: 2024,
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-03-18"),
        tournamentType: "ROUND_ROBIN",
        matchFormat: "T20",
        maxTeams: 6,
        oversPerInnings: 20,
        pointsPerWin: 2,
        pointsPerTie: 1,
        status: "ACTIVE",
        adminId: leagueAdmin.id,
      },
    });

    // Register Teams to League
    await prisma.teamLeague.upsert({
      where: { teamId_leagueId: { teamId: team1.id, leagueId: league.id } },
      update: {},
      create: { teamId: team1.id, leagueId: league.id, status: "APPROVED" },
    });

    await prisma.teamLeague.upsert({
      where: { teamId_leagueId: { teamId: team2.id, leagueId: league.id } },
      update: {},
      create: { teamId: team2.id, leagueId: league.id, status: "APPROVED" },
    });

    // Create Players for Teams
    const roles = ["BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"];
    for (let i = 0; i < 12; i++) {
      const existingPlayer = await prisma.player.findUnique({
        where: { userId: playerUsers[i].id },
      });
      if (!existingPlayer) {
        await prisma.player.create({
          data: {
            userId: playerUsers[i].id,
            teamId: i < 6 ? team1.id : team2.id,
            jerseyNumber: i + 1,
            role: roles[i % 4],
            battingHand: i % 3 === 0 ? "LEFT" : "RIGHT",
            age: 22 + (i % 10),
            isCaptain: i === 0 || i === 6,
            isViceCaptain: i === 1 || i === 7,
            isWicketkeeper: i === 2 || i === 8,
          },
        });
      }
    }

    // Create Points Table entries
    await prisma.pointsTable.upsert({
      where: { leagueId_teamId: { leagueId: league.id, teamId: team1.id } },
      update: {},
      create: {
        leagueId: league.id,
        teamId: team1.id,
        matchesPlayed: 3,
        wins: 2,
        losses: 1,
        points: 4,
        netRunRate: 0.45,
        runsScored: 520,
        oversFaced: 60,
        runsConceded: 495,
        oversBowled: 60,
      },
    });

    await prisma.pointsTable.upsert({
      where: { leagueId_teamId: { leagueId: league.id, teamId: team2.id } },
      update: {},
      create: {
        leagueId: league.id,
        teamId: team2.id,
        matchesPlayed: 3,
        wins: 1,
        losses: 2,
        points: 2,
        netRunRate: -0.45,
        runsScored: 495,
        oversFaced: 60,
        runsConceded: 520,
        oversBowled: 60,
      },
    });

    // Create Match
    const match = await prisma.match.upsert({
      where: { id: "match-1" },
      update: {},
      create: {
        id: "match-1",
        title: "Karachi Lions vs Lahore Tigers",
        leagueId: league.id,
        homeTeamId: team1.id,
        awayTeamId: team2.id,
        venueId: venue.id,
        scorerId: scorer.id,
        matchDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        matchFormat: "T20",
        overs: 20,
        status: "UPCOMING",
      },
    });

    // Create Announcement
    await prisma.announcement.upsert({
      where: { id: "ann-1" },
      update: {},
      create: {
        id: "ann-1",
        leagueId: league.id,
        authorId: leagueAdmin.id,
        title: "Welcome to PSL 2024!",
        content: "We are excited to announce the start of PSL 2024. Get ready for an amazing cricket season with the best teams competing.",
        isPublic: true,
      },
    });

    return NextResponse.json({
      message: "Database seeded successfully!",
      accounts: [
        { role: "Super Admin", email: "admin@cricket.app", password: "admin123" },
        { role: "League Admin", email: "leagueadmin@cricket.app", password: "league123" },
        { role: "Team Manager", email: "manager1@cricket.app", password: "manager123" },
        { role: "Scorer", email: "scorer@cricket.app", password: "scorer123" },
        { role: "Player", email: "player1@cricket.app", password: "player123" },
        { role: "Fan", note: "Register at /register" },
      ],
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed", detail: String(error) }, { status: 500 });
  }
}
