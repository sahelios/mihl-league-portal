# MIHL League Portal - Final Fixes & Completion Task for Gemini Pro

## CRITICAL: Fix TypeScript Errors First

### Issue 1: referee.ts Drizzle ORM Type Errors
**Error:** `Argument of type 'MySqlColumn<...>' is not assignable to parameter of type 'Aliased<string | null>'`

**Location:** `server/routers/referee.ts` - Multiple lines with database queries

**Fix Required:**
- Review all `db.select()`, `db.update()`, `db.insert()` queries in referee.ts
- Ensure column selections match the refereeApplications schema properly
- Use correct Drizzle ORM syntax for MySQL queries
- Fix any type mismatches between schema and query operations

**Reference Schema:**
```typescript
export const refereeApplications = mysqlTable('refereeApplications', {
  id: int().primaryKey().autoincrement(),
  firstName: varchar('firstName', { length: 255 }).notNull(),
  lastName: varchar('lastName', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull(),
  interacEmail: varchar('interacEmail', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'referee' or 'scorekeeper'
  certificationStatus: varchar('certificationStatus', { length: 50 }).notNull(), // 'certified' or 'uncertified'
  certifications: json('certifications').$type<Array<{ type: string; year: number }>>().default([]),
  yearsExperience: int('yearsExperience').notNull(),
  hockeyLevels: json('hockeyLevels').$type<string[]>().default([]),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'approved', 'rejected'
  paymentAmount: decimal('paymentAmount', { precision: 8, scale: 2 }),
  selectedGames: json('selectedGames').$type<number[]>().default([]),
  approvalDate: timestamp('approvalDate'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
});
```

---

## Remaining Tasks to Complete

### TASK 1: Fix Database Seeding (Priority: HIGH)
**File:** `seed-db.mjs`

**What to do:**
1. Review the seed script and ensure it:
   - Creates 2026 summer season
   - Creates 4 teams (Schvitz Saints, etc.)
   - Creates game venues
   - Creates 20+ sample games
   - Creates sample news posts
   - Creates sample blog posts
   - Creates sample player registrations
   - Creates sample player stats
   - Creates sample suspensions

2. Run the seed script to populate the database
3. Verify all data is inserted correctly

**Expected Result:** Database populated with realistic sample data for testing

---

### TASK 2: Fix Upcoming Games Slider (Priority: MEDIUM)
**File:** `client/src/components/UpcomingGamesSlider.tsx`

**What to do:**
1. Connect the slider to real game data from `trpc.league.getUpcomingGames`
2. Fetch games for the next 2 weeks
3. Display game date, teams, time, and venue
4. Auto-refresh every 5 minutes
5. Show "No upcoming games" when empty
6. Ensure bilingual support (EN/FR)

**Expected Result:** Live upcoming games slider on all pages

---

### TASK 3: Complete Admin Features (Priority: HIGH)
These pages are created but may need backend integration fixes:

1. **Game Score Entry** (`/admin/games`)
   - Ensure tRPC procedures work: `submitGameScore`, `getUpcomingGames`, `getRecentGames`
   - Test form submission and score saving

2. **News Management** (`/admin/news`)
   - Ensure tRPC procedures work: `createNews`, `updateNews`, `deleteNews`, `getNews`
   - Test CRUD operations

3. **Blog Management** (`/admin/blog`)
   - Ensure tRPC procedures work: `createBlogPost`, `updateBlogPost`, `deleteBlogPost`, `getBlogPosts`
   - Test CRUD operations

4. **Stars of the Week** (`/admin/stars`)
   - Ensure tRPC procedures work: `selectStars`, `getStars`
   - Test star selection

5. **Suspension Management** (`/admin/suspensions`)
   - Ensure tRPC procedures work: `addSuspension`, `removeSuspension`, `getSuspensions`
   - Test suspension CRUD

6. **Messaging Tool** (`/admin/messages`)
   - Ensure tRPC procedures work: `sendMessage`, `getMessages`
   - Test message sending

7. **Settings** (`/admin/settings`)
   - Ensure tRPC procedures work: `createSeason`, `updateSeason`, `createTeam`, `updateTeam`, `createVenue`, `updateVenue`
   - Test season/team/venue management

8. **Referee Applications** (`/admin/referee-applications`)
   - Fix TypeScript errors in referee.ts
   - Ensure tRPC procedures work: `getPendingRefereeApplications`, `approveRefereeApplication`, `rejectRefereeApplication`
   - Test approval workflow with email sending

---

### TASK 4: Public Pages Data Integration (Priority: MEDIUM)
1. **Schedule Page** (`/schedule`)
   - Connect to real game data from database
   - Show upcoming and completed games
   - Display scores for completed games
   - Add filters by team/date

2. **Stats Page** (`/stats`)
   - Connect to real player statistics from database
   - Show top scorers, assists, etc.

3. **Standings Page** (`/standings`)
   - Connect to real team standings from database
   - Calculate wins/losses/points dynamically

4. **Suspensions Page** (`/suspensions`)
   - Connect to real suspension data from database
   - Show active and past suspensions

---

### TASK 5: Write Vitest Tests (Priority: MEDIUM)
**File:** `server/routers/*.test.ts`

Write comprehensive tests for:
1. All admin procedures (game score, news, blog, stars, suspensions, messages, settings)
2. All referee procedures (submit application, approve, reject, select games)
3. All league procedures (get games, get standings, etc.)
4. Error handling and authorization checks

---

### TASK 6: Final Polish (Priority: LOW)
1. Test all pages on mobile/tablet/desktop
2. Verify bilingual support (EN/FR) on all pages
3. Test admin workflows end-to-end
4. Verify email notifications work
5. Performance optimization
6. Accessibility review

---

## How to Use This Document

1. **Start with CRITICAL section** - Fix the TypeScript errors in referee.ts first
2. **Then complete TASK 1-3** - These are blocking other features
3. **Then complete TASK 4-6** - These can be done in parallel

## Files You'll Need

- GEMINI_REFERENCE.md - Project patterns and examples
- Current project structure at `/home/ubuntu/mihl-league-portal/`

## Success Criteria

✅ All TypeScript errors resolved
✅ Database seeded with sample data
✅ All admin pages functional with real data
✅ All public pages showing real data
✅ Vitest tests passing
✅ Bilingual support working throughout
✅ Mobile responsive design verified
✅ Email notifications working
✅ Ready for production deployment

---

## Notes

- The project uses tRPC for all backend communication
- All procedures should use `protectedProcedure` for admin-only features
- Bilingual support required for all user-facing text
- Use shadcn/ui components for consistency
- Mobile-first responsive design required
- All database operations use Drizzle ORM

Good luck! This will complete the MIHL League Portal MVP.
