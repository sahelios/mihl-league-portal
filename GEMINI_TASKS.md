# MIHL League Portal - Gemini Pro Tasks

## Available Tasks for Gemini Pro

These tasks are ready to be assigned to Gemini Pro. Each task is self-contained and follows the project's established patterns.

---

## TASK 1: Database Seeding Script

**Difficulty:** Easy  
**Time:** 15-20 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, seed-db.mjs (existing template)

**Prompt:**

```
You are a Node.js developer for the MIHL League Portal project.

TASK: Update and complete `/home/ubuntu/mihl-league-portal/seed-db.mjs` to populate the database with initial data.

REQUIREMENTS:

1. **Connection Setup:**
   - Parse DATABASE_URL from environment
   - Use mysql2/promise for connections
   - Handle SSL for cloud databases

2. **Data to Seed:**
   - 1 Active Season: "2026 Summer Season" (June 23 - August 31, 2026)
   - 4 Teams with logos and colors:
     * Iron Lions (Navy/Silver)
     * Golan Guards (Navy/Silver)
     * H Hammers (Navy/Silver)
     * Schvitz Saints (Navy/Silver)
   - 2 Game Venues:
     * Samuel Moscovitch Arena
     * Outremont Arena
   - 10 Sample Games (mix of scheduled and completed)
   - 5 Sample News Posts
   - 3 Sample Player Registrations (approved)

3. **Validation:**
   - Check if data already exists before inserting
   - Print success/error messages for each operation
   - Handle duplicate key errors gracefully

4. **Output:**
   - Console log: "✓ Season created"
   - Console log: "✓ Teams created"
   - Console log: "✓ Games created"
   - Console log: "✓ News posts created"
   - Console log: "✓ Seeding complete"

IMPORTANT:
- Use the schema field names exactly as defined in drizzle/schema.ts
- All dates should be Date objects
- Use the correct table names from schema
- Handle errors with try/catch
```

---

## TASK 2: Schedule & Results Page

**Difficulty:** Medium  
**Time:** 25-30 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, Dashboard.tsx, Games.tsx, Registration.tsx

**Prompt:**

```
You are a React/TypeScript developer for the MIHL League Portal project.

TASK: Create `/client/src/pages/Schedule.tsx` - a public Schedule & Results page

REQUIREMENTS:

1. **Page Structure:**
   - Hero section with "Schedule & Results" title
   - Filter tabs: "Upcoming" | "Completed" | "All"
   - Game list with cards showing:
     * Date and time
     * Team A vs Team B
     * Venue
     * Status badge (Scheduled/Completed)
     * Score (if completed)

2. **Features:**
   - Fetch games from trpc.league.getSchedule
   - Filter games by status
   - Sort by date (upcoming first)
   - Show "No games scheduled" message when empty
   - Responsive grid layout

3. **Styling:**
   - Use shadcn/ui Card, Badge, Button components
   - Tailwind classes: bg-background, text-foreground, text-muted-foreground
   - Mobile-first responsive design
   - Hover effects on game cards

4. **Bilingual Support:**
   - All labels in English and French
   - Language toggle in top right
   - Translations for: "Schedule", "Results", "Upcoming", "Completed", "Venue", "vs"

5. **Data Display:**
   - Game date in format: "Tuesday, June 24, 2026"
   - Time in 12-hour format with AM/PM
   - Team names from database
   - Score display: "3 - 2" format

REFERENCE FILES:
- GEMINI_REFERENCE.md: Complete patterns
- Dashboard.tsx: Admin page structure
- Games.tsx: Admin game management
- Registration.tsx: Bilingual implementation

IMPORTANT:
- Follow Dashboard.tsx patterns for layout
- Use only shadcn/ui components
- Mobile-first responsive design
- All text bilingual
```

---

## TASK 3: Standings Page Enhancement

**Difficulty:** Easy  
**Time:** 15-20 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, Standings.tsx (existing)

**Prompt:**

