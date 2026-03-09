-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FAN',
    "profileImage" TEXT,
    "dateOfBirth" DATETIME,
    "city" TEXT,
    "battingStyle" TEXT,
    "bowlingStyle" TEXT,
    "specialty" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "banner" TEXT,
    "season" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "tournamentType" TEXT NOT NULL DEFAULT 'ROUND_ROBIN',
    "matchFormat" TEXT NOT NULL DEFAULT 'T20',
    "customOvers" INTEGER,
    "maxTeams" INTEGER NOT NULL DEFAULT 8,
    "squadSizeLimit" INTEGER NOT NULL DEFAULT 15,
    "playingXISize" INTEGER NOT NULL DEFAULT 11,
    "oversPerInnings" INTEGER NOT NULL DEFAULT 20,
    "powerplayOvers" INTEGER NOT NULL DEFAULT 6,
    "pointsPerWin" INTEGER NOT NULL DEFAULT 2,
    "pointsPerTie" INTEGER NOT NULL DEFAULT 1,
    "pointsPerNoResult" INTEGER NOT NULL DEFAULT 1,
    "superOverEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "adminId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "League_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "logo" TEXT,
    "jerseyColor" TEXT,
    "city" TEXT,
    "description" TEXT,
    "sponsorName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "managerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Team_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamLeague" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "group" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamLeague_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamLeague_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "jerseyNumber" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'BATSMAN',
    "battingHand" TEXT NOT NULL DEFAULT 'RIGHT',
    "bowlingType" TEXT,
    "age" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "isViceCaptain" BOOLEAN NOT NULL DEFAULT false,
    "isWicketkeeper" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "googleMapsUrl" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "pitchType" TEXT,
    "boundarySize" TEXT,
    "facilities" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "leagueId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "venueId" TEXT,
    "scorerId" TEXT,
    "matchDate" DATETIME NOT NULL,
    "matchFormat" TEXT NOT NULL DEFAULT 'T20',
    "overs" INTEGER NOT NULL DEFAULT 20,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "tossWinnerId" TEXT,
    "tossDecision" TEXT,
    "result" TEXT,
    "winnerTeamId" TEXT,
    "winMargin" INTEGER,
    "winType" TEXT,
    "playerOfMatchId" TEXT,
    "isNeutralVenue" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_scorerId_fkey" FOREIGN KEY ("scorerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchOfficial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "MatchOfficial_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayingXI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "isSubstitute" BOOLEAN NOT NULL DEFAULT false,
    "battingOrder" INTEGER,
    CONSTRAINT "PlayingXI_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlayingXI_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Innings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "inningsNumber" INTEGER NOT NULL,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "totalWickets" INTEGER NOT NULL DEFAULT 0,
    "totalOvers" REAL NOT NULL DEFAULT 0,
    "totalBalls" INTEGER NOT NULL DEFAULT 0,
    "extras" INTEGER NOT NULL DEFAULT 0,
    "wides" INTEGER NOT NULL DEFAULT 0,
    "noBalls" INTEGER NOT NULL DEFAULT 0,
    "byes" INTEGER NOT NULL DEFAULT 0,
    "legByes" INTEGER NOT NULL DEFAULT 0,
    "targetRuns" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isDeclared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Innings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Innings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Over" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inningsId" TEXT NOT NULL,
    "overNumber" INTEGER NOT NULL,
    "bowlerId" TEXT,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "wickets" INTEGER NOT NULL DEFAULT 0,
    "isMaiden" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Over_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BallEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inningsId" TEXT NOT NULL,
    "overId" TEXT NOT NULL,
    "ballNumber" INTEGER NOT NULL,
    "overNumber" INTEGER NOT NULL,
    "batsmanId" TEXT,
    "bowlerId" TEXT,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "isWicket" BOOLEAN NOT NULL DEFAULT false,
    "wicketType" TEXT,
    "fielderIds" TEXT,
    "isExtra" BOOLEAN NOT NULL DEFAULT false,
    "extraType" TEXT,
    "extraRuns" INTEGER NOT NULL DEFAULT 0,
    "isBoundary" BOOLEAN NOT NULL DEFAULT false,
    "isSix" BOOLEAN NOT NULL DEFAULT false,
    "commentary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BallEvent_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BallEvent_overId_fkey" FOREIGN KEY ("overId") REFERENCES "Over" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BattingScorecard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inningsId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "balls" INTEGER NOT NULL DEFAULT 0,
    "fours" INTEGER NOT NULL DEFAULT 0,
    "sixes" INTEGER NOT NULL DEFAULT 0,
    "strikeRate" REAL NOT NULL DEFAULT 0,
    "isOut" BOOLEAN NOT NULL DEFAULT false,
    "wicketType" TEXT,
    "bowlerId" TEXT,
    "fielderId" TEXT,
    "battingOrder" INTEGER NOT NULL,
    CONSTRAINT "BattingScorecard_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BattingScorecard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BowlingScorecard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inningsId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "overs" REAL NOT NULL DEFAULT 0,
    "maidens" INTEGER NOT NULL DEFAULT 0,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "wickets" INTEGER NOT NULL DEFAULT 0,
    "economy" REAL NOT NULL DEFAULT 0,
    "wides" INTEGER NOT NULL DEFAULT 0,
    "noBalls" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BowlingScorecard_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BowlingScorecard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PointsTable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "group" TEXT,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "ties" INTEGER NOT NULL DEFAULT 0,
    "noResults" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "netRunRate" REAL NOT NULL DEFAULT 0,
    "runsScored" INTEGER NOT NULL DEFAULT 0,
    "oversFaced" REAL NOT NULL DEFAULT 0,
    "runsConceded" INTEGER NOT NULL DEFAULT 0,
    "oversBowled" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PointsTable_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PointsTable_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "leagueId" TEXT,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "innings" INTEGER NOT NULL DEFAULT 0,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "ballsFaced" INTEGER NOT NULL DEFAULT 0,
    "fours" INTEGER NOT NULL DEFAULT 0,
    "sixes" INTEGER NOT NULL DEFAULT 0,
    "strikeRate" REAL NOT NULL DEFAULT 0,
    "average" REAL NOT NULL DEFAULT 0,
    "highestScore" INTEGER NOT NULL DEFAULT 0,
    "wickets" INTEGER NOT NULL DEFAULT 0,
    "oversBowled" REAL NOT NULL DEFAULT 0,
    "maidens" INTEGER NOT NULL DEFAULT 0,
    "runsConceded" INTEGER NOT NULL DEFAULT 0,
    "economy" REAL NOT NULL DEFAULT 0,
    "bestBowling" TEXT,
    "catches" INTEGER NOT NULL DEFAULT 0,
    "runOuts" INTEGER NOT NULL DEFAULT 0,
    "stumpings" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlayerStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "matchId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Announcement_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT,
    "title" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Media_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "website" TEXT,
    "tier" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sponsor_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "matchId" TEXT,
    "playerId" TEXT,
    "userId" TEXT,
    "awardType" TEXT NOT NULL,
    "description" TEXT,
    "isAutoCalc" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Award_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Award_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Award_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "matchId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamLeague_teamId_leagueId_key" ON "TeamLeague"("teamId", "leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PointsTable_leagueId_teamId_key" ON "PointsTable"("leagueId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_playerId_leagueId_key" ON "PlayerStats"("playerId", "leagueId");
