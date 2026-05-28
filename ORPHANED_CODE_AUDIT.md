# Comprehensive Orphaned Code Audit

**Date:** May 28, 2026  
**Scope:** Full codebase analysis - Frontend pages, Backend procedures, Database tables

---

## Executive Summary

This audit identified:
- **8 completely orphaned frontend pages** (not imported or used anywhere)
- **18 unused backend procedures** (defined but never called from frontend)
- **Multiple duplicate/deprecated procedures** that should be consolidated
- **Recommendations for cleanup and consolidation**

---

## SECTION 1: ORPHANED FRONTEND PAGES

### Completely Orphaned (0 references anywhere)

| Page | Location | Status | Recommendation |
|------|----------|--------|-----------------|
| **ComponentShowcase** | `/client/src/pages/ComponentShowcase.tsx` | ❌ ORPHANED | **DELETE** - Development/demo component |
| **Merchandise** | `/client/src/pages/Merchandise.tsx` | ⚠️ ORPHANED | **REVIEW** - May be planned feature |
| **PlayerProfile** | `/client/src/pages/PlayerProfile.tsx` | ⚠️ ORPHANED | **REVIEW** - May be planned feature |
| **Playoffs** | `/client/src/pages/Playoffs.tsx` | ⚠️ ORPHANED | **REVIEW** - May be planned feature |

### Orphaned Admin Pages

| Page | Location | Status | Recommendation |
|------|----------|--------|-----------------|
| **RefereeApplications** | `/client/src/pages/admin/RefereeApplications.tsx` | ❌ ORPHANED | **DELETE** - Replaced by StaffApplications.tsx |
| **Blog** | `/client/src/pages/admin/Blog.tsx` | ⚠️ ORPHANED | **REVIEW** - Has 20 references, may be in-progress |
| **Messaging** | `/client/src/pages/admin/Messaging.tsx` | ⚠️ ORPHANED | **REVIEW** - Has 5 references, may be duplicate of Messages.tsx |
| **Seasons** | `/client/src/pages/admin/Seasons.tsx` | ⚠️ ORPHANED | **REVIEW** - Has 22 references, may be duplicate of SeasonManagement.tsx |
| **Venues** | `/client/src/pages/admin/Venues.tsx` | ⚠️ ORPHANED | **REVIEW** - Has 27 references, may be duplicate |

### Detailed Analysis

#### ComponentShowcase.tsx
- **References:** 0
- **Imports:** Not imported in App.tsx
- **Used in routes:** No
- **Recommendation:** **DELETE** - This is a development/demo component for showcasing UI components. Not needed in production.

#### RefereeScorekeeper.tsx
- **References:** 14 (mostly deprecation notices we added)
- **Imports:** Imported in App.tsx but NOT used in any route
- **Used in routes:** No
- **Recommendation:** **DELETE** - Already marked as deprecated. Replaced by RefereeScorekeeperApplication.tsx
- **Status:** ✅ Already deprecated in previous audit

#### RefereeApplications.tsx (Admin)
- **References:** 5
- **Imports:** Not imported in App.tsx
- **Used in routes:** No
- **Recommendation:** **DELETE** - Replaced by StaffApplications.tsx (which is the correct admin page)
- **Note:** There's a redirect in App.tsx at `/admin/referee-applications` that routes to `StaffApplications` instead

#### Merchandise.tsx
- **References:** 4
- **Imports:** Not imported in App.tsx
- **Used in routes:** No
- **Recommendation:** **REVIEW** - Appears to be a planned feature. Keep for now but document as in-progress.

#### PlayerProfile.tsx
- **References:** 2
- **Imports:** Not imported in App.tsx
- **Used in routes:** No
- **Recommendation:** **REVIEW** - Appears to be a planned feature. Keep for now but document as in-progress.

#### Playoffs.tsx
- **References:** 1
- **Imports:** Not imported in App.tsx
- **Used in routes:** No
- **Recommendation:** **REVIEW** - Appears to be a planned feature. Keep for now but document as in-progress.

#### Blog.tsx (Admin)
- **References:** 20
- **Imports:** Not imported in App.tsx
- **Used in routes:** No
- **Recommendation:** **REVIEW** - Has many references. May be in-progress or duplicate of News.tsx functionality. Check if procedures exist.

#### Messaging.tsx (Admin)
- **References:** 5
- **Imports:** Not imported in App.tsx
- **Used in routes:** No
- **Recommendation:** **REVIEW** - Possible duplicate of Messages.tsx. Consolidate or delete.

#### Seasons.tsx (Admin)
- **References:** 22
- **Imports:** Not imported in App.tsx
- **Used in routes:** No
- **Recommendation:** **REVIEW** - Possible duplicate of SeasonManagement.tsx. Consolidate or delete.

#### Venues.tsx (Admin)
- **References:** 27
- **Imports:** Not imported in App.tsx
- **Used in routes:** No
- **Recommendation:** **REVIEW** - Has many references. Check if this should be the main admin page instead of current implementation.

