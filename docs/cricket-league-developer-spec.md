# Cricket Management App Developer Specification

## 1. Product Baseline

This document defines the active scope for the cricket platform as a cricket operations system. Payment, subscription, invoicing, and other monetization modules are explicitly out of scope for the current roadmap.

### 1.1 Included Modules
- User management
- League and tournament management
- Team management
- Player management
- Venue management
- Match scheduling
- Live scoring
- Scorecards
- Points table
- Stats and reports
- Notifications
- Admin panel
- Public live score and match viewing

### 1.2 Excluded for Current Scope
- Payment gateway
- Team registration fees
- Subscriptions and plans
- Invoicing
- Refunds
- Monetization features

## 2. User Roles

- `SUPER_ADMIN`
- `LEAGUE_ADMIN`
- `TEAM_MANAGER`
- `SCORER`
- `UMPIRE`
- `PLAYER`
- `VIEWER`

## 3. Functional Modules

### 3.1 Authentication and Roles

Required features:
- Signup and login
- Email or phone verification
- Forgot password
- Role-based permissions
- Profile management

Core rules:
- Every authenticated user must have a role.
- Authorization must be enforced on API and UI routes.
- Public viewers can access public match data without admin privileges.

### 3.2 League and Tournament Management

Required features:
- Create tournament or series
- Define format: knockout, round robin, group stage, league plus playoffs
- Define overs: T10, T20, ODI, custom
- Define season
- Add rules
- Assign teams
- Generate fixtures
- Manage standings

Suggested league fields:
- `name`
- `season`
- `format`
- `oversPerInnings`
- `stageConfig`
- `rulesJson`
- `status`
- `startDate`
- `endDate`

### 3.3 Team Management

Required features:
- Create team
- Upload team logo
- Assign captain
- Assign manager or coach
- Maintain squad list
- Select playing XI
- Show team records and stats

Suggested fields:
- `name`
- `shortName`
- `logoUrl`
- `captainId`
- `managerUserId`
- `coachName`
- `homeCity`

### 3.4 Player Management

Required features:
- Player profile
- Role and skill set
- Batting style
- Bowling style
- Player image
- Season statistics
- Injury and availability status
- Team assignment

Suggested fields:
- `fullName`
- `playerRole`
- `battingStyle`
- `bowlingStyle`
- `imageUrl`
- `availabilityStatus`
- `injuryStatus`

### 3.5 Match Management

Required features:
- Create and schedule matches
- Assign teams
- Assign venue
- Assign officials
- Handle toss
- Select lineup
- Track match status
- Publish result

Supported statuses:
- `UPCOMING`
- `LIVE`
- `COMPLETED`
- `ABANDONED`
- `POSTPONED`

### 3.6 Live Scoring

This is the highest-priority module in the system.

Required features:
- Ball-by-ball scoring
- Extras
- Wickets
- Partnerships
- Strike handling
- Innings switching
- Over summary
- Run rate
- Required run rate
- Live scoreboard
- Undo and edit scoring events

Core principles:
- Every saved delivery is an event record.
- Scoreboard, scorecard, and player stats must stay synchronized.
- Undo and edit must create an audit trail.

### 3.7 Scorecards

Required features:
- Full batting card
- Bowling card
- Extras
- Fall of wickets
- Innings summary
- Match summary
- Man of the match

### 3.8 Points Table

Required features:
- Automatic points calculation
- Wins, losses, ties, no result
- Net run rate
- Rank ordering
- Qualification tracking

Ranking order:
1. Points
2. Net run rate
3. Head-to-head when applicable
4. Runs scored or tournament-defined fallback

### 3.9 Statistics

Required features:
- Top run scorers
- Top wicket takers
- Best batting averages
- Best strike rates
- Best economy
- Team performance stats
- Player performance history
- Head-to-head stats

### 3.10 Venue Management

Required features:
- Venue profiles
- Ground details
- City and location
- Pitch type
- Match history at venue

### 3.11 Officials Management

Required features:
- Umpire profiles
- Scorer profiles
- Assignment to matches
- Official history

### 3.12 Notifications

Required features:
- Match reminders
- Toss updates
- Live match start
- Result published
- Schedule changes
- Team announcements

### 3.13 Reports and Admin Insights

