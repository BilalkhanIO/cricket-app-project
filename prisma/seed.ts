import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const OVERALL_LEAGUE_KEY = "__OVERALL__";

async function main() {
  console.log("🌱 Seeding database...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@cricket.com" },
    update: {},
    create: {
      email: "admin@cricket.com",
      name: "Super Admin",
      password: passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
      isVerified: true,
    },
  });

  const leagueAdmin = await prisma.user.upsert({
    where: { email: "league@cricket.com" },
    update: {},
    create: {
      email: "league@cricket.com",
      name: "League Admin",
      password: passwordHash,
      role: "LEAGUE_ADMIN",
      isActive: true,
      isVerified: true,
      city: "Lahore",
    },
  });

  const manager1 = await prisma.user.upsert({
    where: { email: "manager1@cricket.com" },
    update: {},
    create: {
      email: "manager1@cricket.com",
      name: "Ali Hassan",
      password: passwordHash,
      role: "TEAM_MANAGER",
      isActive: true,
      isVerified: true,
      city: "Karachi",
    },
  });

  const manager2 = await prisma.user.upsert({
    where: { email: "manager2@cricket.com" },
    update: {},
    create: {
      email: "manager2@cricket.com",
      name: "Usman Malik",
      password: passwordHash,
      role: "TEAM_MANAGER",
      isActive: true,
      isVerified: true,
      city: "Lahore",
    },
  });

  const scorer = await prisma.user.upsert({
    where: { email: "scorer@cricket.com" },
    update: {},
    create: {
      email: "scorer@cricket.com",
      name: "Scorer One",
      password: passwordHash,
      role: "SCORER",
      isActive: true,
      isVerified: true,
    },
  });

  // Player users
  const playerUsers = await Promise.all(
    [
      { name: "Babar Azam", email: "babar@cricket.com", city: "Lahore", batting: "RIGHT", bowling: "RIGHT_ARM_MEDIUM" },
      { name: "Mohammad Rizwan", email: "rizwan@cricket.com", city: "Peshawar", batting: "RIGHT", bowling: "RIGHT_ARM_MEDIUM" },
      { name: "Shaheen Afridi", email: "shaheen@cricket.com", city: "Khyber", batting: "LEFT", bowling: "LEFT_ARM_FAST" },
      { name: "Fakhar Zaman", email: "fakhar@cricket.com", city: "Mardan", batting: "LEFT", bowling: "RIGHT_ARM_MEDIUM" },
      { name: "Shadab Khan", email: "shadab@cricket.com", city: "Mianwali", batting: "RIGHT", bowling: "RIGHT_ARM_SPIN" },
      { name: "Haris Rauf", email: "haris@cricket.com", city: "Rawalpindi", batting: "RIGHT", bowling: "RIGHT_ARM_FAST" },
      { name: "Imam ul Haq", email: "imam@cricket.com", city: "Lahore", batting: "LEFT", bowling: "RIGHT_ARM_MEDIUM" },
      { name: "Asif Ali", email: "asif@cricket.com", city: "Faisalabad", batting: "RIGHT", bowling: "RIGHT_ARM_MEDIUM" },
      { name: "Khurram Shahzad", email: "khurram@cricket.com", city: "Lahore", batting: "RIGHT", bowling: "RIGHT_ARM_FAST" },
      { name: "Saim Ayub", email: "saim@cricket.com", city: "Karachi", batting: "LEFT", bowling: "RIGHT_ARM_MEDIUM" },
      { name: "Usman Khan", email: "usman@cricket.com", city: "Peshawar", batting: "RIGHT", bowling: "RIGHT_ARM_FAST" },
      { name: "Abrar Ahmed", email: "abrar@cricket.com", city: "Karachi", batting: "RIGHT", bowling: "RIGHT_ARM_SPIN" },
      { name: "Iftikhar Ahmed", email: "iftikhar@cricket.com", city: "Peshawar", batting: "RIGHT", bowling: "RIGHT_ARM_SPIN" },
      { name: "Zaman Khan", email: "zaman@cricket.com", city: "Khyber", batting: "RIGHT", bowling: "LEFT_ARM_FAST" },
      { name: "Mohammad Nawaz", email: "nawaz@cricket.com", city: "Lahore", batting: "LEFT", bowling: "LEFT_ARM_SPIN" },
      { name: "Rohit Sharma", email: "rohit@cricket.com", city: "Mumbai", batting: "RIGHT", bowling: "RIGHT_ARM_MEDIUM" },
      { name: "Virat Kohli", email: "virat@cricket.com", city: "Delhi", batting: "RIGHT", bowling: "RIGHT_ARM_MEDIUM" },
      { name: "Jasprit Bumrah", email: "bumrah@cricket.com", city: "Ahmedabad", batting: "RIGHT", bowling: "RIGHT_ARM_FAST" },
      { name: "KL Rahul", email: "rahul@cricket.com", city: "Bangalore", batting: "RIGHT", bowling: "RIGHT_ARM_MEDIUM" },
      { name: "Ravindra Jadeja", email: "jadeja@cricket.com", city: "Rajkot", batting: "LEFT", bowling: "LEFT_ARM_SPIN" },
      { name: "Hardik Pandya", email: "hardik@cricket.com", city: "Baroda", batting: "RIGHT", bowling: "RIGHT_ARM_FAST" },
      { name: "Suryakumar Yadav", email: "surya@cricket.com", city: "Mumbai", batting: "RIGHT", bowling: "RIGHT_ARM_MEDIUM" },
    ].map((p) =>
      prisma.user.upsert({
        where: { email: p.email },
        update: {},
        create: {
          email: p.email,
          name: p.name,
          password: passwordHash,
          role: "PLAYER",
          isActive: true,
          isVerified: true,
          city: p.city,
          battingStyle: p.batting,
          bowlingStyle: p.bowling,
        },
      })
    )
  );

  // ── Venues ─────────────────────────────────────────────────────────────────
  const venue1 = await prisma.venue.upsert({
    where: { id: "venue-national-stadium" },
    update: {},
    create: {
      id: "venue-national-stadium",
      name: "National Stadium",
      city: "Karachi",
      address: "Stadium Road, Karachi",
      pitchType: "FLAT",
      boundarySize: "65m",
    },
  });

  const venue2 = await prisma.venue.upsert({
    where: { id: "venue-gaddafi-stadium" },
    update: {},
    create: {
      id: "venue-gaddafi-stadium",
      name: "Gaddafi Stadium",
      city: "Lahore",
      address: "Ferozpur Road, Lahore",
      pitchType: "SPIN_FRIENDLY",
      boundarySize: "70m",
    },
  });

  // ── Teams ──────────────────────────────────────────────────────────────────
  const team1 = await prisma.team.upsert({
    where: { id: "team-karachi-kings" },
    update: {},
    create: {
      id: "team-karachi-kings",
      name: "Karachi Kings",
      shortName: "KK",
      jerseyColor: "#006400",
      city: "Karachi",
      description: "The pride of Karachi",
      managerId: manager1.id,
    },
  });

  const team2 = await prisma.team.upsert({
    where: { id: "team-lahore-qalandars" },
    update: {},
    create: {
      id: "team-lahore-qalandars",
      name: "Lahore Qalandars",
      shortName: "LQ",
      jerseyColor: "#FF0000",
      city: "Lahore",
      description: "Champions of the heartland",
      managerId: manager2.id,
    },
  });

  const team3 = await prisma.team.upsert({
    where: { id: "team-islamabad-united" },
    update: {},
    create: {
      id: "team-islamabad-united",
      name: "Islamabad United",
      shortName: "IU",
      jerseyColor: "#FF4500",
      city: "Islamabad",
      description: "United we stand",
      managerId: manager1.id,
    },
  });

  const team4 = await prisma.team.upsert({
    where: { id: "team-peshawar-zalmi" },
    update: {},
    create: {
      id: "team-peshawar-zalmi",
      name: "Peshawar Zalmi",
      shortName: "PZ",
      jerseyColor: "#FFA500",
      city: "Peshawar",
      description: "The warriors of the north",
      managerId: manager2.id,
    },
  });

  // ── Players ────────────────────────────────────────────────────────────────
  const team1Players = playerUsers.slice(0, 11);
  const team2Players = playerUsers.slice(11, 22);

  const team1Roster = await Promise.all(
    team1Players.map((u, i) =>
      prisma.player.upsert({
        where: { userId: u.id },
        update: {},
        create: {
          userId: u.id,
          teamId: team1.id,
          jerseyNumber: i + 1,
          role: i === 0 ? "BATSMAN" : i === 1 ? "WICKETKEEPER" : i < 6 ? "BATSMAN" : i < 9 ? "BOWLER" : "ALL_ROUNDER",
          battingHand: u.battingStyle ?? "RIGHT",
          bowlingType: u.bowlingStyle ?? undefined,
          isCaptain: i === 0,
          isViceCaptain: i === 1,
          isWicketkeeper: i === 1,
          isActive: true,
        },
      })
    )
  );

  const team2Roster = await Promise.all(
    team2Players.map((u, i) =>
      prisma.player.upsert({
        where: { userId: u.id },
        update: {},
        create: {
          userId: u.id,
          teamId: team2.id,
          jerseyNumber: i + 1,
          role: i === 0 ? "BATSMAN" : i === 1 ? "WICKETKEEPER" : i < 6 ? "BATSMAN" : i < 9 ? "BOWLER" : "ALL_ROUNDER",
          battingHand: u.battingStyle ?? "RIGHT",
          bowlingType: u.bowlingStyle ?? undefined,
          isCaptain: i === 0,
          isViceCaptain: i === 1,
          isWicketkeeper: i === 1,
          isActive: true,
        },
      })
    )
  );

  // ── League ─────────────────────────────────────────────────────────────────
  const league = await prisma.league.upsert({
    where: { id: "league-psl-2025" },
    update: {},
    create: {
      id: "league-psl-2025",
      name: "Pakistan Super League 2025",
      description: "The premier T20 cricket league of Pakistan",
      season: "Season 10",
      year: 2025,
      startDate: new Date("2025-02-15"),
      endDate: new Date("2025-03-25"),
      tournamentType: "ROUND_ROBIN",
      matchFormat: "T20",
      maxTeams: 6,
      oversPerInnings: 20,
      powerplayOvers: 6,
      pointsPerWin: 2,
      pointsPerTie: 1,
      status: "ACTIVE",
      adminId: leagueAdmin.id,
    },
  });

  // ── Team–League registrations ──────────────────────────────────────────────
  await Promise.all(
    [team1, team2, team3, team4].map((team) =>
      prisma.teamLeague.upsert({
        where: { teamId_leagueId: { teamId: team.id, leagueId: league.id } },
        update: {},
        create: { teamId: team.id, leagueId: league.id, status: "APPROVED" },
      })
    )
  );

  // ── Points table ───────────────────────────────────────────────────────────
  const pointsData = [
    { team: team1, w: 4, l: 1, pts: 8, nrr: 0.85, rs: 820, of: 40, rc: 760, ob: 40 },
    { team: team2, w: 3, l: 2, pts: 6, nrr: 0.32, rs: 780, of: 40, rc: 750, ob: 40 },
    { team: team3, w: 2, l: 3, pts: 4, nrr: -0.21, rs: 740, of: 40, rc: 770, ob: 40 },
    { team: team4, w: 1, l: 4, pts: 2, nrr: -0.98, rs: 700, of: 40, rc: 790, ob: 40 },
  ];

  await Promise.all(
    pointsData.map((d) =>
      prisma.pointsTable.upsert({
        where: { leagueId_teamId: { leagueId: league.id, teamId: d.team.id } },
        update: {},
        create: {
          leagueId: league.id,
          teamId: d.team.id,
          matchesPlayed: d.w + d.l,
          wins: d.w,
          losses: d.l,
          points: d.pts,
          netRunRate: d.nrr,
          runsScored: d.rs,
          oversFaced: d.of,
          runsConceded: d.rc,
          oversBowled: d.ob,
        },
      })
    )
  );

  // ── Matches ────────────────────────────────────────────────────────────────
  const match1 = await prisma.match.upsert({
    where: { id: "match-kk-vs-lq-1" },
    update: {},
    create: {
      id: "match-kk-vs-lq-1",
      title: "Karachi Kings vs Lahore Qalandars",
      leagueId: league.id,
      homeTeamId: team1.id,
      awayTeamId: team2.id,
      venueId: venue1.id,
      scorerId: scorer.id,
      matchDate: new Date("2025-02-20T18:00:00Z"),
      matchFormat: "T20",
      overs: 20,
      status: "COMPLETED",
      tossWinnerId: team1.id,
      tossDecision: "BAT",
      result: "Karachi Kings won by 25 runs",
      winnerTeamId: team1.id,
      winMargin: 25,
      winType: "RUNS",
    },
  });

  await prisma.match.upsert({
    where: { id: "match-iu-vs-pz-1" },
    update: {},
    create: {
      id: "match-iu-vs-pz-1",
      title: "Islamabad United vs Peshawar Zalmi",
      leagueId: league.id,
      homeTeamId: team3.id,
      awayTeamId: team4.id,
      venueId: venue2.id,
      scorerId: scorer.id,
      matchDate: new Date("2025-02-22T14:00:00Z"),
      matchFormat: "T20",
      overs: 20,
      status: "COMPLETED",
      tossWinnerId: team3.id,
      tossDecision: "FIELD",
      result: "Islamabad United won by 3 wickets",
      winnerTeamId: team3.id,
      winMargin: 3,
      winType: "WICKETS",
    },
  });

  // ── Player Stats (league + overall) ───────────────────────────────────────
  const seededStats = [...team1Roster, ...team2Roster].map((player, idx) => {
    const isPrimaryBowler = idx % 3 === 0;
    const matchesPlayed = 5 - (idx % 2);
    const innings = matchesPlayed;
    const runs = 210 - idx * 6;
    const dismissals = Math.max(1, innings - 1);
    const notOuts = Math.max(0, innings - dismissals);
    const ballsFaced = Math.max(20, runs + 35);
    const wickets = isPrimaryBowler ? 8 - (idx % 4) : idx % 2;
    const ballsBowled = isPrimaryBowler ? 84 - (idx % 3) * 6 : (idx % 2) * 12;
    const oversBowled = Math.floor(ballsBowled / 6) + (ballsBowled % 6) / 10;
    const runsConceded = isPrimaryBowler ? 92 - idx : 18 + idx;
    const strikeRate = Number(((runs / ballsFaced) * 100).toFixed(2));
    const average = Number((runs / dismissals).toFixed(2));
    const economy = ballsBowled > 0 ? Number(((runsConceded * 6) / ballsBowled).toFixed(2)) : 0;
    const bowlingAverage = wickets > 0 ? Number((runsConceded / wickets).toFixed(2)) : 0;
    const bowlingStrikeRate = wickets > 0 ? Number((ballsBowled / wickets).toFixed(2)) : 0;

    return {
      playerId: player.id,
      matchesPlayed,
      innings,
      dismissals,
      notOuts,
      runs,
      ballsFaced,
      fours: Math.max(8, Math.floor(runs / 15)),
      sixes: Math.max(2, Math.floor(runs / 35)),
      thirties: runs >= 30 ? 2 : 0,
      fifties: runs >= 50 ? 1 : 0,
      hundreds: runs >= 100 ? 1 : 0,
      strikeRate,
      average,
      highestScore: Math.min(runs, 101 - (idx % 9)),
      wickets,
      oversBowled,
      ballsBowled,
      maidens: isPrimaryBowler ? 1 + (idx % 2) : 0,
      runsConceded,
      economy,
      bowlingAverage,
      bowlingStrikeRate,
      bestBowling: wickets > 0 ? `${Math.min(wickets, 4)}/${Math.max(8, Math.floor(runsConceded / 2))}` : null,
      catches: idx % 3,
      runOuts: idx % 2,
      stumpings: idx === 1 || idx === 12 ? 2 : 0,
    };
  });

  await Promise.all(
    seededStats.flatMap((stats) => [
      prisma.playerStats.upsert({
        where: { playerId_leagueId: { playerId: stats.playerId, leagueId: league.id } },
        update: stats,
        create: { ...stats, leagueId: league.id },
      }),
      prisma.playerStats.upsert({
        where: { playerId_leagueId: { playerId: stats.playerId, leagueId: OVERALL_LEAGUE_KEY } },
        update: stats,
        create: { ...stats, leagueId: OVERALL_LEAGUE_KEY },
      }),
    ])
  );

  await prisma.match.upsert({
    where: { id: "match-kk-vs-iu-upcoming" },
    update: {},
    create: {
      id: "match-kk-vs-iu-upcoming",
      title: "Karachi Kings vs Islamabad United",
      leagueId: league.id,
      homeTeamId: team1.id,
      awayTeamId: team3.id,
      venueId: venue1.id,
      matchDate: new Date("2025-03-10T18:00:00Z"),
      matchFormat: "T20",
      overs: 20,
      status: "UPCOMING",
    },
  });

  await prisma.match.upsert({
    where: { id: "match-lq-vs-pz-live" },
    update: {},
    create: {
      id: "match-lq-vs-pz-live",
      title: "Lahore Qalandars vs Peshawar Zalmi",
      leagueId: league.id,
      homeTeamId: team2.id,
      awayTeamId: team4.id,
      venueId: venue2.id,
      scorerId: scorer.id,
      matchDate: new Date("2025-03-08T14:00:00Z"),
      matchFormat: "T20",
      overs: 20,
      status: "LIVE",
      tossWinnerId: team2.id,
      tossDecision: "BAT",
    },
  });

  // ── Announcements ──────────────────────────────────────────────────────────
  await prisma.announcement.createMany({
    skipDuplicates: true,
    data: [
      {
        leagueId: league.id,
        authorId: leagueAdmin.id,
        title: "PSL 2025 Season Kickoff!",
        content: "We are excited to announce the start of PSL 2025. Get ready for an action-packed season!",
        isPublic: true,
      },
      {
        leagueId: league.id,
        authorId: leagueAdmin.id,
        title: "Ticket Sales Open",
        content: "Tickets for all home matches are now available. Book your seats early to avoid disappointment.",
        isPublic: true,
      },
      {
        authorId: superAdmin.id,
        title: "Welcome to the Cricket League Platform",
        content: "Our new platform is live! Manage leagues, teams, and live scores all in one place.",
        isPublic: true,
      },
    ],
  });

  console.log("✅ Seed complete!");
  console.log("\n📋 Login credentials (password: Password123!):");
  console.log("   Super Admin : admin@cricket.com");
  console.log("   League Admin: league@cricket.com");
  console.log("   Manager 1   : manager1@cricket.com");
  console.log("   Manager 2   : manager2@cricket.com");
  console.log("   Scorer      : scorer@cricket.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