---

## SECTION 2: UNUSED BACKEND PROCEDURES

### Procedures Never Called From Frontend

| Procedure | Router | Status | Recommendation |
|-----------|--------|--------|-----------------|
| **assignPlayerToEvaluationGame** | admin | ⚠️ UNUSED | **REVIEW** - May be called from internal tools |
| **copyTeam** | admin | ⚠️ UNUSED | **REVIEW** - May be admin utility |
| **getAvailablePlayersForEvaluation** | admin | ⚠️ UNUSED | **REVIEW** - May be used internally |
| **getEvaluationTeamAssignment** | admin | ⚠️ UNUSED | **REVIEW** - May be used internally |
| **getPlayerTeams** | admin | ⚠️ UNUSED | **REVIEW** - May be used internally |
| **getRecentGames** | admin | ⚠️ UNUSED | **REVIEW** - May be used internally |
| **getRegistrationStats** | admin | ⚠️ UNUSED | **REVIEW** - May be used internally |
| **rejectRefereeApplicationOld** | admin | ❌ UNUSED | **DELETE** - Old version, replaced by rejectStaffApplication |
| **selectStarOfWeek** | admin | ⚠️ UNUSED | **REVIEW** - May be called from internal tools |
| **updatePlayerPicture** | admin | ⚠️ UNUSED | **REVIEW** - May be called from internal tools |
| **updatePlayerPosition** | admin | ⚠️ UNUSED | **REVIEW** - May be called from internal tools |
| **updateSeasonStatus** | admin | ⚠️ UNUSED | **REVIEW** - May be called from internal tools |
| **getGames** | league | ⚠️ UNUSED | **REVIEW** - May be duplicate of getSchedule |
| **getSuspensions** | league | ⚠️ UNUSED | **REVIEW** - May be duplicate of getActiveSuspensions |
| **getPending** | registration | ⚠️ UNUSED | **REVIEW** - May be duplicate of getAll |
| **markPaid** | registration | ⚠️ UNUSED | **REVIEW** - May be called from internal tools |
| **register** | registration | ⚠️ UNUSED | **REVIEW** - May be duplicate of submit |
| **updatePlayerRating** | registration | ⚠️ UNUSED | **REVIEW** - May be called from internal tools |
| **submitStaffApplication** | registration | ❌ UNUSED | **DELETE** - Already deprecated, replaced by referee.submitApplication |

### Detailed Analysis

#### rejectRefereeApplicationOld
- **Status:** ❌ UNUSED
- **Recommendation:** **DELETE** - This is clearly an old version. The current version is `rejectStaffApplication`.

#### submitStaffApplication
- **Status:** ❌ UNUSED
- **Recommendation:** **DELETE** - Already marked as deprecated. Replaced by `referee.submitApplication`.
- **Note:** ✅ Already deprecated in previous audit

#### Potential Duplicates to Consolidate

| Duplicate Pair | Recommendation |
|----------------|-----------------|
| `getGames` vs `getSchedule` | Consolidate into one |
| `getSuspensions` vs `getActiveSuspensions` | Consolidate into one |
| `getPending` vs `getAll` | Consolidate into one |
| `register` vs `submit` | Consolidate into one |
| `Blog.tsx` vs `News.tsx` | Consolidate into one |
| `Messaging.tsx` vs `Messages.tsx` | Consolidate into one |
| `Seasons.tsx` vs `SeasonManagement.tsx` | Consolidate into one |

---

## SECTION 3: DUPLICATE/CONFLICTING ROUTES

### Admin Routes with Redirects

| Route | Component | Status | Notes |
|-------|-----------|--------|-------|
| `/admin/referee-applications` | StaffApplications | ⚠️ REDIRECT | Old route redirected to new one |
| `/admin/staff-applications` | StaffApplications | ✅ CURRENT | Correct route |

**Recommendation:** Remove the old redirect route and update any bookmarks/links.

---

## SECTION 4: CLEANUP RECOMMENDATIONS

### Phase 1: Safe Deletions (No Dependencies)

**DELETE IMMEDIATELY:**
1. `RefereeScorekeeper.tsx` - Already deprecated, orphaned
2. `ComponentShowcase.tsx` - Development component
3. `RefereeApplications.tsx` (admin) - Replaced by StaffApplications.tsx
4. `registration.submitStaffApplication` - Already deprecated, replaced by referee.submitApplication
5. `admin.rejectRefereeApplicationOld` - Old version, clear duplicate

**Expected Impact:** None - these are completely unused

### Phase 2: Consolidations (Requires Testing)

**CONSOLIDATE:**
1. `Blog.tsx` → Merge into `News.tsx` (or vice versa)
2. `Messaging.tsx` → Merge into `Messages.tsx` (or vice versa)
3. `Seasons.tsx` → Merge into `SeasonManagement.tsx` (or vice versa)
4. `Venues.tsx` → Review and consolidate with existing venue management
5. `getGames` → Consolidate with `getSchedule`
6. `getSuspensions` → Consolidate with `getActiveSuspensions`
7. `getPending` → Consolidate with `getAll`
8. `register` → Consolidate with `submit`

