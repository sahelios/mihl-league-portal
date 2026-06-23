/**
 * Shared flag to suppress redirectToLoginIfUnauthorized during logout.
 *
 * Problem: when logout clears the session cookie, any queries that were
 * already in-flight on a protected page (e.g. /player-portal) return
 * UNAUTHORIZED. The global query-cache subscriber in main.tsx catches
 * those errors and redirects to the Google OAuth URL — racing against
 * and beating the explicit `window.location.href = '/'` in logout().
 *
 * Solution: set this flag to true in logout() before navigating.
 * The flag is automatically reset by the full page reload that follows.
 * Both main.tsx and useAuth.ts import the same module instance (ES module
 * singletons), so mutating it here is immediately visible everywhere.
 */
export const logoutFlag = { active: false };
