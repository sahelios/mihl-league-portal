# MIHL League Portal - Additional Gemini Pro Tasks

These 5 tasks complete the remaining high-priority features for the MIHL League Portal.

---

## TASK 9: Team Balancing Algorithm & Captain Selection

**Difficulty:** Hard  
**Time:** 40-50 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, balanceTeams.ts (existing), admin.ts (router)

**Prompt:**

```
You are a TypeScript developer for the MIHL League Portal project.

TASK: Fix and complete `/server/utils/balanceTeams.ts` - Team balancing algorithm for evaluation games

REQUIREMENTS:

1. **Algorithm Overview:**
   After 2 evaluation games, the system should:
   - Analyze all player ratings and performance
   - Balance 4 teams with roughly equal skill levels
   - Select team captains from interested players
   - Assign players to teams and positions

2. **Input Data:**
   - Array of approved player registrations with:
     * Player name, rating (1-10)
     * Position preference (forward/defenseman/goalie)
     * Captain interest (boolean)
     * Evaluation game performance (goals, assists)

3. **Balancing Logic:**
   - Divide players into 4 teams
   - Each team should have similar average rating
   - Distribute positions evenly (roughly 6-8 forwards, 3-4 defensemen, 1 goalie per team)
   - Assign captains from players who expressed interest
   - Ensure each team has at least 1 captain

4. **Output:**
   - Return 4 balanced teams with:
     * Team name
     * Captain name
     * Player roster with positions
     * Average team rating
     * Position breakdown

5. **Edge Cases:**
   - Handle fewer than 12 players (adjust team sizes)
   - Handle no captain interest (auto-assign highest-rated player)
   - Handle position imbalances (assign flexible players)
   - Validate input data

6. **Functions to Implement:**
   - balanceTeams(players: Player[]): Team[]
   - calculateTeamRating(team: Player[]): number
   - assignPositions(team: Player[], positions: string[]): void
   - selectCaptains(teams: Team[], captainCandidates: Player[]): void

REFERENCE:
- GEMINI_REFERENCE.md: Project patterns
- balanceTeams.ts: Current implementation (needs fixes)
- admin.ts: Integration point

IMPORTANT:
- Use TypeScript with proper typing
- Handle edge cases gracefully
- Include error handling
- Add console logging for debugging
- Make algorithm deterministic (same input = same output)
```

---

## TASK 10: Blog Management Page

**Difficulty:** Medium  
**Time:** 25-30 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, News.tsx (reference), Dashboard.tsx (reference)

**Prompt:**

```
You are a React/TypeScript developer for the MIHL League Portal project.

TASK: Create `/client/src/pages/admin/Blog.tsx` - Blog post management page

REQUIREMENTS:

1. **Page Structure:**
   - Two sections: "Create Blog Post" form | "Existing Posts" list
   - Tab navigation: "All Posts" | "Published" | "Draft"

2. **Create Blog Post Form:**
   - Title input (required)
   - Author input (auto-filled with current user)
   - Content textarea (rich text or markdown)
   - Featured image URL input
   - Category dropdown (News, Tips, Updates, Other)
   - Status: Published/Draft toggle
   - Publish date picker
   - Submit button

3. **Blog Posts List:**
   - Table showing:
     * Title
     * Author
     * Category
     * Status badge (Published/Draft)
     * Publish date
     * Edit button
     * Delete button
   - Sort by date (newest first)
   - Pagination (10 posts per page)

4. **Features:**
   - Create new blog post
   - Edit existing post
   - Delete post
   - Change status (publish/draft)
   - Search posts by title
   - Filter by category
   - Loading states
   - Success/error notifications

5. **Styling:**
   - Use shadcn/ui components (Card, Button, Input, Textarea, Select, Badge)
   - Responsive grid layout
   - Mobile-first design
   - Tailwind classes

6. **tRPC Integration:**
   - trpc.admin.createBlogPost.useMutation()
   - trpc.admin.updateBlogPost.useMutation()
   - trpc.admin.deleteBlogPost.useMutation()
   - trpc.admin.getBlogPosts.useQuery()

7. **Bilingual:**
   - All labels in EN/FR
   - Language toggle

REFERENCE:
- GEMINI_REFERENCE.md: Component patterns
- News.tsx: Similar admin page structure
- Dashboard.tsx: Admin layout pattern

IMPORTANT:
- Follow News.tsx patterns
- Use shadcn/ui components only
- Mobile-first responsive design
- All text bilingual
```

