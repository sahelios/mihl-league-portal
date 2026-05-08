# MIHL League Portal - Final Combined Tasks for Gemini Pro

These 3 comprehensive tasks complete the remaining features. Each task combines related functionality to maintain code quality and consistency.

---

## TASK 1: Admin Content Management System (News + Blog + Merchandise)

**Difficulty:** Hard  
**Time:** 60-75 minutes  
**Combines:** News management, Blog management, Merchandise voting
**Files to Attach:** GEMINI_REFERENCE.md, News.tsx (reference), Blog.tsx (provided), Merchandise.tsx (provided)

**Prompt:**

```
You are a React/TypeScript developer for the MIHL League Portal project.

TASK: Create a comprehensive Admin Content Management System with three integrated modules:
1. `/server/routers/content.ts` - Backend router for all content operations
2. Update `/client/src/pages/admin/News.tsx` - News post management
3. Update `/client/src/pages/admin/Blog.tsx` - Blog post management  
4. Update `/client/src/pages/Merchandise.tsx` - Jersey voting and merchandise signups

REQUIREMENTS:

### Backend Router (`server/routers/content.ts`):

Create a new tRPC router with these procedures:

**News Procedures:**
- createNewsPost(title, content, imageUrl, category) → returns created post
- updateNewsPost(id, title, content, imageUrl, category) → returns updated post
- deleteNewsPost(id) → returns success
- getNewsPosts(limit, offset) → returns paginated posts
- getNewsPostById(id) → returns single post

**Blog Procedures:**
- createBlogPost(title, content, author, featuredImage, category, status, publishDate) → returns created post
- updateBlogPost(id, title, content, category, status, publishDate) → returns updated post
- deleteBlogPost(id) → returns success
- getBlogPosts(status, category, limit, offset) → returns filtered posts
- getBlogPostById(id) → returns single post

**Merchandise Procedures:**
- submitJerseyVote(designId) → returns vote confirmation
- getJerseyVotes() → returns all votes with counts and percentages
- signupMerchandiseNotification(email) → returns signup confirmation
- getMerchandiseNotificationCount() → returns total signups

### Frontend Components:

**News Management:**
- Reuse existing News.tsx structure
- Add category filtering
- Add featured image support
- Add publish/draft status
- Integrate with new content router

**Blog Management:**
- Use provided Blog.tsx as template
- Add rich text editor support (markdown)
- Add category management
- Add scheduled publishing
- Add search functionality
- Integrate with new content router

**Merchandise Page:**
- Use provided Merchandise.tsx as template
- Display 4-6 jersey design options with images
- Show real-time vote counts and percentages
- Allow one vote per user (localStorage)
- Show merchandise signup form
- Display notification signup count
- Integrate with new content router

### Database Integration:

Ensure procedures work with these tables:
- news (id, title, content, imageUrl, category, createdAt, updatedAt)
- blogPosts (id, title, content, author, featuredImage, category, status, publishDate, createdAt, updatedAt)
- jerseyVotes (id, designId, userId, createdAt)
- merchandiseSignups (id, email, createdAt)

### Features:

**Admin Features:**
- Create, edit, delete news and blog posts
- Filter by category and status
- Search posts by title
- Pagination (10 items per page)
- Loading states and error handling
- Success/error toast notifications
- Bilingual support (EN/FR)

**Public Features:**
- Vote on jersey designs
- See live vote results with progress bars
- Sign up for merchandise notifications
- Prevent duplicate votes (localStorage)
- Mobile-responsive design

### Styling:

- Use shadcn/ui components (Card, Button, Input, Textarea, Select, Badge, Tabs)
- Responsive grid layouts
- Mobile-first design
- Tailwind classes: bg-background, text-foreground, text-muted-foreground
- Consistent with existing admin pages

### tRPC Integration:

- Create new content router in `server/routers/content.ts`
- Export from main `server/routers.ts`
- Use protectedProcedure for admin operations
- Use publicProcedure for voting/signups
- Handle errors with proper error codes

### Bilingual Support:

- All labels in English and French
- Category names bilingual
- Status labels bilingual
- Error messages bilingual
- Language toggle in header

### Admin Access Control:

- Check user?.role === 'admin' for management pages
- Redirect to home if not admin
- Show error message if unauthorized

REFERENCE:
- GEMINI_REFERENCE.md: Complete patterns
- News.tsx: Existing news management structure
- Blog.tsx: Blog management template
- Merchandise.tsx: Jersey voting template

IMPORTANT:
- Create single content router to avoid duplication
- Maintain consistent styling across all three modules
- Handle all edge cases (empty data, errors, etc.)
- Use proper TypeScript typing
- Include comprehensive error handling
- All text bilingual
```

