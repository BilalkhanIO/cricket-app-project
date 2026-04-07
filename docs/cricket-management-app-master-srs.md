# Cricket Management App

## Master SRS, Feature, UX, Public Product, Pool System, and Live Scoring Specification

## 1. Introduction

### 1.1 Purpose

This document defines the complete requirements, features, and UX flows for the Cricket Management Application. The system supports tournament operations, live scoring, team and player management, analytics, public viewing, pool systems, and shareable media without payment or subscription modules.

### 1.2 Scope

The system provides:

- League and tournament management
- Team and player management
- Match scheduling and execution
- Live ball-by-ball scoring
- Scorecards and statistics
- Notifications and reporting
- Public no-login match, league, team, player, standings, and stats pages
- Pool and group-stage tournament support
- Share cards, banners, and public share links

## 2. System Overview

### 2.1 User Roles

- Super Admin
- League Admin
- Team Manager
- Scorer
- Umpire
- Player
- Viewer

### 2.2 Platforms

- Mobile App (Android and iOS)
- Web Admin Panel
- Public Web Viewer

## 3. Functional Requirements

### 3.1 Authentication

- User registration by email or phone
- Login and logout
- Password reset
- Role-based access control

### 3.2 League Management

- Create, edit, and delete leagues
- Define format such as knockout, round robin, pool stage, or custom structures
- Add teams
- Generate fixtures
- Manage standings

### 3.3 Team Management

- Create team
- Add and remove players
- Assign captain
- Manage squad

### 3.4 Player Management

- Player profile
- Batting and bowling skill metadata
- Stats tracking

### 3.5 Match Management

- Schedule matches
- Assign venue
- Assign officials
- Toss handling
- Publish results

### 3.6 Live Scoring

- Ball-by-ball input
- Runs, wickets, extras
- Strike rotation
- Over management
- Undo and edit actions

### 3.7 Scorecards

- Batting stats
- Bowling stats
- Match summary

### 3.8 Points Table

- Automatic calculation
- Ranking
- Net run rate

### 3.9 Statistics

- Top players
- Team stats
- Match insights

### 3.10 Notifications

- Match reminders
- Live updates
- Results

## 4. Non-Functional Requirements

### 4.1 Performance

- Real-time updates should arrive within 2 seconds under normal conditions

### 4.2 Scalability

- Support thousands of matches

### 4.3 Security

- JWT or equivalent token-based authentication
- Role-based permissions

### 4.4 Availability

- 99.9% uptime target

## 5. System Architecture

- Frontend: Flutter or React Native for mobile, web frontend for admin and public viewer
- Backend: Node.js or Django
- Database: PostgreSQL
- Realtime: WebSockets

## 6. Database Design

### 6.1 High-Level Core Entities

- Users
- Roles
- Leagues
- Teams
- Players
- Matches
- Innings
- Overs
- Balls
- Stats

### 6.2 Core Relationships

- League to Teams
- Team to Players
- Match to Innings to Overs to Balls

## 7. API Structure

- `/auth`
- `/users`
- `/leagues`
- `/teams`
- `/players`
- `/matches`
- `/scoring`
- `/stats`

## 8. UX Flow Design

### 8.1 User Flow

1. User login
2. Dashboard
3. Select league
4. View teams or matches
5. Start match or view match

### 8.2 Scorer Flow

1. Select match
2. Enter toss
3. Select playing XI
4. Start innings
5. Ball-by-ball scoring
6. End innings
7. Complete match

### 8.3 Viewer Flow

1. Open app
2. View live matches
3. View scorecard
4. Check stats

## 9. Core Screens

- Login and Signup
- Dashboard
- League List
- League Details
- Team Profile
- Player Profile
- Match Center
- Live Scoring Screen
- Scorecard Screen
- Points Table
- Stats Dashboard

## 10. Live Scoring UI Design

Core components:

- Scoreboard with runs, wickets, and overs
- Current batsmen
- Current bowler
- Action buttons for runs and wicket
- Extras actions
- Commentary log

## 11. Development Phases