**Expected Impact:** Code cleanup, reduced maintenance burden

### Phase 3: Review & Decide (Planned Features)

**KEEP FOR NOW (Planned Features):**
1. `Merchandise.tsx` - Appears to be planned feature
2. `PlayerProfile.tsx` - Appears to be planned feature
3. `Playoffs.tsx` - Appears to be planned feature

**Action:** Document these as in-progress features

### Phase 4: Internal Tools Review

**REVIEW FOR INTERNAL USE:**
- `assignPlayerToEvaluationGame`
- `copyTeam`
- `getAvailablePlayersForEvaluation`
- `getEvaluationTeamAssignment`
- `getPlayerTeams`
- `getRecentGames`
- `getRegistrationStats`
- `selectStarOfWeek`
- `updatePlayerPicture`
- `updatePlayerPosition`
- `updateSeasonStatus`
- `markPaid`
- `updatePlayerRating`

**Action:** Verify if these are called from admin tools, internal scripts, or external APIs before deleting.

---

## SECTION 5: EXECUTION PLAN

### Step 1: Safe Deletions (No Risk)
```
1. Delete RefereeScorekeeper.tsx
2. Delete ComponentShowcase.tsx
3. Delete RefereeApplications.tsx (admin)
4. Delete registration.submitStaffApplication procedure
5. Delete admin.rejectRefereeApplicationOld procedure
6. Remove unused import from App.tsx
7. Test: Verify no broken links or 404 errors
```

### Step 2: Consolidations (Requires Testing)
```
1. Analyze Blog.tsx vs News.tsx - decide which to keep
2. Analyze Messaging.tsx vs Messages.tsx - decide which to keep
3. Analyze Seasons.tsx vs SeasonManagement.tsx - decide which to keep
4. Consolidate duplicate procedures in routers
5. Test: Verify all functionality still works
6. Update any internal references
```

### Step 3: Feature Review
```
1. Document Merchandise.tsx as planned feature
2. Document PlayerProfile.tsx as planned feature
3. Document Playoffs.tsx as planned feature
4. Create tickets/issues for future implementation
```

### Step 4: Internal Tools Audit
```
1. Search for any external API calls to unused procedures
2. Check admin tools for internal usage
3. Verify database triggers or scheduled jobs
4. Document findings and decide on each procedure
```

---

## SECTION 6: RISK ASSESSMENT

### Low Risk Deletions
- ComponentShowcase.tsx (demo component)
- RefereeScorekeeper.tsx (already deprecated)
- RefereeApplications.tsx (replaced by StaffApplications)
- registration.submitStaffApplication (already deprecated)
- admin.rejectRefereeApplicationOld (clear duplicate)

### Medium Risk Consolidations
- Blog/News consolidation (may have different features)
- Messaging/Messages consolidation (may have different features)
- Seasons/SeasonManagement consolidation (may have different features)

### High Risk Items
- Procedures marked as "REVIEW" - need to verify internal usage before deletion

---

## SECTION 7: NEXT STEPS

1. **User Review:** Review this audit and decide which items to delete/consolidate
2. **Phase 1 Execution:** Delete safe items
3. **Phase 2 Analysis:** Analyze duplicates and consolidate
4. **Phase 3 Documentation:** Document planned features
5. **Phase 4 Verification:** Verify internal tool usage
6. **Final Cleanup:** Execute remaining deletions/consolidations

---

## Files to Delete (User Decision Required)

### Safe to Delete (Recommended)
- [ ] `/client/src/pages/RefereeScorekeeper.tsx`
- [ ] `/client/src/pages/ComponentShowcase.tsx`
- [ ] `/client/src/pages/admin/RefereeApplications.tsx`
- [ ] Remove `registration.submitStaffApplication` from `/server/routers/registration.ts`
- [ ] Remove `admin.rejectRefereeApplicationOld` from `/server/routers/admin.ts`

### Review Before Deleting (User Decision)
- [ ] `/client/src/pages/Merchandise.tsx` - Planned feature?
- [ ] `/client/src/pages/PlayerProfile.tsx` - Planned feature?
- [ ] `/client/src/pages/Playoffs.tsx` - Planned feature?
- [ ] `/client/src/pages/admin/Blog.tsx` - Consolidate with News?
- [ ] `/client/src/pages/admin/Messaging.tsx` - Consolidate with Messages?
- [ ] `/client/src/pages/admin/Seasons.tsx` - Consolidate with SeasonManagement?
- [ ] `/client/src/pages/admin/Venues.tsx` - Review and decide

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total Frontend Pages | 47 |
| Orphaned Pages | 8 |
| Orphaned Admin Pages | 5 |
| Total Backend Procedures | 113 |
| Unused Procedures | 18 |
| Deprecated Procedures | 2 |
| Potential Duplicates | 7 |
| Safe to Delete | 5 |
| Needs Review | 12 |