Required features:
- Tournament summary
- Team reports
- Player reports
- Match reports
- Admin dashboard KPIs

## 4. Non-Functional Requirements

### 4.1 Performance
- Realtime updates should reach viewers within 2 seconds in normal conditions.

### 4.2 Scalability
- The platform should support thousands of matches and concurrent public viewers.

### 4.3 Security
- Use JWT or session-based auth with strict role checks.
- Protect scoring and admin workflows with server-side authorization.

### 4.4 Availability
- Target 99.9% uptime for production infrastructure.

## 5. Platforms and Architecture

Supported surfaces:
- Mobile app for scorers, managers, players, and viewers
- Web admin panel
- Public web viewer

Current implementation direction:
- Frontend: Next.js web app and React Native mobile app
- Backend: Node.js application services
- Database: PostgreSQL or Prisma-supported relational database
- Realtime: WebSockets or equivalent push channel

## 6. Core Data Model

### 6.1 Active Core Tables
- `users`
- `roles`
- `leagues`
- `seasons`
- `teams`
- `players`
- `team_players`
- `venues`
- `matches`
- `match_officials`
- `tosses`
- `innings`
- `overs`
- `balls`
- `batting_stats`
- `bowling_stats`
- `fielding_stats`
- `points_table`
- `notifications`
- `announcements`

### 6.2 Removed Tables

Do not design or prioritize these in the current phase:
- `payments`
- `invoices`
- `subscription_plans`
- `transactions`
- `refunds`
- `billing_history`

### 6.3 Scoring Engine Tables

Recommended scoring-specific tables:
- `matches`
- `match_lineups`
- `innings`
- `overs`
- `ball_events`
- `batting_innings_stats`
- `bowling_innings_stats`
- `partnerships`
- `wicket_events`
- `event_audit_logs`
- `commentary_events`

## 7. API Surface

Core route groups:
- `/auth`
- `/users`
- `/leagues`
- `/teams`
- `/players`
- `/venues`
- `/matches`
- `/scoring`
- `/stats`
- `/notifications`

## 8. UX and Screen Contracts

### 8.1 Core Screens
- Login
- Signup
- Dashboard
- League list
- League details
- Team profile
- Player profile
- Match center
- Live scoring
- Scorecard
- Points table
- Stats dashboard
- Notifications
- Profile and settings

### 8.2 Scorer Flow
1. Select match
2. Enter toss
3. Select playing XI
4. Start innings
5. Score ball by ball
6. End innings
7. Complete match

### 8.3 Viewer Flow
1. Open app or web
2. View live matches
3. Open scorecard
4. Check stats

### 8.4 Live Scoring UX Requirements
- Large thumb-friendly action buttons
- Wicket action isolated from normal scoring actions
- Undo always visible
- Recent balls always visible
- Destructive actions require confirmation
- One-handed use should remain viable on mobile

## 9. Live Scoring Logic

### 9.1 Ball Event Contract

Each delivery should capture:
- `matchId`
- `inningsNo`
- `overNo`
- `ballIndex`
- `strikerId`
- `nonStrikerId`
- `bowlerId`
- `deliveryType`
- `runsOffBat`
- `extrasType`
- `extrasRuns`
- `isLegalDelivery`
- `wicketFlag`
- `wicketType`
- `playerOutId`
- `fielderId`
- `commentaryText`
- `createdBy`
- `createdAt`
- `editedFlag`
- `revisionNo`

Delivery types:
- `NORMAL`
- `WIDE`
- `NO_BALL`
- `BYE`
- `LEG_BYE`
- `DEAD_BALL`
- `PENALTY`

### 9.2 Legal Ball Rules

Counts as legal ball:
- Normal delivery
- Wicket on legal delivery
- Byes and leg byes on legal delivery

Does not count as legal ball:
- Wide
- No ball
- Dead ball

Implementation rule:
- An over progresses only when `isLegalDelivery = true`.
- An over closes after 6 legal balls unless a tournament rule overrides it.

### 9.3 Run Calculation Rules

Formula:
- `totalAdded = runsOffBat + extrasRuns`

Cases:
- Dot ball: no score change
- Single to six: bat runs only
- Bye and leg bye: extras only
- Wide: extras, not legal
- No ball: at least 1 extra, may also include bat runs
- Penalty runs: separate administrative event

