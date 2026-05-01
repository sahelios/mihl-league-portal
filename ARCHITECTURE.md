# MIHL Architecture & Design Plan

## Reference Site Analysis (HockeySync)

**Key Components Observed:**
- Top navigation bar with dark background (navy/black)
- Horizontal scrollable game slider showing upcoming/past games with scores
- League logo + title section
- Standings table with team rankings
- Point leaders section (Goals & Points)
- Stars of the Week section with player avatars
- News/Stories section at bottom
- Footer with social links and company info

**Design Decisions for MIHL:**
- Color scheme: Navy blue (#1a1f3a) + Gold/Orange accent (#f59e0b) — professional sports league aesthetic
- Typography: Clean sans-serif (system fonts or Google Fonts)
- Layout: Responsive grid system, mobile-first approach
- Components: Reusable cards, tables, sliders using shadcn/ui + Tailwind

## Database Schema Overview

### Core Tables
1. **users** - Players and admin users (extended from template)
2. **teams** - The 4 teams (Iron Lions, Golan Guards, H Hammers, Schvitz Saints)
3. **seasons** - League seasons (starting with 2026 summer)
4. **games** - Scheduled games with venue, time, teams, scores
5. **game_venues** - Arena locations (Samuel Moscovitch, Outremont)
6. **player_registrations** - Pending/approved/rejected registrations
7. **player_teams** - Player-to-team assignments (many-to-many)
8. **player_stats** - Individual player stats (goals, assists, points)
9. **team_stats** - Team-level stats
10. **news_posts** - Blog/news content
11. **stars_of_week** - Weekly star selections
12. **suspensions** - Player suspension records
13. **messages** - Admin-to-player messages

### Key Fields
- Timestamps: All UTC-based Unix timestamps (milliseconds since epoch)
- Approvals: registration_status (pending/approved/rejected)
- Pricing: $350 individual, $6,500 team, $80 jersey/socks
- Season: June 23 – August 25, 2026
- Venues: Samuel Moscovitch (Tue 9:30–11 PM), Outremont (Thu 10–11:20 PM)

## Pages & Routes

### Public Pages
1. `/` - Home (news, blog, sliders)
2. `/league-rules` - League rules document
3. `/teams` - Team profiles with rosters
4. `/schedule` - Schedule & Results
5. `/stats` - Player statistics
6. `/suspensions` - Suspension list
7. `/standings` - Win/loss table
8. `/register` - Player registration form

### Admin Pages
1. `/admin` - Dashboard overview
2. `/admin/players` - Player management & approvals
3. `/admin/games` - Score entry & game management
4. `/admin/news` - News post management
5. `/admin/stars` - Stars of the Week selection
6. `/admin/suspensions` - Suspension management
7. `/admin/messages` - Messaging tool
8. `/admin/settings` - Seasons, teams, venues management

## Design Tokens

**Colors:**
- Primary: Navy (#1a1f3a)
- Accent: Gold (#f59e0b)
- Success: Green (#10b981)
- Danger: Red (#ef4444)
- Background: White (#ffffff)
- Text: Dark gray (#1f2937)

**Typography:**
- Headings: Bold, 24px–48px
- Body: Regular, 14px–16px
- Monospace: For stats/scores

**Spacing:**
- Base unit: 4px (Tailwind default)
- Padding: 16px, 24px, 32px
- Gaps: 8px, 16px, 24px

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px–1024px
- Desktop: > 1024px
