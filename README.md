# 🏏 Cricket League App

A full-stack cricket league management platform built with **Next.js 15**, **Tailwind CSS**, **Prisma ORM**, and **NextAuth.js**.

## Features

### Public Pages
- 🏆 Browse leagues and tournaments
- ⚡ Live scores (auto-refresh every 5s)
- 📅 Upcoming fixtures & results
- 📊 Points tables with NRR
- 👤 Player profiles & career statistics
- 👕 Team profiles & squads
- 📢 Announcements and news
- 🏏 Player leaderboards (runs, wickets, sixes)

### Admin Panel (`/admin`)
- 📋 Dashboard with real-time stats
- 🏆 Create & manage leagues (Round Robin, Knockout, etc.)
- 👕 Team registration & approval workflow
- 🏏 Player management
- 📅 Match scheduling with venue assignment
- 🏟️ Venue management
- 📢 Post announcements

### Scorer Panel (`/scorer/[matchId]`)
- 🪙 Toss recording
- 👥 Playing XI selection
- 🎯 Ball-by-ball live scoring
- 🔴 Wicket recording with dismissal types
- ⚡ Extras (wide, no-ball, bye, leg-bye)
- 📊 Auto-generated batting/bowling scorecards
- 🏆 Match completion with points table update

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router |
| Styling | Tailwind CSS |
| Database | SQLite via Prisma ORM v5 |
| Authentication | NextAuth.js v4 |
| Language | TypeScript |
| Server | API Routes (Next.js) |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
# Edit .env if needed (DATABASE_URL and NEXTAUTH_SECRET are pre-configured)

# 3. Run database migrations
npx prisma migrate dev

# 4. Start the dev server
npm run dev
```

Open http://localhost:3000

## Seed Demo Data

After starting the server, seed demo data:

```bash
curl -X POST http://localhost:3000/api/seed
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@cricket.app | admin123 |
| League Admin | leagueadmin@cricket.app | league123 |
| Team Manager | manager1@cricket.app | manager123 |
| Scorer | scorer@cricket.app | scorer123 |
| Player | player1@cricket.app | player123 |

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard & management
│   ├── api/             # REST API routes
│   │   ├── auth/        # NextAuth + register
│   │   ├── leagues/     # League CRUD
│   │   ├── matches/     # Match management
│   │   ├── players/     # Player management
│   │   ├── scoring/     # Live scoring APIs
│   │   ├── stats/       # Statistics & leaderboards
│   │   ├── teams/       # Team management
│   │   ├── venues/      # Venue management
│   │   └── seed/        # Demo data seeder
│   ├── home/            # Public home page
│   ├── leagues/         # League list & detail
│   ├── matches/         # Match list & scorecard
│   ├── players/         # Player list & profile
│   ├── scorer/          # Live scoring panel
│   ├── stats/           # Statistics page
│   └── teams/           # Team list & profile
├── components/
│   ├── layout/          # Navbar, Footer
│   └── ui/              # Badge, Button, Card, Input
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   ├── prisma.ts        # Prisma client singleton
│   └── utils.ts         # Utility functions & constants
└── types/
    └── next-auth.d.ts   # Type extensions
```

## Database Schema

Key entities: User, League, Team, TeamLeague, Player, Venue, Match, Innings, Over, BallEvent, BattingScorecard, BowlingScorecard, PointsTable, PlayerStats, Notification, Announcement, Award, AuditLog

## User Roles & Permissions

| Role | Access |
|------|--------|
| SUPER_ADMIN | Full platform access |
| LEAGUE_ADMIN | Manage own leagues |
| TEAM_MANAGER | Manage own team |
| SCORER | Live match scoring |
| PLAYER | View own stats |
| FAN | Public content |
