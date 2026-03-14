# Cricket League App Developer Specification

## 1. Scope
This document defines implementation requirements for the existing Next.js + Prisma cricket app, using the requested modules and formulas.

## 2. Core Modules

### 2.1 League Module
Required fields:
- `name`, `season`, `year`, `matchFormat`, `tournamentType`
- `startDate`, `endDate`, `maxTeams`, `squadSizeLimit`
- `oversPerInnings`, `powerplayOvers`, `superOverEnabled`
- `pointsPerWin`, `pointsPerTie`, `pointsPerNoResult`
- `status`, `logo`, `banner`

Additional fields to add:
- `dlsEnabled` (boolean)
- `minimumOversForResult` (int)
- `tieRule` (string enum)
- `noResultRule` (string enum)
- `matchRulesJson` (json/text)

Acceptance:
- League cannot be activated without valid dates, overs config, and points rules.
- Status lifecycle: `DRAFT -> REGISTRATION -> ACTIVE -> COMPLETED|CANCELED`.

### 2.2 League Registration
#### Team registration
Required:
- Team identity/contact, manager, city, captain/vice-captain, squad, jersey, sponsor, fee status

Current entities used:
- `Team`, `TeamLeague`, `Player`

Additional fields to add:
- `TeamLeague.registrationFeeStatus` (`PENDING|PAID|WAIVED`)
- `TeamLeague.registrationOpenAt`, `registrationCloseAt` (or league-level if global)
- `TeamLeague.approvalStatus` (`PENDING|APPROVED|REJECTED|WAITLISTED`)
- `TeamLeague.approvalNotes`

#### Player registration
Required:
- Full name, DOB, photo, role, batting/bowling style, jersey no., medical/fitness, availability, optional ID proof

Additional fields to add:
- `Player.dateOfBirth`
- `Player.photoUrl`
- `Player.medicalStatus`
- `Player.availabilityStatus`
- `Player.idProofUrl`

Validation rules:
- Same player cannot join 2 teams in same league unless `league.allowMultiTeamPlayers = true`.
- Squad size must be `<= league.squadSizeLimit`.
- Registration auto-closes after deadline.

### 2.3 Matches Module
Required match metadata:
- IDs, teams, stage/group, venue, date/time, format/overs, officials, toss, XI, result, status

Current entities used:
- `Match`, `PlayingXI`, `MatchOfficial`, `Innings`, `Over`, `BallEvent`

Additional fields to add:
- `Match.stage` (league/group/semi/final)
- `Match.groupName`
- `Match.matchNumber`
- `Match.reserveDay`
- `Match.delayReason`
- `Match.revisedTargetDls`

Status support:
- `UPCOMING`, `LIVE`, `INNINGS_BREAK`, `DELAYED`, `ABANDONED`, `COMPLETED`, `CANCELED`

### 2.4 Timetable / Schedule / Fixtures
Views:
- Calendar (day-wise)
- List (round-wise)
- Team filter
- Venue filter

Scheduling rules:
- No team overlap in same time slot.
- No venue overlap in same time slot.
- Support reserve day and rescheduled matches.

APIs to add:
- `POST /api/fixtures/generate`
- `POST /api/fixtures/validate`
- `PATCH /api/matches/:id/reschedule`

### 2.5 Point Table
Columns:
- Position, team, P/W/L/T/NR, points, NRR, runs/overs for and against

Ranking order:
1. Points
2. NRR
3. Head-to-head
4. Runs scored

Implementation:
- Recompute standings after match completion and after any scoring correction.
- Persist sortable metrics in `PointsTable`.

### 2.6 Scorer / Scorecard
Scorer actions:
- Start match, toss, XI, ball entry, undo, over edit, innings end, finalize

Ball events:
- Runs, extras, wickets, dismissal modes, retired hurt

Scorecard output:
- Innings totals, batting, bowling, extras, fall of wickets, partnerships, over summary, result, POTM

Critical backend rule:
- Legal balls exclude wides and no-balls, include byes/leg-byes.