### 11.1 Phase 1 MVP

- Auth
- Teams and Players
- League creation
- Match scheduling
- Live scoring
- Scorecard
- Points table

### 11.2 Phase 2

- Notifications
- Officials
- Venue module
- Public viewer

### 11.3 Phase 3

- Advanced analytics
- Offline scoring

### 11.4 Future Enhancements

- Payments
- Sponsorships
- AI insights
- Video highlights

## 12. Information Architecture

### 12.1 Mobile Navigation

- Home
- Leagues
- Matches
- Teams
- Stats
- Notifications
- Profile

### 12.2 Admin Web Navigation

- Dashboard
- Leagues
- Teams
- Players
- Matches
- Venues
- Officials
- Reports
- Settings

## 13. Screen Specifications

### 13.1 Splash Screen

- Centered logo
- Tagline
- Loading indicator

### 13.2 Login Screen

- Email or phone
- Password
- Forgot password
- Login
- Signup

### 13.3 Signup Screen

- Name
- Email or phone
- Password
- Confirm password
- Role selector if permitted

### 13.4 Home Dashboard

- Profile and notifications in top bar
- Quick summary cards
- Quick actions
- Recent activity

### 13.5 League List Screen

- Search
- Active, upcoming, completed filters
- League cards with format, season, and team count

### 13.6 League Details Screen

- Header
- Tabs for overview, teams, fixtures, standings, stats, and rules
- Tournament action shortcuts

### 13.7 Team List and Team Profile

- Team cards and public team identity
- Squad tab
- Match tab
- Stats tab
- Records tab

### 13.8 Player Profile

- Overview
- Batting stats
- Bowling stats
- Match history

### 13.9 Fixture List

- Date selector
- League, venue, and status filters
- Match cards

### 13.10 Match Center

- Match header
- Summary
- Scorecard
- Commentary
- Playing XI
- Stats

### 13.11 Toss and Lineup Screen

- Toss winner
- Decision
- XI selection
- Captain and wicketkeeper markers

### 13.12 Live Scoring Screen

Required sections:

- Sticky match header
- Score summary panel
- Batting panel
- Bowling panel
- Run action grid
- Extras actions
- Wicket action
- Undo
- End innings
- Recent balls
- Commentary feed

### 13.13 Wicket Modal

- Wicket type
- Player out
- Fielder
- New batsman
- Runs completed for run out cases

### 13.14 Extras Modal

- Extra type
- Extra runs
- Bat runs on no-ball where applicable

### 13.15 End Over Modal

- Over summary
- New bowler selection
- Strike confirmation

### 13.16 Innings Break Screen

- First innings summary
- Target
- Highlights

### 13.17 Scorecard Screen

- Match summary
- Innings tabs
- Batting table
- Bowling table
- Extras
- Fall of wickets
- Partnership summary
- Result summary
- Awards

### 13.18 Points Table Screen

- Pool selector
- Standard points table columns
- Qualification markers

### 13.19 Stats Dashboard

- Filters
- Top runs
- Top wickets
- Best strike rate
- Best economy
- Team performance

### 13.20 Notification Center

- Tabs by type
- Read and unread state

### 13.21 Profile and Settings

- User details
- Role information
- Preferences
- Logout

## 14. Public Product

### 14.1 Public Experience Goals

The public viewer experience is a core growth channel. It should:

- work without login
- act as the official league face
- support result sharing
- increase discoverability
- provide trusted score information quickly

### 14.2 Public User Types

- Casual fan
- Player checking stats
- Team manager sharing results
- Organizer promoting tournament
- Sponsor checking visibility
- Social visitors landing from shared pages

### 14.3 Public Product Areas

1. Public home and discovery
2. Public league microsite
3. Public live match center
4. Public result and scorecard pages
5. Public team pages
6. Public player pages
7. Public standings and stats pages
8. Public share pages and media assets

### 14.4 Public Routing

- `/`
- `/leagues`
- `/league/:slug`
- `/matches/:slug/live`
- `/matches/:slug/result`
- `/teams/:slug`
- `/players/:slug`
- `/standings/:leagueSlug`
- `/stats/:leagueSlug`