---

## TASK 11: Jersey Poll & Merchandise Page

**Difficulty:** Medium  
**Time:** 25-30 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, Registration.tsx (reference)

**Prompt:**

```
You are a React/TypeScript developer for the MIHL League Portal project.

TASK: Create `/client/src/pages/Merchandise.tsx` - Jersey poll and merchandise page

REQUIREMENTS:

1. **Page Structure:**
   - Hero section: "Jersey & Merchandise"
   - Jersey Poll section
   - Merchandise Coming Soon section

2. **Jersey Poll:**
   - Title: "Help us choose the perfect jersey!"
   - 4-6 jersey design options showing:
     * Jersey image/mockup
     * Design name
     * Color scheme
     * Vote button
   - Display current vote count per design
   - Show percentage of votes
   - User can vote once (store in localStorage)
   - Thank you message after voting

3. **Jersey Options:**
   - Classic Navy with Silver trim
   - Modern Navy with Gold accents
   - Retro Navy with White stripes
   - Contemporary Navy with Red accents
   - (Add 1-2 more based on user preference)

4. **Merchandise Coming Soon:**
   - Message: "Merchandise will be available soon!"
   - Sign up form for notifications:
     * Email input
     * Checkbox: "Notify me when available"
     * Submit button
   - Display: "X people are waiting for merchandise"

5. **Features:**
   - Real-time vote updates
   - Show vote results with progress bars
   - Mobile-responsive design
   - Prevent duplicate votes (localStorage)
   - Email signup for notifications
   - Loading states

6. **Styling:**
   - Use shadcn/ui components (Card, Button, Progress, Input)
   - Responsive grid layout
   - Jersey images displayed prominently
   - Mobile-first design
   - Tailwind classes

7. **tRPC Integration:**
   - trpc.merchandise.submitVote.useMutation()
   - trpc.merchandise.getVotes.useQuery()
   - trpc.merchandise.signupNotification.useMutation()
   - trpc.merchandise.getNotificationCount.useQuery()

8. **Bilingual:**
   - All labels in EN/FR
   - Language toggle

REFERENCE:
- GEMINI_REFERENCE.md: Component patterns
- Registration.tsx: Bilingual implementation

IMPORTANT:
- Make jersey images visually appealing
- Use progress bars for vote visualization
- Mobile-responsive design
- All text bilingual
- Store votes in database
```

---

## TASK 12: Player Profile Page

**Difficulty:** Medium  
**Time:** 30-35 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, Stats.tsx (reference), Teams.tsx (reference)

**Prompt:**

```
You are a React/TypeScript developer for the MIHL League Portal project.

TASK: Create `/client/src/pages/PlayerProfile.tsx` - Individual player profile page

REQUIREMENTS:

1. **Page Structure:**
   - Hero section with player info
   - Stats section
   - Team info section
   - Game history section

2. **Player Info Card:**
   - Player name
   - Jersey number
   - Position
   - Team
   - Rating (1-10 stars)
   - Height/Weight (if available)
   - Hometown

3. **Player Stats:**
   - Games played
   - Goals scored
   - Assists
   - Points total
   - +/- rating
   - Penalty minutes
   - Average rating

4. **Team Info:**
   - Team name with logo
   - Team captain
   - Team record
   - Link to team page

5. **Game History:**
   - Table showing last 10 games:
     * Date
     * Opponent
     * Result (W/L)
     * Goals
     * Assists
     * Rating

6. **Features:**
   - Fetch player data from URL parameter (playerId)
   - Display loading skeleton
   - Error state if player not found
   - Responsive layout
   - Mobile-friendly

7. **Styling:**
   - Use shadcn/ui components (Card, Badge, Table)
   - Responsive grid layout
   - Mobile-first design
   - Tailwind classes
   - Hero background with team colors

8. **tRPC Integration:**
   - trpc.league.getPlayerProfile.useQuery(playerId)
   - trpc.league.getPlayerStats.useQuery(playerId)
   - trpc.league.getPlayerGameHistory.useQuery(playerId)

9. **Bilingual:**
   - All labels in EN/FR
   - Language toggle

REFERENCE:
- GEMINI_REFERENCE.md: Component patterns
- Stats.tsx: Stats display pattern
- Teams.tsx: Team info display

IMPORTANT:
- Make profile visually appealing
- Use team colors in design
- Mobile-responsive layout
- All text bilingual
- Handle missing data gracefully
```