### 9.4 Wicket Rules

Flow:
1. Capture wicket type
2. Determine legal-ball impact
3. Determine batter ball-faced impact
4. Determine bowler wicket credit
5. Determine fielder credit
6. Require new batter if innings continues

Bowler credited:
- Bowled
- Caught
- LBW
- Stumped
- Hit wicket

Bowler not credited:
- Run out
- Retired out
- Timed out
- Obstructing the field

### 9.5 Strike Rotation

Rules:
- Odd run movement swaps strike
- End of over swaps strike
- Wicket edge cases may need scorer override

### 9.6 Over Completion

On over completion:
- Freeze over summary
- Update bowler figures
- Swap strike
- Prompt for next bowler
- Increment over number

### 9.7 Innings Completion

An innings ends when:
- Team all out
- Overs completed
- Chasing side reaches target
- Match stopped or abandoned

On innings end:
- Lock innings snapshot
- Generate target if first innings
- Generate result if second innings is complete

### 9.8 Result Logic

Supported results:
- Won by runs
- Won by wickets
- Tie
- No result
- Abandoned

### 9.9 Recalculation Strategy

Recommended approach:
- Use incremental updates in live mode
- Use selective replay from the edited ball forward after edits
- Keep full recompute tooling for verification and admin repair

### 9.10 Undo and Edit

Mandatory features:
- Undo last ball
- Edit earlier ball
- Recompute all affected downstream state
- Persist audit log

Audit fields:
- `eventId`
- `previousData`
- `newData`
- `changedBy`
- `changedAt`
- `reason`

### 9.11 Validation Rules

Prevent:
- More than 11 players batting
- Duplicate striker and non-striker
- Wicket without player-out reference
- Innings continuing after all out
- Chase continuing after target reached
- Negative scores
- Duplicate ball sequence IDs

Warn but allow override for:
- Unusual run-out crossing cases
- Local-rule edge cases
- Striker swap ambiguity

## 10. Derived Statistics Contracts

After every committed ball event, update:

### 10.1 Match Scoreboard
- Total runs
- Wickets
- Overs
- Current run rate
- Target and required rate

### 10.2 Batter Stats
- Runs
- Balls faced
- Fours
- Sixes
- Strike rate
- Dismissal state

### 10.3 Bowler Stats
- Overs
- Maidens
- Runs conceded
- Wickets
- Economy

### 10.4 Team Innings Stats
- Extras
- Boundaries
- Partnerships
- Fall of wickets

### 10.5 Tournament Stats
- Player aggregate stats
- Team aggregate stats
- Points table after match completion

## 11. MVP Definition

Phase 1 MVP includes:
- Login and signup
- Role management
- League and tournament creation
- Team creation
- Player creation and assignment
- Fixture creation
- Match creation
- Toss handling
- Playing XI selection
- Live ball-by-ball scoring
- Scorecard generation
- Points table
- Basic stats dashboard
- Admin panel
- Public live score view

This is the release baseline for a first production version.

## 12. Delivery Priority

### Phase 1
- Authentication and roles
- Team and player management
- League and tournament setup
- Match scheduling
- Live scoring engine
- Scorecard
- Points table
- Basic stats

### Phase 2
- Venue module
- Umpire and scorer module
- Notifications
- Advanced reports
- Public fan-facing pages

### Phase 3
- Advanced analytics
- Offline scoring
- Media uploads
- AI insights
- Monetization modules if reintroduced later

## 13. Implementation Notes for This Repo

Current development should align to these priorities:
- Preserve existing scoring-first architecture
- Remove fee, billing, and subscription assumptions from roadmap docs and planning
- Prefer event-driven scoring state with explicit auditability
- Keep public viewer pages read-only
- Model tournament operations before optional commercial workflows

## 14. QA Priorities

Must-test scoring scenarios:
- Standard over with only legal deliveries
- Wides and no-balls in one over
- Wicket plus runs combinations
- Run out with crossed batters
- Undo last ball
- Edit earlier ball and replay state
- Innings ending by all out
- Innings ending by chase completion
- Points table update after match completion
- Reconnect and resync under poor network conditions
