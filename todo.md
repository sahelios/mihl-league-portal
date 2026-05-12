# MIHL League Portal - Project TODO

## Core Infrastructure
- [x] Database schema created (14 tables)
- [x] Team logos generated (4 unique 2-color logos)
- [x] Database seeding with initial data (seasons, teams, venues, sample games) - COMPLETE
- [x] tRPC routers for all features - COMPLETE
- [x] Email notification system setup - COMPLETE

## Layout & Navigation
- [x] Global header with navigation menu (9 pages including Referee/Scorekeeper)
- [x] Upcoming games slider component (2-week forecast, all pages) - COMPLETE with real schedule data
- [x] Footer with contact info, social links, registration deadline, and phone number
- [x] Responsive design for mobile/tablet/desktop - COMPLETE with mobile-first design

## Public Pages
- [x] Home page (news, blog, stars slider, top players slider, top teams slider) - UI complete, uses sample data
- [x] League Rules page (display rules document with updated game times and requirements)
- [x] Teams page (4 team profiles with logos, rosters, stats) - UI complete with logos and 12 players per team
- [x] Schedule & Results page (Tuesday/Thursday games with score entry UI) - COMPLETE with 20 seeded games
- [x] Stats page (individual player statistics) - UI complete with generic player names
- [x] Suspensions page (active and past suspensions list) - UI complete with sample data
- [x] Standings page (win/loss/points table) - UI complete with sample data
- [x] Registration page (player registration form with pricing info, evaluation games info) - COMPLETE with backend persistence
- [x] Referee & Scorekeeper recruitment page - COMPLETE with attractive UI and payment info

## Registration & Player Management
- [x] Player registration form (individual/team, first-time player checkbox, spare, referee, scorekeeper) - COMPLETE with tRPC integration
- [x] Player rating 1-10 field - COMPLETE
- [x] Captain selection checkbox - COMPLETE
- [x] Position assignment for team players - COMPLETE
- [x] Referee & scorekeeper recruitment page - COMPLETE with attractive UI
- [x] Available days selection (Tuesday/Thursday) - COMPLETE
- [x] Registration status tracking (pending/approved/rejected) - COMPLETE with database persistence
- [x] Payment confirmation workflow - COMPLETE with mark paid functionality
- [x] Digital waiver signing - COMPLETE with signature capture
- [x] Bilingual support (EN/FR) - COMPLETE with language toggle throughout
- [x] Email notification: player receives approval/rejection email - COMPLETE (console logging)
- [x] Email notification: admin receives new registration email - COMPLETE (console logging)
- [x] League rules updated with game times and equipment requirements - COMPLETE
- [x] Evaluation games info displayed - COMPLETE
- [x] Registration deadline (June 9, 2026) displayed - COMPLETE
- [x] Contact info (registration@mihl.ca, 514-965-2842) on all pages - COMPLETE
- [x] Jersey "Coming Soon" with poll message - COMPLETE
- [x] All sample player names replaced with Player 1-16 - COMPLETE

## Admin Dashboard
- [x] Admin authentication & role-based access - COMPLETE with role checking
- [x] Dashboard overview page - COMPLETE with registration stats
- [x] Player management (view, approve, reject registrations) - COMPLETE with tRPC mutations
- [x] Registration stats (pending, approved, rejected, total counts) - COMPLETE
- [x] Game score entry interface - COMPLETE (submitGameScore in admin.ts)
- [x] News post management (create, edit, delete) - COMPLETE (tRPC procedures)
- [x] Blog post management (create, edit, delete) - COMPLETE (tRPC procedures)
- [x] Stars of the Week selection - COMPLETE (selectStarOfWeek in admin.ts)
- [x] Suspension management (add, edit, remove) - COMPLETE (tRPC procedures- [x] Messaging tool (send messages to players/teams) - COMPLETE with UI
- [x] Season management (create new seasons, set dates) - COMPLETE with UI
- [x] Team management (add teams, edit team info) - COMPLETE with UI
- [x] Venue management (add/edit game locations) - COMPLETE with tRPC and UI
## Data & Features
- [x] Seed sample data (2026 summer season, 4 teams, 20 sample games)
- [x] Sample news posts
- [x] Sample blog posts
- [x] Sample player registrations - 20 seeded
- [x] Sample player stats - 20 player stats seeded successfully with verified database insert
- [x] Sample team stats - seeded via games
- [x] Sample suspensions - 3 seeded

## Testing & Polish
- [ ] Vitest unit tests for all tRPC procedures - DEFERRED (test schema needs significant update)
- [x] UI testing on all pages - COMPLETE
- [x] Admin workflow testing - COMPLETE (all admin pages functional and tested)
- [x] Email notification testing - COMPLETE (console logging verified)
- [x] Responsive design testing - COMPLETE
- [ ] Performance optimization - DEFERRED (optional polish)
- [ ] Accessibility review - DEFERRED (optional polish)

## Deployment
- [x] Database seeding completed
- [x] Schema mismatches fixed in admin.ts and referee.ts
- [x] Admin pages created (Messaging, Seasons, Teams, Venues)
- [x] DashboardLayout export fixed
- [x] Player stats seeding completed and verified
- [x] Final checkpoint created (v3: 6762eba7)
- [x] Project ready for publishing

## NEW: Logo & Color Palette Updates
- [x] Upload MIHL league logo to storage
- [x] Update header to display MIHL league logo
- [x] Update color palette to Navy Blue (#1a1f3a) + Light Silver (#c0c5d0)
- [x] Update all pages with new color scheme
- [ ] Upload team logos when provided by user - FUTURE
- [ ] Replace AI-generated team logos with user-provided logos - FUTURE
- [ ] Test color contrast and accessibility with new palette - FUTURE

## Evaluation Game Date Selection
- [x] Add evaluation game date selection to registration form - COMPLETE (JUN 23 @ 9:30 PM & JUN 25 @ 10:00 PM)
- [x] Cap capacity: 2 goalies + 24 players per evaluation date - COMPLETE
- [x] Show remaining spots for each evaluation date - COMPLETE
- [x] Auto-populate admin portal with evaluation game attendance - COMPLETE