---

## TASK 2: Player Management & Analytics (Profiles + Stats + Standings)

**Difficulty:** Medium  
**Time:** 50-60 minutes  
**Combines:** Player profiles, Statistics display, Standings
**Files to Attach:** GEMINI_REFERENCE.md, Stats.tsx (reference), PlayerProfile.tsx (provided), Standings.tsx (provided)

**Prompt:**

```
You are a React/TypeScript developer for the MIHL League Portal project.

TASK: Create an integrated Player Management & Analytics system with three components:
1. Update `/client/src/pages/PlayerProfile.tsx` - Individual player profiles
2. Update `/client/src/pages/Stats.tsx` - League-wide statistics
3. Update `/client/src/pages/Standings.tsx` - Team standings with analytics

REQUIREMENTS:

### Backend Router Updates (`server/routers/league.ts`):

Add these procedures:

**Player Profile Procedures:**
- getPlayerProfile(playerId) → returns player info, team, rating
- getPlayerStats(playerId) → returns goals, assists, points, games played
- getPlayerGameHistory(playerId, limit) → returns last N games with stats
- getPlayerTeammates(playerId) → returns team roster

**Statistics Procedures:**
- getLeaderboard(stat: 'goals'|'assists'|'points', limit) → returns top scorers
- getPlayerStats(playerId) → returns detailed stats
- getTeamStats(teamId) → returns team statistics

**Standings Procedures:**
- getTeamStandings() → returns all teams sorted by points
- getTeamDetails(teamId) → returns team info with roster
- getSeasonStats() → returns season statistics

### Frontend Components:

**Player Profile Page:**
- Use provided PlayerProfile.tsx as template
- Display player info: name, number, position, team, rating
- Show career statistics: games, goals, assists, points, +/-
- Display game history (last 10 games)
- Show team information and teammates
- Add links to team page and teammate profiles
- Mobile-responsive design
- Handle missing data gracefully

**Statistics Page:**
- Use provided Stats.tsx as template
- Display league-wide leaderboards:
  * Top 10 scorers (goals)
  * Top 10 assist leaders
  * Top 10 point leaders
- Show player cards with stats
- Add filters: by team, by position
- Add search by player name
- Highlight top 3 in each category
- Mobile-responsive table
- Pagination (10 players per page)

**Standings Page:**
- Use provided Standings.tsx as template
- Display team standings table with:
  * Team name with logo
  * Wins, Losses, Ties
  * Goals For, Goals Against
  * Points
- Sort by points (descending)
- Show team stats on hover
- Add filters: by division (if applicable)
- Mobile-responsive table with horizontal scroll
- Color-code rows (alternating)

### Data Display:

**Player Profile:**
- Player name, number, position
- Team name with logo
- Rating (1-10 stars)
- Games played, Goals, Assists, Points
- +/- rating, Penalty minutes
- Game history table with date, opponent, result, stats

**Statistics:**
- Player rank, name, team
- Goals, Assists, Points
- Games played
- Average points per game
- Rating

**Standings:**
- Team rank, name, logo
- Wins, Losses, Ties
- Games played
- Goals For, Goals Against
- Goal differential
- Points
- Win percentage

### Features:

- Real-time data from database
- Loading skeletons while fetching
- Error states with retry buttons
- Empty states if no data
- Responsive design (mobile/tablet/desktop)
- Click through to player/team details
- Search and filter functionality
- Bilingual support (EN/FR)

### Styling:

- Use shadcn/ui components (Card, Table, Badge, Button)
- Responsive grid and table layouts
- Mobile-first design
- Tailwind classes: bg-background, text-foreground
- Consistent with existing pages
- Highlight top performers with colors

### tRPC Integration:

- Use trpc.league.* procedures
- Handle loading and error states
- Invalidate cache on data changes
- Use optimistic updates where appropriate

### Bilingual Support:

- All labels in English and French
- Column headers bilingual
- Stats names bilingual
- Language toggle in header

### Accessibility:

- Proper table headers and structure
- Keyboard navigation support
- Color contrast compliance
- Alt text for images/logos

REFERENCE:
- GEMINI_REFERENCE.md: Complete patterns
- Stats.tsx: Statistics display template
- PlayerProfile.tsx: Player profile template
- Standings.tsx: Standings template

IMPORTANT:
- Reuse league router where possible
- Maintain consistent styling
- Handle all edge cases
- Use proper TypeScript typing
- Include comprehensive error handling
- All text bilingual
- Mobile-responsive throughout
```