```
You are a React/TypeScript developer for the MIHL League Portal project.

TASK: Update `/client/src/pages/Standings.tsx` to fetch real data from tRPC

REQUIREMENTS:

1. **Current State:**
   - Page exists with sample data
   - Shows team standings table

2. **Updates Needed:**
   - Replace sample data with trpc.league.getTeams query
   - Fetch team stats from database
   - Sort by points (descending), then wins (descending)
   - Calculate standings from team stats

3. **Table Columns:**
   - Team Name (with logo)
   - Wins (W)
   - Losses (L)
   - Ties (T)
   - Goals For (GF)
   - Goals Against (GA)
   - Points (Pts)

4. **Features:**
   - Loading skeleton while fetching
   - Error message if data fails to load
   - Responsive table (horizontal scroll on mobile)
   - Color-coded rows (alternating)

5. **Bilingual:**
   - All column headers in EN/FR
   - Language toggle

REFERENCE:
- GEMINI_REFERENCE.md: Data fetching patterns
- Standings.tsx: Current implementation

IMPORTANT:
- Use trpc.league.getTeams for data
- Handle loading and error states
- Mobile-responsive table
```

---

## TASK 4: Stats Page Enhancement

**Difficulty:** Easy  
**Time:** 15-20 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, Stats.tsx (existing)

**Prompt:**

```
You are a React/TypeScript developer for the MIHL League Portal project.

TASK: Update `/client/src/pages/Stats.tsx` to fetch real player statistics

REQUIREMENTS:

1. **Current State:**
   - Page exists with sample player data
   - Shows player stats table

2. **Updates Needed:**
   - Replace sample data with trpc.league.getPlayerStats query
   - Fetch approved player registrations
   - Calculate stats from database
   - Sort by points (descending)

3. **Table Columns:**
   - Player Name
   - Team
   - Position
   - Games Played (GP)
   - Goals (G)
   - Assists (A)
   - Points (Pts)
   - Rating

4. **Features:**
   - Loading skeleton while fetching
   - Error message if data fails
   - Responsive table (horizontal scroll on mobile)
   - Highlight top 3 scorers

5. **Bilingual:**
   - All labels in EN/FR
   - Language toggle

REFERENCE:
- GEMINI_REFERENCE.md: Data fetching patterns
- Stats.tsx: Current implementation

IMPORTANT:
- Use trpc.league.getPlayerStats for data
- Handle loading/error states
- Mobile-responsive table
```

---

## TASK 5: Suspensions Page Enhancement

**Difficulty:** Easy  
**Time:** 15-20 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, Suspensions.tsx (existing)

**Prompt:**

```
You are a React/TypeScript developer for the MIHL League Portal project.

TASK: Update `/client/src/pages/Suspensions.tsx` to fetch real suspension data

REQUIREMENTS:

1. **Current State:**
   - Page exists with sample suspension data
   - Shows active and past suspensions

2. **Updates Needed:**
   - Replace sample data with trpc.admin.getActiveSuspensions query
   - Fetch all suspensions (active and past)
   - Filter into two sections: Active | Past
   - Sort by date (newest first)

3. **Display:**
   - Active Suspensions section (red badge)
   - Past Suspensions section (gray badge)
   - For each suspension show:
     * Player name
     * Team
     * Reason
     * Start date
     * End date (if applicable)
     * Games remaining

4. **Features:**
   - Loading state while fetching
   - Error message if data fails
   - Empty state message
   - Responsive layout

5. **Bilingual:**
   - All labels in EN/FR
   - Language toggle

REFERENCE:
- GEMINI_REFERENCE.md: Data fetching patterns
- Suspensions.tsx: Current implementation

IMPORTANT:
- Use trpc.admin.getActiveSuspensions
- Separate active from past
- Mobile-responsive design
```

---

## TASK 6: Vitest Unit Tests

**Difficulty:** Medium  
**Time:** 30-40 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, admin.test.ts (existing), auth.logout.test.ts (reference)

**Prompt:**

```
You are a TypeScript/Vitest developer for the MIHL League Portal project.

TASK: Create comprehensive unit tests in `/server/routers/admin.test.ts`

REQUIREMENTS:

1. **Test Structure:**
   - Use Vitest framework
   - Mock database calls
   - Test both success and error cases
   - Follow auth.logout.test.ts pattern

2. **Procedures to Test:**
   - getUpcomingGames (should return scheduled games)
   - getRecentGames (should return completed games)
   - submitGameScore (should update game with score)
   - createNewsPost (should create post)
   - deleteNewsPost (should remove post)
   - selectStars (should update stars of week)
   - addSuspension (should create suspension)
   - createSeason (should create new season)
   - createTeam (should create team)
   - createVenue (should create venue)

3. **Test Cases Per Procedure:**
   - Success case (happy path)
   - Error case (database error)
   - Validation error (invalid input)
   - Authorization error (non-admin user)

4. **Mocking:**
   - Mock getDb() to return test database
   - Mock database queries
   - Mock error scenarios

5. **Assertions:**
   - Verify correct data returned
   - Verify database called with correct parameters
   - Verify error messages
   - Verify authorization checks

REFERENCE:
- GEMINI_REFERENCE.md: Test patterns
- auth.logout.test.ts: Example test structure

IMPORTANT:
- Use Vitest syntax (describe, it, expect)
- Mock database properly
- Test both success and error paths
- Follow existing test patterns
```