---

## TASK 13: Playoff Bracket & Tournament Mode

**Difficulty:** Hard  
**Time:** 45-60 minutes  
**Files to Attach:** GEMINI_REFERENCE.md, Schedule.tsx (reference), Games.tsx (reference)

**Prompt:**

```
You are a React/TypeScript developer for the MIHL League Portal project.

TASK: Create `/client/src/pages/Playoffs.tsx` - Playoff bracket and tournament visualization

REQUIREMENTS:

1. **Page Structure:**
   - Playoff bracket visualization
   - Tournament info section
   - Playoff standings
   - Bracket navigation

2. **Playoff Bracket Display:**
   - Visual bracket showing:
     * Round 1 (4 teams)
     * Semi-finals (2 teams)
     * Finals (1 winner)
   - Each matchup shows:
     * Team A vs Team B
     * Current score
     * Status (Scheduled/In Progress/Completed)
     * Winner badge (if completed)

3. **Bracket Features:**
   - Interactive bracket (click to see details)
   - Show game dates and times
   - Display series scores (best of 3/5)
   - Highlight current round
   - Mobile-responsive bracket

4. **Playoff Info:**
   - Tournament name
   - Tournament dates
   - Number of teams
   - Bracket format (single/double elimination)
   - Current round

5. **Playoff Standings:**
   - Table showing:
     * Team name
     * Wins
     * Losses
     * Series status
     * Next opponent
     * Next game date

6. **Features:**
   - Fetch playoff data from database
   - Update bracket in real-time
   - Show game details on click
   - Mobile-friendly bracket layout
   - Print-friendly bracket option

7. **Styling:**
   - Use SVG for bracket visualization
   - Responsive design
   - Team colors in bracket
   - Mobile-first design
   - Tailwind classes

8. **tRPC Integration:**
   - trpc.league.getPlayoffBracket.useQuery()
   - trpc.league.getPlayoffStandings.useQuery()
   - trpc.league.getPlayoffSeries.useQuery(seriesId)

9. **Bilingual:**
   - All labels in EN/FR
   - Language toggle

REFERENCE:
- GEMINI_REFERENCE.md: Component patterns
- Schedule.tsx: Game display pattern
- Games.tsx: Game details pattern

IMPORTANT:
- Create visually appealing bracket
- Mobile-responsive design
- Use SVG for bracket lines
- Handle different bracket formats
- All text bilingual
- Show series scores clearly
```

---

## How to Use These Tasks

1. **Choose a task** (9-13)
2. **Attach reference files** listed in "Files to Attach"
3. **Copy the exact prompt** provided
4. **Paste into Gemini Pro**
5. **Wait for code generation**
6. **Copy the generated code** and save to the correct file path
7. **Test in dev server**

---

## Task Difficulty & Time Estimates

- **Task 9 (Team Balancing):** Hard, 40-50 min - Complex algorithm
- **Task 10 (Blog Management):** Medium, 25-30 min - Standard CRUD page
- **Task 11 (Jersey Poll):** Medium, 25-30 min - Interactive voting page
- **Task 12 (Player Profile):** Medium, 30-35 min - Data display page
- **Task 13 (Playoff Bracket):** Hard, 45-60 min - Complex visualization

---

## Priority Order

**High Priority (do first):**
1. Task 10 - Blog Management (unlocks blog feature)
2. Task 11 - Jersey Poll (user engagement)
3. Task 12 - Player Profile (user experience)

**Medium Priority (do after):**
4. Task 9 - Team Balancing (complex but important)
5. Task 13 - Playoff Bracket (nice-to-have feature)

---

## Integration Notes

After Gemini Pro completes these tasks:
1. Copy files to correct locations
2. Update App.tsx with new routes
3. Update Header.tsx with navigation links
4. Run `pnpm dev` to test
5. Check for TypeScript errors
6. Create checkpoint when all working
