# Revised Scope Implementation Backlog

This backlog translates the revised cricket-operations product scope into concrete implementation work for the current Next.js project.

Canonical product reference:
- [cricket-management-app-master-srs.md](/home/kwikcoders/bilal-ahmad/cricket-app-project/docs/cricket-management-app-master-srs.md)

## 1. Core Corrections

### 1.1 Standings and Results
- Verify all match completion paths use the same standings update flow.
- Handle `TIE`, `NO_RESULT`, `ABANDONED`, and postponed-result edge cases consistently.
- Add regression coverage for cumulative NRR updates after multiple completed matches.

### 1.2 Scoring Engine Auditability
- Extend `BallEvent` to store striker, non-striker, legal-delivery flag, editor metadata, revision number, and correction source.
- Add ball-edit endpoints for earlier-ball correction and selective replay from the edited point forward.
- Persist explicit event audit logs instead of relying only on match-level audit rows.
- Store derived partnerships, wicket events, and commentary events separately from raw ball events.

## 2. Data Model Realignment

### 2.1 Remove Registration-First Product Assumptions
- Phase out `registrationFeeStatus` from active workflows.
- Replace `PlayerLeagueRegistration` and approval-heavy flows with direct league team assignment and roster management.
- Remove registration-window messaging from home, league, and admin views that still present it as a primary feature.

### 2.2 Role Model Cleanup
- Normalize active roles to:
  - `SUPER_ADMIN`
  - `LEAGUE_ADMIN`
  - `TEAM_MANAGER`
  - `SCORER`
  - `UMPIRE`
  - `PLAYER`
  - `VIEWER`
- Decide whether legacy roles remain as internal aliases or are fully migrated.
- Update dashboard routing and permission helpers to match the final role set.

### 2.3 Officials and Venues
- Convert `MatchOfficial` from free-text assignment to a profile-backed model.
- Add official history and assignment reporting.
- Expand venue detail pages with match history and pitch metadata.

## 3. Admin Panel Work

### 3.1 Navigation and Surface Area
- Add dedicated admin areas for officials and reports.
- Reduce league-management screens that currently focus on approvals and registration handling.
- Add operational tournament actions:
  - assign teams
  - generate fixtures
  - manage standings overrides
  - assign officials

### 3.2 Reports
- Add tournament summary KPIs.
- Add team performance reports.
- Add player performance reports.
- Add match reports for completed games.

## 4. Public and Viewer Experience

### 4.1 Public Viewer
- Keep public pages read-only and scoring-synchronized.
- Add clearer public live score entry points from home and league hubs.
- Add team-vs-team head-to-head summaries where data exists.
- Split public live and public result routes cleanly.
- Add public standings routes by league and pool.
- Add public match share metadata and stable share URLs.

### 4.2 Stats Expansion
- Add leaderboards for:
  - batting average
  - strike rate
  - economy
  - head-to-head
  - team performance
- Add filtering by tournament, team, venue, and season.

### 4.3 Share Cards and Media
- Add media template definitions for result, live score, MOM, standings snapshot, and fixture cards.
- Add asset generation service and metadata storage.
- Add public share page support for result, MOM, player highlights, and standings snapshots.

## 5. Tournament Structures

### 5.1 Pool and Group Support
- Add pool entities and pool-team assignment support.
- Add pool-based fixture generation.
- Add per-pool standings tables.
- Add qualification state and knockout mapping support.
- Add public pool standings and qualification views.

## 6. QA Priorities

### 6.1 Match Outcome and Points Table
- Win by wickets
- Win by runs
- Tie
- No result
- Abandoned
- Repeated completion requests should not double-apply standings

### 6.2 Scoring
- Wides and no-balls in the same over
- Wicket with extras
- Undo latest ball
- Edit earlier ball and replay downstream state
- Innings break to second innings transition
- Target reached before over completion

### 6.3 Permissions
- Only assigned scorer can score
- Team manager can manage own team only
- League admin can manage league operations only within expected boundaries

### 6.4 Public and Share Surfaces
- Public live page realtime refresh
- Public result page permanence
- Pool standings accuracy
- Share card generation with missing-image fallbacks

## 7. Recommended Next Implementation Order

1. Finish standings/result consistency across all API paths.
2. Remove registration-heavy admin and public workflows.
3. Normalize roles and permission helpers.
4. Upgrade the scoring event model for edit/replay/audit.
5. Add public live/result route split and share metadata.
6. Add officials/reporting modules.
7. Add pool/group data model and standings logic.
8. Add media/share-card generation.
9. Expand public stats and head-to-head reporting.