---

## TASK 7: Email Notification System

**Difficulty:** Medium  
**Time:** 25-30 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, registration.ts (existing)

**Prompt:**

```
You are a Node.js/TypeScript developer for the MIHL League Portal project.

TASK: Implement email notification system in `/server/_core/email.ts`

REQUIREMENTS:

1. **Email Types:**
   - Registration confirmation (to player)
   - Registration approved (to player)
   - Registration rejected (to player)
   - New registration alert (to admin)
   - Game score updated (to teams)
   - Suspension notice (to player)

2. **Email Templates:**
   - Professional HTML templates
   - Bilingual support (EN/FR)
   - Include league logo
   - Include contact information

3. **Implementation:**
   - Create sendEmail function
   - Support both HTML and plain text
   - Include error handling
   - Log all sent emails
   - For now: console.log instead of actual SMTP

4. **Email Content:**
   - Registration confirmation: player name, registration type, deadline
   - Approval: confirmation message, next steps
   - Rejection: reason, contact info
   - Admin alert: player details, registration type
   - Game score: teams, final score, stats
   - Suspension: reason, duration, contact

5. **Bilingual:**
   - All emails in both EN and FR
   - Language based on user preference

REFERENCE:
- GEMINI_REFERENCE.md: Project patterns
- registration.ts: Current email placeholders

IMPORTANT:
- Create reusable email templates
- Support bilingual content
- Include error handling
- Log all emails (console for now)
- Professional formatting
```

---

## TASK 8: Upcoming Games Slider Component

**Difficulty:** Medium  
**Time:** 20-25 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, UpcomingGamesSlider.tsx (existing)

**Prompt:**

```
You are a React/TypeScript developer for the MIHL League Portal project.

TASK: Update `/client/src/components/UpcomingGamesSlider.tsx` to fetch real data

REQUIREMENTS:

1. **Current State:**
   - Component exists with sample data
   - Shows 2-week forecast of games

2. **Updates Needed:**
   - Replace sample data with trpc.league.getUpcomingGames query
   - Fetch games for next 14 days
   - Auto-refresh every 5 minutes
   - Show loading skeleton

3. **Display:**
   - Horizontal scrollable slider
   - Game cards showing:
     * Date (e.g., "Tuesday, June 24")
     * Time (e.g., "9:30 PM")
     * Team A vs Team B
     * Venue
     * Status badge
   - Navigation arrows (prev/next)
   - Mobile-friendly swipe support

4. **Features:**
   - Loading state with skeleton
   - Error state with retry button
   - Empty state if no games
   - Responsive on all screen sizes
   - Smooth scrolling animation

5. **Bilingual:**
   - Date format respects language
   - All labels in EN/FR

REFERENCE:
- GEMINI_REFERENCE.md: Component patterns
- UpcomingGamesSlider.tsx: Current implementation

IMPORTANT:
- Use trpc.league.getUpcomingGames
- Auto-refresh every 5 minutes
- Mobile-friendly slider
- Show loading/error states
```

---

## How to Use These Tasks

1. **Choose a task** from the list above
2. **Attach the reference files** listed in "Files to Attach"
3. **Copy the exact prompt** provided
4. **Paste into Gemini Pro**
5. **Wait for code generation**
6. **Copy the generated code** and save to the correct file path
7. **Test in dev server**

---

## Reference Files Needed

All tasks require: **GEMINI_REFERENCE.md**

Some tasks also require specific component examples. These are already in the project at:
- `/client/src/pages/admin/Games.tsx`
- `/client/src/pages/admin/Dashboard.tsx`
- `/client/src/pages/Registration.tsx`
- `/server/routers/admin.ts`
- `/server/routers/registration.ts`

You can attach these directly from the project when needed.