---

## TASK 3: Tournament & Game Management (Playoffs + Schedule + Balancing)

**Difficulty:** Hard  
**Time:** 70-85 minutes  
**Combines:** Playoff bracket, Game schedule, Team balancing algorithm
**Files to Attach:** GEMINI_REFERENCE.md, Schedule.tsx (reference), Playoffs.tsx (provided), balanceTeams.ts (provided)

**Prompt:**

```
You are a React/TypeScript developer for the MIHL League Portal project.

TASK: Create an integrated Tournament & Game Management system with three components:
1. Update `/client/src/pages/Schedule.tsx` - Game schedule and results
2. Update `/client/src/pages/Playoffs.tsx` - Playoff bracket visualization
3. Update `/server/utils/balanceTeams.ts` - Team balancing algorithm

REQUIREMENTS:

### Backend Router Updates (`server/routers/league.ts`):

Add these procedures:

**Schedule Procedures:**
- getSchedule(status: 'upcoming'|'completed'|'all') → returns filtered games
- getGameDetails(gameId) → returns full game info with stats
- getGamesByTeam(teamId) → returns team's games
- getGamesByDate(date) → returns games on specific date

**Playoff Procedures:**
- getPlayoffBracket() → returns bracket structure
- getPlayoffStandings() → returns playoff standings
- getPlayoffSeries(seriesId) → returns series details with scores
- getPlayoffSchedule() → returns playoff game schedule

**Team Balancing Procedures:**
- balanceTeamsAfterEvaluation() → runs balancing algorithm
- getBalancedTeams() → returns current balanced teams
- getTeamAssignments() → returns player-to-team assignments

### Frontend Components:

**Schedule Page:**
- Use provided Schedule.tsx as template
- Display games in list or calendar view
- Filter tabs: Upcoming | Completed | All
- For each game show:
  * Date and time
  * Team A vs Team B
  * Venue
  * Status badge
  * Score (if completed)
- Sort by date (upcoming first)
- Mobile-responsive design
- Click to see game details

**Playoffs Page:**
- Use provided Playoffs.tsx as template
- Visual bracket showing:
  * Round 1 (4 teams)
  * Semi-finals (2 teams)
  * Finals (1 winner)
- Each matchup displays:
  * Team A vs Team B
  * Current score
  * Status (Scheduled/In Progress/Completed)
  * Winner badge
- Interactive bracket (click for details)
- Show series format (best of 3/5)
- Playoff standings table
- Mobile-responsive bracket layout

**Team Balancing Algorithm:**
- Use provided balanceTeams.ts as template
- Input: Array of approved players with ratings and positions
- Output: 4 balanced teams with:
  * Team name
  * Captain (from interested players)
  * Roster with positions assigned
  * Average team rating
  * Position breakdown

### Algorithm Details:

**Balancing Logic:**
1. Analyze all player ratings (1-10 scale)
2. Divide players into 4 teams with similar average ratings
3. Distribute positions evenly:
   - ~6-8 forwards per team
   - ~3-4 defensemen per team
   - 1 goalie per team
4. Select captains from players who expressed interest
5. Assign one captain per team
6. Ensure balanced skill distribution

**Edge Cases:**
- Fewer than 12 players (adjust team sizes)
- No captain interest (auto-assign highest-rated)
- Position imbalances (assign flexible players)
- Validate input data

**Functions:**
- balanceTeams(players): Team[]
- calculateTeamRating(team): number
- assignPositions(team, positions): void
- selectCaptains(teams, candidates): void
- validateInput(players): boolean

### Data Display:

**Schedule:**
- Game date in format: "Tuesday, June 24, 2026"
- Time in 12-hour format
- Team names and logos
- Venue information
- Score display: "3 - 2" format
- Status badge colors

**Playoffs:**
- Bracket visualization with SVG
- Team names and logos
- Current scores in each matchup
- Winner indicators
- Series information
- Next game date/time

**Team Balancing:**
- Display 4 balanced teams
- Show captain for each team
- List players by position
- Display average team rating
- Show position breakdown

### Features:

- Real-time schedule updates
- Interactive playoff bracket
- Automatic team balancing after evaluation games
- Game details on click
- Mobile-responsive design
- Bilingual support (EN/FR)
- Loading states and error handling
- Print-friendly bracket option

### Styling:

- Use shadcn/ui components (Card, Badge, Button, Table)
- SVG for playoff bracket visualization
- Responsive grid layouts
- Mobile-first design
- Tailwind classes
- Team colors in bracket and schedule
- Consistent with existing pages

### tRPC Integration:

- Use trpc.league.* procedures
- Handle loading and error states
- Real-time updates for scores
- Invalidate cache after game updates

### Bilingual Support:

- All labels in English and French
- Status labels bilingual
- Column headers bilingual
- Error messages bilingual
- Language toggle in header

### Algorithm Validation:

- Test with various player counts
- Verify team rating balance (within 1-2 points)
- Check position distribution
- Validate captain selection
- Handle edge cases gracefully

REFERENCE:
- GEMINI_REFERENCE.md: Complete patterns
- Schedule.tsx: Schedule template
- Playoffs.tsx: Playoff bracket template
- balanceTeams.ts: Balancing algorithm template

IMPORTANT:
- Create reusable schedule component
- Use SVG for bracket visualization
- Implement robust balancing algorithm
- Handle all edge cases
- Use proper TypeScript typing
- Include comprehensive error handling
- All text bilingual
- Mobile-responsive throughout
- Test algorithm thoroughly
```

