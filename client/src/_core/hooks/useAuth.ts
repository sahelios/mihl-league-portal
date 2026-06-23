import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      // If already unauthorized (session expired/missing), treat as logged out and continue.
      // Any other error is re-thrown.
      if (
        !(error instanceof TRPCClientError &&
          error.data?.code === "UNAUTHORIZED")
      ) {
        throw error;
      }
    } finally {
      // IMPORTANT: Do NOT call utils.auth.me.invalidate() here.
      //
      // Calling invalidate() while still on a protected route (e.g. /player-portal)
      // causes React Query to refetch protected procedures against the now-cleared
      // session cookie. Those refetches return UNAUTHORIZED, which triggers the
      // redirectToLoginIfUnauthorized() subscriber in main.tsx → redirects to
      // Google OAuth → Google silently re-authenticates → user is logged back in.
      //
      // The page reload below clears all React Query cache automatically.
      // No manual invalidation needed.
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, [logoutMutation]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    // Compare the full href (not just pathname) because redirectPath may be a
    // full URL (e.g. the Google OAuth URL). Comparing pathname to a full URL
    // always evaluates to false, causing an infinite redirect loop.
    if (window.location.href === redirectPath) return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