### 14.5 Public Page Requirements

#### Public Home

- Featured live matches
- Upcoming matches
- Recent results
- Featured leagues
- Top performers
- Search

#### Public League Page

- Overview
- Fixtures
- Standings
- Teams
- Stats
- Results
- Rules

#### Public Live Match Page

- Sticky live score header
- Current batters and bowler
- Recent balls
- Commentary
- Scorecard tab
- Playing XI tab
- Stats tab
- Share actions

#### Public Result Page

- Result banner
- Winner summary
- Man of the Match
- Scorecard
- Key moments
- Share and download actions

#### Public Team Page

- Team identity
- Squad
- Fixtures
- Results
- Team stats

#### Public Player Page

- Public profile
- Batting and bowling role
- Stats summary
- Match history
- Awards

#### Public Standings and Stats

- Pool selector
- Stage selector
- Qualification legend
- Filters by tournament, pool, team, and stage

## 15. Pool and Group Stage System

### 15.1 Objectives

Support:

- Single pool round robin
- Multi-pool round robin
- Pool plus semifinals plus final
- Pool plus quarterfinals plus semifinals plus final
- Custom qualification rules

### 15.2 Pool Configuration

League admins can:

- create pools
- assign pool names
- configure team counts
- auto-distribute or manually assign teams
- define qualifiers per pool
- define tie-break order

### 15.3 Pool Fields

- `pool_id`
- `league_id`
- `pool_name`
- `pool_code`
- `number_of_teams`
- `qualification_slots`
- `sort_order`

### 15.4 Pool Fixtures and Standings

- Generate round robin fixtures inside each pool
- Keep separate pool standings
- Track qualification state:
  - Qualified
  - Eliminated
  - Pending

### 15.5 Tie-Break Order

1. Points
2. Net run rate
3. Head-to-head
4. Total wins
5. Admin decision or custom fallback

### 15.6 Knockout Mapping

Support preset or manual mapping such as:

- Pool A #1 vs Pool B #2
- Pool B #1 vs Pool A #2

### 15.7 Public Pool UX

Public users must quickly understand:

- which pool a team is in
- current rank
- remaining matches
- qualification scenarios
- likely knockout mapping

## 16. Share Cards, Banners, and Media Generator

### 16.1 Objective

Generate polished social assets for:

- Match result
- Man of the Match
- Toss result
- Upcoming fixture
- Live score
- Points table snapshot
- Top performer
- Winner celebration
- Player milestone

### 16.2 Template Requirements

Each template should support:

- data binding from match, league, or player state
- league branding
- theme selection
- aspect ratio selection
- export to image
- public share link

### 16.3 Supported Ratios

- Square
- Portrait
- Landscape

### 16.4 Share Flow

1. Open match, league, or player page
2. Tap Share
3. Select template
4. Preview
5. Download image or copy public URL

### 16.5 Template Engine Requirements

- Pull current match, team, and player data
- Render into predefined templates
- Handle missing player photos gracefully
- Store generated asset metadata for reuse

## 17. Live Scoring System Logic

### 17.1 Core Principles

- Every scoring action is event-driven
- Each ball creates an immutable event record
- Corrections are stored through reversal or edit logs
- Derived stats remain consistent across scoreboard, scorecard, standings, and public pages

### 17.2 Match States

- Scheduled
- Toss Pending
- Ready to Start
- Live Innings 1
- Innings Break
- Live Innings 2
- Completed
- Abandoned
- Postponed

### 17.3 Innings States

- Not Started
- Live
- Completed
- All Out
- Overs Completed
- Target Reached
- Declared

### 17.4 Ball Event Model

Each delivery must include:

- `match_id`
- `innings_no`
- `over_no`
- `ball_index`
- `striker_id`
- `non_striker_id`
- `bowler_id`
- `delivery_type`
- `runs_off_bat`
- `extras_type`
- `extras_runs`
- `is_legal_delivery`
- `wicket_flag`
- `wicket_type`
- `player_out_id`
- `fielder_id`
- `commentary_text`
- `created_by`
- `created_at`
- `edited_flag`
- `revision_no`

