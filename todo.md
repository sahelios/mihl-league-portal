# MIHL League Portal - Project TODO

## Core Infrastructure
- [x] Database schema created (14 tables)
- [x] Team logos generated (4 unique 2-color logos)
- [ ] Database seeding with initial data (seasons, teams, venues, sample games)
- [ ] tRPC routers for all features
- [ ] Email notification system setup

## Layout & Navigation
- [ ] Global header with navigation menu (8 pages) - FIX: nested anchor tags in Wouter Link
- [ ] Upcoming games slider component (2-week forecast, all pages) - TODO: connect to real schedule data
- [x] Footer with contact info and social links
- [ ] Responsive design for mobile/tablet/desktop - TODO: verify across all pages

## Public Pages
- [x] Home page (news, blog, stars slider, top players slider, top teams slider) - UI complete, uses sample data
- [x] League Rules page (display rules document)
- [x] Teams page (4 team profiles with logos, rosters, stats) - UI complete with logos
- [ ] Schedule & Results page (Tuesday/Thursday games with score entry UI) - TODO: full season schedule, score entry
- [x] Stats page (individual player statistics) - UI complete with sample data
- [x] Suspensions page (active and past suspensions list) - UI complete with sample data
- [x] Standings page (win/loss/points table) - UI complete with sample data
- [ ] Registration page (player registration form with pricing info) - TODO: backend persistence

## Registration & Player Management
- [x] Player registration form (individual/team, first-time player checkbox, spare, referee, scorekeeper) - COMPLETE with tRPC integration
- [x] Registration status tracking (pending/approved/rejected) - COMPLETE with database persistence
- [x] Payment confirmation workflow - COMPLETE with mark paid functionality
- [x] Digital waiver signing - COMPLETE with signature capture
- [x] Bilingual support (EN/FR) - COMPLETE with language toggle
- [x] Email notification: player receives approval/rejection email - COMPLETE (console logging)
- [x] Email notification: admin receives new registration email - COMPLETE (console logging)

## Admin Dashboard
- [x] Admin authentication & role-based access - COMPLETE with role checking
- [x] Dashboard overview page - COMPLETE with registration stats
- [x] Player management (view, approve, reject registrations) - COMPLETE with tRPC mutations
- [x] Registration stats (pending, approved, rejected, total counts) - COMPLETE
- [ ] Game score entry interface - TODO: implement
- [ ] News post management (create, edit, delete) - TODO: implement
- [ ] Blog post management (create, edit, delete) - TODO: implement
- [ ] Stars of the Week selection - TODO: implement
- [ ] Suspension management (add, edit, remove) - TODO: implement
- [ ] Messaging tool (send messages to players/teams) - TODO: implement
- [ ] Season management (create new seasons, set dates) - TODO: implement
- [ ] Team management (add teams, edit team info) - TODO: implement
- [ ] Venue management (add/edit game locations) - TODO: implement

## Data & Features
- [x] Seed sample data (2026 summer season, 4 teams, 20 sample games)
- [x] Sample news posts
- [x] Sample blog posts
- [ ] Sample player registrations
- [ ] Sample player stats
- [x] Sample team stats
- [ ] Sample suspensions

## Testing & Polish
- [ ] Vitest unit tests for all tRPC procedures
- [ ] UI testing on all pages
- [ ] Admin workflow testing
- [ ] Email notification testing
- [ ] Responsive design testing
- [ ] Performance optimization
- [ ] Accessibility review

## Deployment
- [ ] Final checkpoint created
- [ ] Project ready for publishing

## NEW: Logo & Color Palette Updates
- [x] Upload MIHL league logo to storage
- [x] Update header to display MIHL league logo
- [x] Update color palette to Navy Blue (#1a1f3a) + Light Silver (#c0c5d0)
- [x] Update all pages with new color scheme
- [ ] Upload team logos when provided by user
- [ ] Replace AI-generated team logos with user-provided logos
- [ ] Test color contrast and accessibility with new palette
