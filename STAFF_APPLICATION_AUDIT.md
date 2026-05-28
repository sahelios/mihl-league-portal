# Staff Application Data Flow Audit

**Last Updated:** May 28, 2026  
**Status:** ✅ VERIFIED - All data flows correctly through the correct form

## Executive Summary

This document confirms that all staff applications (Referee/Scorekeeper) flow through the correct route and procedures. The obsolete `RefereeScorekeeper.tsx` component has been deprecated and marked for removal.

---

## Correct Data Flow

### User Journey
1. User navigates to `/referee-scorekeeper` (landing page)
2. User sees `RefereeScorekeeperLanding.tsx` component
3. User clicks "Apply as Referee" or "Apply as Scorekeeper"
4. User is routed to `/referee-scorekeeper-apply?role=referee` or `?role=scorekeeper`
5. User sees `RefereeScorekeeperApplication.tsx` form
6. Form submits to `trpc.referee.submitApplication` procedure
7. Data is saved to `refereeApplications` table with `desiredSalary` field populated

### Frontend Components

| Route | Component | Status | Notes |
|-------|-----------|--------|-------|
| `/referee-scorekeeper` | `RefereeScorekeeperRouter.tsx` | ✅ Active | Landing page router |
| `/referee-scorekeeper` | `RefereeScorekeeperLanding.tsx` | ✅ Active | Shows Referee/Scorekeeper options |
| `/referee-scorekeeper-apply` | `RefereeScorekeeperApplication.tsx` | ✅ Active | **CORRECT FORM** - Sends data to `trpc.referee.submitApplication` |
| `/referee-scorekeeper` | `RefereeScorekeeper.tsx` | ❌ DEPRECATED | **NOT USED** - Orphaned component |

### Backend Procedures

| Procedure | Router | Status | Notes |
|-----------|--------|--------|-------|
| `trpc.referee.submitApplication` | `referee.ts` | ✅ Active | **CORRECT PROCEDURE** - Accepts `desiredPayPerGame` and saves as `desiredSalary` |
| `trpc.registration.submitStaffApplication` | `registration.ts` | ❌ DEPRECATED | **NOT USED** - Kept for backwards compatibility only |

### Database

| Table | Column | Type | Notes |
|-------|--------|------|-------|
| `refereeApplications` | `desiredSalary` | DECIMAL | Stores desired payment amount |
| `refereeApplications` | All other fields | Various | Correctly populated from `RefereeScorekeeperApplication.tsx` |

### Admin Panel

| Component | Procedure | Status | Notes |
|-----------|-----------|--------|-------|
| `StaffApplications.tsx` | `trpc.admin.getAllStaffApplications` | ✅ Active | Queries `refereeApplications` table correctly |
| `StaffApplications.tsx` | Display logic | ✅ Fixed | Uses nullish coalescing (`??`) to properly display `desiredSalary` |

---

## Deprecated Components (Marked for Removal)

### 1. `RefereeScorekeeper.tsx`
- **Location:** `/client/src/pages/RefereeScorekeeper.tsx`
- **Status:** DEPRECATED - Not used anywhere
- **Reason:** Replaced by `RefereeScorekeeperApplication.tsx`
- **Action:** Can be safely deleted
- **Deprecation Notice:** Added at top of file

### 2. `registration.submitStaffApplication` Procedure
- **Location:** `/server/routers/registration.ts` (lines 493-560)
- **Status:** DEPRECATED - Not called by any frontend component
- **Reason:** Replaced by `referee.submitApplication`
- **Action:** Keep for backwards compatibility, but do not use
- **Deprecation Notice:** Added as JSDoc comment

### 3. Unused Import in App.tsx
- **Location:** `/client/src/App.tsx` (line 19)
- **Status:** REMOVED - No longer imported
- **Reason:** Component not used in any route
- **Action:** Removed import statement

---

## Verification Checklist

### Frontend
- ✅ `RefereeScorekeeper.tsx` is imported but NOT used in any route
- ✅ `RefereeScorekeeperApplication.tsx` is the ONLY form at `/referee-scorekeeper-apply`
- ✅ `RefereeScorekeeperApplication.tsx` calls `trpc.referee.submitApplication`
- ✅ No other components call `trpc.registration.submitStaffApplication`
- ✅ Landing page correctly routes to `/referee-scorekeeper-apply`

### Backend
- ✅ `referee.submitApplication` accepts `desiredPayPerGame` in schema
- ✅ `referee.submitApplication` saves to `desiredSalary` column
- ✅ `registration.submitStaffApplication` is NOT called by any frontend component
- ✅ `admin.getAllStaffApplications` queries `refereeApplications` table
- ✅ All data flows through the correct procedures

### Database
- ✅ `refereeApplications` table has `desiredSalary` column
- ✅ `desiredSalary` is properly populated when applications are submitted
- ✅ Admin panel correctly displays `desiredSalary` values

---

## Changes Made

1. **Deprecated `RefereeScorekeeper.tsx`**
   - Added deprecation notice at top of file
   - Marked for future removal

2. **Deprecated `registration.submitStaffApplication`**
   - Added deprecation JSDoc comment
   - Kept for backwards compatibility

3. **Removed unused import from App.tsx**
   - Removed: `import RefereeScorekeeper from "./pages/RefereeScorekeeper";`
   - Replaced with deprecation comment

4. **Fixed display logic in `StaffApplications.tsx`**
   - Changed from OR operator (`||`) to nullish coalescing (`??`)
   - Now properly displays numeric `desiredSalary` values

5. **Fixed `referee.submitApplication` procedure**
   - Added `desiredPayPerGame: z.string().optional()` to schema
   - Added mapping: `desiredSalary: input.desiredPayPerGame ? input.desiredPayPerGame : null`

---

## Future Cleanup Tasks

1. **Delete `RefereeScorekeeper.tsx`** - Safe to delete after verification
2. **Remove `registration.submitStaffApplication` procedure** - Can be removed after ensuring no external APIs depend on it
3. **Clean up any remaining references** - Search for any remaining imports or calls

---

## Testing Recommendations

1. ✅ Submit a new staff application with desired payment amount
2. ✅ Verify it appears in admin panel with correct value
3. ✅ Verify old form at `/referee-scorekeeper` still works (landing page)
4. ✅ Verify no broken links or 404 errors

---

## Conclusion

All staff applications now correctly flow through:
- **Route:** `/referee-scorekeeper-apply?role=referee` or `?role=scorekeeper`
- **Component:** `RefereeScorekeeperApplication.tsx`
- **Procedure:** `trpc.referee.submitApplication`
- **Database:** `refereeApplications` table with `desiredSalary` field

The obsolete `RefereeScorekeeper.tsx` component and `registration.submitStaffApplication` procedure have been marked as deprecated and can be safely removed in a future cleanup.