### 17.5 Delivery Types

- Normal
- Wide
- No Ball
- Bye
- Leg Bye
- Dead Ball
- Penalty

### 17.6 Legal Ball Logic

Counts as legal:

- Normal delivery
- Byes and leg byes on legal delivery
- Wicket on legal delivery

Does not count as legal:

- Wide
- No ball
- Dead ball

### 17.7 Wicket Logic

The system must determine:

- legal-ball impact
- ball faced impact
- bowler credit
- fielder credit
- replacement batter requirement

Bowler gets credit for:

- Bowled
- Caught
- LBW
- Stumped
- Hit wicket

Bowler does not get credit for:

- Run out
- Retired out
- Timed out
- Obstructing the field

### 17.8 Strike Rotation

- Odd run movement swaps strike
- End of over swaps strike
- Wicket edge cases allow scorer override

### 17.9 Over Completion

After 6 legal balls:

- freeze over summary
- update bowler figures
- swap strike
- select next bowler

### 17.10 Innings Completion

An innings ends when:

- all out
- overs completed
- target reached
- declared or stopped if supported

### 17.11 Match Result Logic

Support:

- won by runs
- won by wickets
- tie
- no result
- abandoned
- super over later

### 17.12 Derived Statistics Updates

After every ball, update:

- scoreboard totals
- batter stats
- bowler stats
- innings extras
- partnerships
- fall of wickets
- tournament aggregates

### 17.13 Undo and Edit

Mandatory support:

- Undo last ball
- Edit earlier ball
- Replay state forward from the edit point
- Persist audit record with old and new values

### 17.14 Recalculation Strategy

Recommended:

- incremental live updates
- selective replay after edits
- full recompute utility for verification or repair

### 17.15 Realtime Sync

When a ball is saved:

1. Validate
2. Persist event
3. Update aggregates transactionally
4. Broadcast via websocket
5. Update public pages

### 17.16 Validation Rules

Prevent:

- more than 11 players batting
- duplicate striker and non-striker
- innings continuing after completion
- target chase continuing after win
- illegal duplicate balls
- negative scores

Warn on:

- unusual run-out crossing cases
- scorer ambiguity
- local-rule edge cases

### 17.17 Offline-Ready Design

Design now for future offline scoring:

- local queue
- temporary event IDs
- sync reconciliation
- scorer device as source of truth unless admin override

### 17.18 Core Scoring Tables

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

### 17.19 Example QA Cases

- Legal-ball over
- Wides and no-balls in same over
- Wicket plus runs
- Run out with crossed batters
- Undo last ball
- Edit earlier ball and replay
- Innings ending by all out
- Innings ending by chase
- Points table update after completion
- Reconnect and resync under poor network

## 18. End-to-End User Flows

### 18.1 Public Fan Flow

1. Land on homepage
2. Open live match
3. Check commentary and scorecard
4. Share live page
5. Return for result page

### 18.2 League Admin Flow

1. Create league
2. Configure pools
3. Add teams
4. Generate fixtures
5. Assign scorer
6. Match completes
7. Standings update
8. Share official result card

### 18.3 Team Manager Flow

1. Open team page
2. Check fixture
3. Confirm lineup
4. View live score
5. Share result or MOM card

### 18.4 Scorer Flow

1. Open assigned match
2. Record toss
3. Confirm XI
4. Score every ball
5. Undo or edit if needed
6. End innings and complete match
7. Publish result publicly

## 19. Conclusion

This master specification covers:

- tournament operations
- public no-login product surfaces
- pool and group-stage support
- media and share generation
- live scoring behavior and rules
- end-to-end user journeys

The next execution layers derived from this document are:

1. Database schema and migration plan
2. REST and realtime API contracts
3. Admin, scorer, and public screen implementation
4. Shared component design system
5. Engineering module breakdown and delivery sequencing