### 2.7 Economy, Strike Rate, Average
Formulas:
- Economy = `runsConceded / oversBowled`
- Bat SR = `(runs / balls) * 100`
- Bowl SR = `ballsBowled / wickets`
- Bat Avg = `runs / dismissals`
- Bowl Avg = `runsConceded / wickets`

Overs handling rule:
- Cricket overs notation (`3.2`) is not decimal (`3.2 != 3.333...`).
- Use ball-based math internally, convert for display.

### 2.8 DLS
Required support:
- League-level DLS flag
- Interruption log (time lost, overs reduced)
- Par score and revised target storage
- Result note: "won/lost by DLS"

Entities to add:
- `MatchInterruption` (`matchId`, `startAt`, `endAt`, `reason`, `oversLost`, `note`)
- `DlsRevision` (`matchId`, `inningsNumber`, `resourcesBefore`, `resourcesAfter`, `parScore`, `revisedTarget`)

Note:
- Full ICC DLS standard edition requires licensed resource tables. MVP can ship as a manual-entry DLS override with audit logging.

## 3. Data Model Additions (Prisma)
Add/extend models for:
- `League`: `dlsEnabled`, `minimumOversForResult`, rule JSON fields
- `TeamLeague`: fee and approval workflow fields
- `Player`: profile/fitness/availability docs
- `Match`: stage/group/match number/reserve/revision fields
- New: `MatchInterruption`, `DlsRevision`, optional `FixtureTemplate`

## 4. API Requirements

### League/Admin
- `POST /api/leagues`
- `PATCH /api/leagues/:id` (rules, DLS, points)
- `POST /api/leagues/:id/publish-fixtures`

### Registration
- `POST /api/leagues/:id/teams/register`
- `PATCH /api/leagues/:id/teams/:teamLeagueId/approve`
- `POST /api/players/register`
- `PATCH /api/players/:id/availability`

### Match/Scoring
- `POST /api/matches`
- `PATCH /api/matches/:id/toss`
- `PATCH /api/matches/:id/playing-xi`
- `POST /api/scoring`
- `POST /api/scoring/undo`
- `POST /api/scoring/complete`
- `POST /api/matches/:id/dls/revise`

### Standings/Stats
- `GET /api/leagues/:id/points-table`
- `GET /api/stats/leaderboard?leagueId=&type=`

## 5. Frontend Screen Contracts

### League screen tabs
- Overview, Rules, Teams, Fixtures, Points Table, Stats, Media

### Registration
- Team registration, Player registration, Documents, Fee, Approval status

### Matches
- Live, Upcoming, Completed, Match detail, Scorecard

### Schedule
- Calendar, List, Team-wise, Venue-wise

### Points Table
- Group-wise and overall, with NRR details

### Admin
- Approvals, Fixtures, Scorer assignment, Result corrections, Rule config

## 6. Calculation Contracts

### Net Run Rate
`NRR = (runsScored / oversFaced) - (runsConceded / oversBowled)`

Implementation notes:
- Store balls internally where possible.
- Convert to overs only for display.
- If continuing float storage for overs notation, always convert notation to balls before rate math.

### Minimum precision
- Rates shown to 2 decimals.
- Overs shown as cricket notation for UI (`x.y`).

## 7. MVP Delivery Plan

### Phase 1 (must-have)
- League creation/rules
- Team and player registration with approval
- Fixture creation + conflict validation
- Live scoring + scorecard
- Auto point table + NRR
- Batting/bowling leaderboards
- DLS enable flag + manual revised target

### Phase 2
- Notifications, reports, payments, sponsor placements, media enhancements

### Phase 3
- Streaming hooks, fantasy module, richer analytics

## 8. Current Codebase Fit
Already present:
- Core models for league/team/player/match/scoring/points/stats
- Live scoring APIs and scorer UI
- Basic standings and leaderboards

Gaps to implement next:
- Full registration workflow states and fee tracking
- Formal fixture generator + overlap validator
- DLS interruption + revision entities
- Head-to-head tie-break resolution
- Stronger ball-based cumulative bowling math in season/career aggregates