---

## How to Use These 3 Combined Tasks

1. **Choose a task** (1, 2, or 3)
2. **Attach reference files** listed in "Files to Attach"
3. **Copy the exact prompt** provided
4. **Paste into Gemini Pro**
5. **Wait for code generation** (60-85 minutes depending on task)
6. **Copy the generated code** and save to correct file paths
7. **Test in dev server**

---

## Task Breakdown

| Task | Components | Time | Difficulty |
|------|-----------|------|------------|
| 1 | News + Blog + Merchandise | 60-75 min | Hard |
| 2 | Profiles + Stats + Standings | 50-60 min | Medium |
| 3 | Schedule + Playoffs + Balancing | 70-85 min | Hard |

---

## Recommended Execution Order

**Phase 1 (Start with):**
- Task 2 - Player Management (simpler, good foundation)

**Phase 2 (Then do):**
- Task 1 - Content Management (admin features)

**Phase 3 (Finally):**
- Task 3 - Tournament Management (most complex)

---

## Integration Checklist

After Gemini Pro completes each task:

1. ✅ Copy all generated files to correct locations
2. ✅ Create new router file if needed (`server/routers/content.ts`)
3. ✅ Update main `server/routers.ts` to export new router
4. ✅ Update `client/src/App.tsx` with new routes
5. ✅ Update `client/src/components/Header.tsx` with navigation links
6. ✅ Run `pnpm dev` to test
7. ✅ Check for TypeScript errors
8. ✅ Test all functionality in browser
9. ✅ Create checkpoint when all working

---

## Quality Assurance

Each task includes:
- ✅ Comprehensive error handling
- ✅ Loading and error states
- ✅ Bilingual support (EN/FR)
- ✅ Mobile-responsive design
- ✅ Proper TypeScript typing
- ✅ shadcn/ui component usage
- ✅ Tailwind CSS styling
- ✅ tRPC integration
- ✅ Database integration
- ✅ User feedback (toasts, badges)

These combined tasks maintain code quality while reducing the number of separate prompts needed.
