# Referee/Scorekeeper Application Workflow - Task for Gemini Pro

## Overview
Build a complete referee/scorekeeper application and approval workflow with game selection and payment management.

## Database Schema (Already Added)
```typescript
refereeApplications table with fields:
- id, firstName, lastName, email, phone, interacEmail
- role (referee | scorekeeper)
- isCertified (boolean)
- certifications (JSON array: {type, year})
- yearsOfExperience (number)
- hockeyLevels (JSON array: U15, U18, Junior, Beer League, Other)
- status (pending | approved | rejected)
- approvalDate, paymentAmount, selectedGames (JSON array of game IDs)
- createdAt, updatedAt
```

## What You Need to Build

### 1. PUBLIC APPLICATION FORM (`/client/src/pages/RefereeScorekeeperApplication.tsx`)
**Location:** Public page, NO authentication required

**Form Fields:**
- First Name (required)
- Last Name (required)
- Email (required)
- Phone (required)
- Interac Email for e-transfer (required)
- Role: Dropdown (Referee | Scorekeeper)
- Certification Status: Radio (Yes | No)
- If Yes: Multi-select certifications (IIHF, Hockey Canada, USA Hockey, Other)
- Years of Experience: Number input
- Hockey Levels: Multi-select checkboxes (U15, U18, Junior, Beer League, Other)
- Submit button

**Features:**
- Bilingual support (EN/FR)
- Form validation (all fields required)
- Loading state during submission
- Success message on submission
- Error handling with toast notifications
- Clear, attractive UI using shadcn/ui components
- Mobile-responsive design

**tRPC Call:**
- `trpc.referee.submitApplication.useMutation()` - Submit the application

### 2. ADMIN APPLICATION REVIEW PAGE (`/client/src/pages/admin/RefereeApplications.tsx`)
**Location:** `/admin/referee-applications` - Admin only

**Features:**
- Show pending referee/scorekeeper applications
- Display applicant info (name, email, role, experience, certifications)
- For each application:
  - Approve button (opens payment amount input)
  - Reject button
  - View details button (modal with full info)
  
**Approval Workflow:**
- When admin clicks "Approve":
  - Show input field with default payment amount ($40-50 for refs, $25 for scorekeepers)
  - Allow admin to override the amount
  - Confirm button sends approval with custom payment amount
  - Auto-email sent to applicant with approval + payment info + next steps

**UI:**
- Table or card layout showing pending applications
- Status badges
- Action buttons (Approve/Reject)
- Loading states
- Bilingual support

**tRPC Calls:**
- `trpc.admin.getPendingRefereeApplications.query()` - Get pending apps
- `trpc.admin.approveRefereeApplication.mutation()` - Approve with payment amount
- `trpc.admin.rejectRefereeApplication.mutation()` - Reject application

### 3. REFEREE/SCOREKEEPER GAME SELECTION PAGE (`/client/src/pages/RefereeGameSelection.tsx`)
**Location:** `/referee-game-selection` - Protected (login required)

**Workflow:**
- Only accessible after approval (check if user has approved referee application)
- Show upcoming games in a list or calendar
- Multi-select checkboxes for games they're available for
- Submit button to save selected games

**Game Display:**
- Date, time, venue
- Teams playing
- Checkbox to select availability

**Features:**
- Load games from `trpc.league.getSchedule.query()`
- Save selections to `trpc.referee.selectGameAvailability.mutation()`
- Success message after saving
- Bilingual support

**tRPC Calls:**
- `trpc.league.getSchedule.query()` - Get upcoming games
- `trpc.referee.selectGameAvailability.mutation()` - Save game selections

### 4. BACKEND PROCEDURES (Add to `server/routers/admin.ts` and create `server/routers/referee.ts`)

**Admin Procedures (in admin.ts):**
```typescript
getPendingRefereeApplications: adminProcedure.query()
approveRefereeApplication: adminProcedure.mutation({ id, paymentAmount })
rejectRefereeApplication: adminProcedure.mutation({ id })
```

**Public Procedures (new referee.ts):**
```typescript
submitApplication: publicProcedure.mutation({
  firstName, lastName, email, phone, interacEmail,
  role, isCertified, certifications, yearsOfExperience, hockeyLevels
})
```

**Protected Procedures (referee.ts):**
```typescript
selectGameAvailability: protectedProcedure.mutation({
  selectedGameIds: number[]
})
getMyApplication: protectedProcedure.query()
```

### 5. EMAIL NOTIFICATION
**When admin approves:**
- Send email to applicant with:
  - Approval message
  - Payment amount ($X per game)
  - Interac email for e-transfer
  - Link/instructions to log in and select game availability
  - League contact info (registration@mihl.ca, 514-965-2842)
  - Bilingual support

**Use existing email helper:** `server/_core/email.ts`
Add new function: `sendRefereeApprovalEmail()`

### 6. ROUTING & NAVIGATION
- Add route `/referee-scorekeeper-apply` to App.tsx (public)
- Add route `/referee-game-selection` to App.tsx (protected)
- Add route `/admin/referee-applications` to App.tsx (admin only)
- Add link to admin dashboard for referee applications

## Important Notes

1. **Certification Types:** IIHF, Hockey Canada, USA Hockey, Other
2. **Hockey Levels:** U15, U18, Junior, Beer League, Other
3. **Payment Defaults:** Referees $40-50, Scorekeepers $25 (per game)
4. **Bilingual:** All text must support EN/FR
5. **Mobile-First:** All pages must be responsive
6. **Use shadcn/ui:** For all components (Button, Card, Input, Select, Checkbox, etc.)
7. **Tailwind Classes:** bg-background, text-foreground, text-muted-foreground

## Files to Create/Modify
- Create: `/client/src/pages/RefereeScorekeeperApplication.tsx`
- Create: `/client/src/pages/RefereeGameSelection.tsx`
- Create: `/client/src/pages/admin/RefereeApplications.tsx`
- Create: `/server/routers/referee.ts`
- Modify: `/server/routers/admin.ts` (add referee procedures)
- Modify: `/server/routers.ts` (wire referee router)
- Modify: `/server/_core/email.ts` (add approval email)
- Modify: `/client/src/App.tsx` (add routes)
- Modify: `/client/src/pages/admin/Dashboard.tsx` (add link)

## Reference Files
- Use existing Registration.tsx as pattern for form structure
- Use existing admin pages as pattern for admin UI
- Use existing email.ts as pattern for email templates
- Use existing Schedule.tsx as pattern for game display

## Success Criteria
✅ Public application form works
✅ Admin can review and approve applications
✅ Admin can set custom payment amounts
✅ Approval email sent automatically
✅ Approved applicants can log in and select games
✅ All text is bilingual
✅ Mobile responsive
✅ No TypeScript errors
✅ Form validation working
✅ Error handling with toasts
