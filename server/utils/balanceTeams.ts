/**
 * ============================================================
 * Hockey Team Auto-Balancer
 * ============================================================
 * Distributes registered players across 4 balanced teams using a
 * multi-pass greedy algorithm:
 *
 *  Pass 1 – Goalie assignment (one per team, rating-balanced)
 *  Pass 2 – Friend cluster detection (BFS on bidirectional graph)
 *  Pass 3 – Cluster placement (largest clusters first, cost-scored)
 *  Pass 4 – Individual skater assignment (cost-scored per player)
 *  Pass 5 – Validation & warnings
 *  Pass 6 – Pairwise swap suggestions to reduce imbalance
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────

export type Position = "goalie" | "defense" | "forward";
export type WarningSeverity = "error" | "warning" | "info";
export type WarningType =
  | "rating_imbalance"
  | "no_goalie"
  | "multiple_goalies"
  | "team_too_small"
  | "team_too_large"
  | "position_imbalance"
  | "friend_split"
  | "preference_ignored";

export interface Player {
  /** Unique identifier for the player */
  id: string;
  /** Display name */
  name: string;
  /** Skill rating from 1 (beginner) to 10 (elite) */
  rating: number;
  /** Primary position on the ice */
  position: Position;
  /** Which of the 4 teams (1–4) this player prefers – optional */
  preferredTeamId?: number;
  /**
   * IDs of other registered players this player wants to be on a team with.
   * Requests are treated as bidirectional (if A wants B, B is also linked to A).
   */
  friendRequests?: string[];
}

export interface TeamRoster {
  teamId: number;
  players: Player[];
  /** Mean rating of ALL players (including goalie) – used for display only */
  avgRating: number;
  /**
   * Mean rating of SKATERS only (no goalie).
   * This is what the balancing algorithm uses internally so that a
   * strong/weak goalie does not distort where skaters are placed.
   */
  skatersAvgRating: number;
  /** Breakdown of player counts by position */
  positionCounts: Record<Position, number>;
  /** True when exactly one goalie is assigned */
  hasGoalie: boolean;
}

export interface Warning {
  type: WarningType;
  severity: WarningSeverity;
  message: string;
  /** Which team IDs are implicated */
  affectedTeamIds?: number[];
  /** Player IDs directly related to this warning */
  affectedPlayerIds?: string[];
}

export interface SwapSuggestion {
  /** Player from team A who would move to team B */
  player1: { playerId: string; name: string; fromTeamId: number };
  /** Player from team B who would move to team A */
  player2: { playerId: string; name: string; fromTeamId: number };
  /** How much the swap reduces the max–min average-rating spread (positive = improvement) */
  ratingImprovement: number;
  reason: string;
}

export interface BalancingStats {
  totalPlayers: number;
  totalSkaters: number;
  totalGoalies: number;
  friendGroupsDetected: number;
  friendGroupsKeptIntact: number;
  friendGroupsSplit: number;
  preferencesHonored: number;
  preferencesIgnored: number;
}

export interface BalancingResult {
  teams: TeamRoster[];
  warnings: Warning[];
  swapSuggestions: SwapSuggestion[];
  stats: BalancingStats;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS – tweak these to adjust algorithm sensitivity
// ─────────────────────────────────────────────────────────────

const NUM_TEAMS = 4;
const MIN_PLAYERS_PER_TEAM = 10; // excluding goalie
const MAX_PLAYERS_PER_TEAM = 15; // excluding goalie
/** Avg-rating spread above this threshold triggers a rating_imbalance warning */
const RATING_IMBALANCE_THRESHOLD = 1.0;
/** Weights used when scoring a team for a candidate player/cluster assignment */
const WEIGHT = {
  ratingBalance: 2.0, // prefer the lowest skater-avg-rating team
  positionNeed: 1.5,  // reward teams that need this position
  preference: 1.0,    // bonus when player prefers this team
  size: 2.0,          // penalise teams that are already large (raised to prevent stacking)
} as const;

// ─────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────

/** Compute mean rating for a list of players (returns 0 for empty list). */
function meanRating(players: Player[]): number {
  if (players.length === 0) return 0;
  return players.reduce((sum, p) => sum + p.rating, 0) / players.length;
}

/** Recompute the derived fields on a TeamRoster after mutations. */
function refreshRoster(roster: TeamRoster): void {
  roster.avgRating = meanRating(roster.players);
  // Skater-only average: excludes the goalie so goalie quality doesn't
  // influence which team receives strong or weak skaters.
  const skaters = roster.players.filter((p) => p.position !== "goalie");
  roster.skatersAvgRating = meanRating(skaters);
  roster.positionCounts = { goalie: 0, defense: 0, forward: 0 };
  roster.hasGoalie = false;
  for (const p of roster.players) {
    roster.positionCounts[p.position]++;
    if (p.position === "goalie") roster.hasGoalie = true;
  }
}

/** Return all goalies and skaters separated from the full player list. */
function splitByPosition(players: Player[]): {
  goalies: Player[];
  skaters: Player[];
} {
  const goalies = players.filter((p) => p.position === "goalie");
  const skaters = players.filter((p) => p.position !== "goalie");
  return { goalies, skaters };
}

// ─────────────────────────────────────────────────────────────
// PASS 1 – GOALIE ASSIGNMENT
// ─────────────────────────────────────────────────────────────
/**
 * Strategy:
 * 1. Honour team preferences for goalies first.
 * 2. Sort remaining unassigned goalies from strongest to weakest.
 * 3. Use a "weakest-team-first" greedy: always assign the next goalie
 *    to the team that currently has the lowest goalie rating (or no goalie).
 * This distributes goalie talent evenly even when preferences conflict.
 */
function assignGoalies(
  goalies: Player[],
  rosters: TeamRoster[],
  warnings: Warning[],
  stats: BalancingStats
): void {
  const unassigned = [...goalies];

  // --- 1a. Respect explicit team preferences ---
  const preferring = unassigned.filter((g) => g.preferredTeamId != null);
  const noPreference = unassigned.filter((g) => g.preferredTeamId == null);

  for (const goalie of preferring) {
    const target = rosters.find((r) => r.teamId === goalie.preferredTeamId);
    if (target && !target.hasGoalie) {
      target.players.push(goalie);
      refreshRoster(target);
      stats.preferencesHonored++;
    } else {
      // Preference couldn't be honoured – treat as no-preference
      noPreference.push(goalie);
      if (target?.hasGoalie) {
        warnings.push({
          type: "preference_ignored",
          severity: "info",
          message: `Goalie ${goalie.name}'s team preference (Team ${goalie.preferredTeamId}) already has a goalie. Reassigning.`,
          affectedPlayerIds: [goalie.id],
          affectedTeamIds: [goalie.preferredTeamId!],
        });
        stats.preferencesIgnored++;
      }
    }
  }

  // --- 1b. Sort remaining goalies strongest → weakest ---
  noPreference.sort((a, b) => b.rating - a.rating);

  // --- 1c. Weakest-team-first greedy ---
  for (const goalie of noPreference) {
    // Find team with no goalie yet, picking the one with lowest overall avgRating
    const teamsWithoutGoalie = rosters
      .filter((r) => !r.hasGoalie)
      .sort((a, b) => a.avgRating - b.avgRating);

    if (teamsWithoutGoalie.length === 0) {
      // All teams already have a goalie — flag this as a surplus
      warnings.push({
        type: "multiple_goalies",
        severity: "warning",
        message: `Surplus goalie ${goalie.name} (rating ${goalie.rating}) cannot be placed without giving a team 2 goalies. Adding to smallest team.`,
        affectedPlayerIds: [goalie.id],
      });
      // Add to smallest team as an overflow skater
      const smallest = [...rosters].sort(
        (a, b) => a.players.length - b.players.length
      )[0];
      smallest.players.push(goalie);
      refreshRoster(smallest);
      continue;
    }

    teamsWithoutGoalie[0].players.push(goalie);
    refreshRoster(teamsWithoutGoalie[0]);
  }

  // --- 1d. Flag teams that still have no goalie ---
  for (const roster of rosters) {
    if (!roster.hasGoalie) {
      warnings.push({
        type: "no_goalie",
        severity: "error",
        message: `Team ${roster.teamId} has no goalie. Add a goalie before the season starts.`,
        affectedTeamIds: [roster.teamId],
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────
// PASS 2 – FRIEND CLUSTER DETECTION (BFS)
// ─────────────────────────────────────────────────────────────
/**
 * Build a bidirectional adjacency map from friendRequests, then run BFS
 * to find all connected components (friend groups).
 * Only registered player IDs are considered – ghost IDs are ignored.
 */
function detectFriendClusters(skaters: Player[]): Player[][] {
  const playerMap = new Map<string, Player>(skaters.map((p) => [p.id, p]));
  const adj = new Map<string, Set<string>>();

  // Initialise adjacency list for every skater
  for (const p of skaters) {
    if (!adj.has(p.id)) adj.set(p.id, new Set());
  }

  // Build edges (bidirectional) – ignore IDs not in the registered list
  for (const p of skaters) {
    for (const friendId of p.friendRequests ?? []) {
      if (!playerMap.has(friendId)) continue; // ghost ID – skip
      adj.get(p.id)!.add(friendId);
      if (!adj.has(friendId)) adj.set(friendId, new Set());
      adj.get(friendId)!.add(p.id);
    }
  }

  // BFS to collect connected components
  const visited = new Set<string>();
  const clusters: Player[][] = [];

  for (const p of skaters) {
    if (visited.has(p.id)) continue;
    // Start BFS from this unvisited node
    const component: Player[] = [];
    const queue: string[] = [p.id];
    visited.add(p.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(playerMap.get(current)!);
      for (const neighbour of adj.get(current) ?? []) {
        if (!visited.has(neighbour)) {
          visited.add(neighbour);
          queue.push(neighbour);
        }
      }
    }

    clusters.push(component);
  }

  return clusters;
}

// ─────────────────────────────────────────────────────────────
// PASS 3 & 4 – TEAM SCORING & ASSIGNMENT
// ─────────────────────────────────────────────────────────────

/**
 * Score how suitable `roster` is for receiving `candidates` (a cluster or
 * a single player).  Higher score = better fit.
 *
 * Scoring factors:
 *  A) Rating balance  – uses SKATER-ONLY average so a strong/weak goalie
 *     does not distort where skaters are placed.  When no skaters are yet
 *     assigned (range = 0), all teams are treated as equally strong and the
 *     size score becomes the primary differentiator.
 *  B) Position need   – bonus when the team is short on the candidate's
 *     position (target ~40% D / 60% F among skaters).
 *  C) Preference      – bonus when at least one candidate prefers this team.
 *  D) Size score      – teams with fewer skaters score higher, preventing
 *     one team from absorbing multiple large clusters before others get any.
 */
function scoreTeamForCandidates(
  roster: TeamRoster,
  candidates: Player[],
  allRosters: TeamRoster[]
): number {
  const candidateAvgRating = meanRating(candidates);

  // ── A. Rating balance (skater-only) ───────────────────────
  // Using skatersAvgRating means a team that received a weak goalie won't
  // appear artificially "weak" and unfairly attract all the strong skaters.
  const maxAvg = Math.max(...allRosters.map((r) => r.skatersAvgRating));
  const minAvg = Math.min(...allRosters.map((r) => r.skatersAvgRating));
  const ratingRange = maxAvg - minAvg;

  let ratingScore: number;
  if (ratingRange < 0.1) {
    // All teams currently equal → rating is not yet a useful signal.
    // Use a small neutral bonus so other factors (size, position) decide.
    ratingScore = 0.5 * WEIGHT.ratingBalance;
  } else {
    // Normalise team strength 0 (weakest) … 1 (strongest)
    const teamStrength = (roster.skatersAvgRating - minAvg) / ratingRange;
    // Steer strong candidates (≥5) to weaker teams; weak candidates are more
    // flexible so use a softer curve.
    ratingScore =
      candidateAvgRating >= 5
        ? (1 - teamStrength) * WEIGHT.ratingBalance
        : (0.5 + (1 - teamStrength) * 0.5) * WEIGHT.ratingBalance;
  }

  // ── B. Position need ──────────────────────────────────────
  // Target ratio: roughly 2 D for every 3 F on a 10-skater roster
  const currentSkaters = roster.players.filter(
    (p) => p.position !== "goalie"
  ).length;
  const targetDefense = Math.round(currentSkaters * 0.4);
  const targetForward = Math.round(currentSkaters * 0.6);
  const defenseNeed = Math.max(0, targetDefense - roster.positionCounts.defense);
  const forwardNeed = Math.max(0, targetForward - roster.positionCounts.forward);

  let positionScore = 0;
  for (const c of candidates) {
    if (c.position === "defense" && defenseNeed > 0) positionScore += 1;
    if (c.position === "forward" && forwardNeed > 0) positionScore += 1;
  }
  positionScore = (positionScore / candidates.length) * WEIGHT.positionNeed;

  // ── C. Team preference ────────────────────────────────────
  const preferenceCount = candidates.filter(
    (c) => c.preferredTeamId === roster.teamId
  ).length;
  const preferenceScore =
    (preferenceCount / candidates.length) * WEIGHT.preference;

  // ── D. Size score ─────────────────────────────────────────
  // This is the key anti-stacking mechanism: teams with fewer skaters score
  // proportionally higher, acting as a soft round-robin that spreads players
  // before the rating signal has had time to differentiate teams.
  const remainingCapacity = MAX_PLAYERS_PER_TEAM - currentSkaters;
  if (remainingCapacity < candidates.length) return -Infinity; // overflow guard
  // Normalise across all teams so the emptiest team scores 1.0
  const maxSkaters = Math.max(
    ...allRosters.map((r) => r.players.filter((p) => p.position !== "goalie").length)
  );
  const sizeScore =
    maxSkaters === 0
      ? 1.0 * WEIGHT.size
      : (1 - currentSkaters / (maxSkaters + candidates.length)) * WEIGHT.size;

  return ratingScore + positionScore + preferenceScore + sizeScore;
}

/**
 * Assign a group of players (cluster) to the best-scoring team.
 * Returns true if assignment succeeded, false if all teams are full.
 */
function assignClusterToTeam(
  cluster: Player[],
  rosters: TeamRoster[],
  stats: BalancingStats,
  warnings: Warning[],
  isMultiPlayerCluster: boolean
): boolean {
  // Score every team and pick the highest
  const scored = rosters
    .map((r) => ({ roster: r, score: scoreTeamForCandidates(r, cluster, rosters) }))
    .filter((s) => s.score > -Infinity)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return false; // no team can fit this cluster

  const best = scored[0].roster;

  // Check if any player in the cluster preferred a different team
  for (const player of cluster) {
    if (player.preferredTeamId != null && player.preferredTeamId !== best.teamId) {
      // Preference was overridden by balancing constraints
      warnings.push({
        type: "preference_ignored",
        severity: "info",
        message: `${player.name} preferred Team ${player.preferredTeamId} but was placed on Team ${best.teamId} to maintain balance.`,
        affectedPlayerIds: [player.id],
        affectedTeamIds: [player.preferredTeamId, best.teamId],
      });
      stats.preferencesIgnored++;
    } else if (player.preferredTeamId === best.teamId) {
      stats.preferencesHonored++;
    }
  }

  for (const player of cluster) {
    best.players.push(player);
  }
  refreshRoster(best);

  if (isMultiPlayerCluster) {
    stats.friendGroupsKeptIntact++;
  }

  return true;
}

/**
 * Assign friend clusters then solo players to teams.
 * Processing order: largest cluster → smallest → singletons.
 * This ensures big friend groups are placed first (harder to fit) before
 * remaining capacity is consumed by individual players.
 */
function assignSkaters(
  skaters: Player[],
  rosters: TeamRoster[],
  warnings: Warning[],
  stats: BalancingStats
): void {
  // ── Detect friend clusters ────────────────────────────────
  const clusters = detectFriendClusters(skaters);
  stats.friendGroupsDetected = clusters.filter((c) => c.length > 1).length;

  // Sort: largest clusters first, then by descending average rating
  // (placing strong clusters early gives balancer more room to manoeuvre)
  clusters.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return meanRating(b) - meanRating(a);
  });

  for (const cluster of clusters) {
    const isGroup = cluster.length > 1;

    const success = assignClusterToTeam(
      cluster,
      rosters,
      stats,
      warnings,
      isGroup
    );

    if (!success) {
      // All teams are full – shouldn't happen within player limits but handle gracefully
      if (isGroup) {
        // Try splitting the cluster as a last resort
        stats.friendGroupsSplit++;
        warnings.push({
          type: "friend_split",
          severity: "warning",
          message: `Friend group [${cluster.map((p) => p.name).join(", ")}] could not be kept together due to roster capacity. They were split across teams.`,
          affectedPlayerIds: cluster.map((p) => p.id),
        });
        // Assign individually
        for (const player of cluster) {
          assignClusterToTeam([player], rosters, stats, warnings, false);
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// PASS 5 – VALIDATION & WARNINGS
// ─────────────────────────────────────────────────────────────

function validateTeams(
  rosters: TeamRoster[],
  warnings: Warning[]
): void {
  // Use skater-only averages for the imbalance check — this is the number
  // that actually reflects competitive equity on the ice.
  const skaterAvgs = rosters.map((r) => r.skatersAvgRating);
  const maxAvg = Math.max(...skaterAvgs);
  const minAvg = Math.min(...skaterAvgs);
  const spread = maxAvg - minAvg;

  // ── Rating balance ────────────────────────────────────────
  if (spread > RATING_IMBALANCE_THRESHOLD) {
    const strongTeams = rosters
      .filter((r) => r.skatersAvgRating === maxAvg)
      .map((r) => r.teamId);
    const weakTeams = rosters
      .filter((r) => r.skatersAvgRating === minAvg)
      .map((r) => r.teamId);
    warnings.push({
      type: "rating_imbalance",
      severity: spread > 1.5 ? "error" : "warning",
      message:
        `Skater rating spread between teams is ${spread.toFixed(2)} points ` +
        `(Team ${strongTeams.join("/")} skater avg: ${maxAvg.toFixed(2)}, ` +
        `Team ${weakTeams.join("/")} skater avg: ${minAvg.toFixed(2)}). ` +
        `Threshold is ${RATING_IMBALANCE_THRESHOLD}.`,
      affectedTeamIds: [...strongTeams, ...weakTeams],
    });
  }

  for (const roster of rosters) {
    const skaterCount = roster.players.filter(
      (p) => p.position !== "goalie"
    ).length;

    // ── Size checks ───────────────────────────────────────
    if (skaterCount < MIN_PLAYERS_PER_TEAM) {
      warnings.push({
        type: "team_too_small",
        severity: "error",
        message: `Team ${roster.teamId} has only ${skaterCount} skaters (minimum is ${MIN_PLAYERS_PER_TEAM}).`,
        affectedTeamIds: [roster.teamId],
      });
    }
    if (skaterCount > MAX_PLAYERS_PER_TEAM) {
      warnings.push({
        type: "team_too_large",
        severity: "error",
        message: `Team ${roster.teamId} has ${skaterCount} skaters (maximum is ${MAX_PLAYERS_PER_TEAM}).`,
        affectedTeamIds: [roster.teamId],
      });
    }

    // ── Position balance ──────────────────────────────────
    // Expected: ~40% D, ~60% F among skaters
    if (skaterCount > 0) {
      const dRatio = roster.positionCounts.defense / skaterCount;
      const fRatio = roster.positionCounts.forward / skaterCount;
      if (dRatio < 0.25 || dRatio > 0.55) {
        warnings.push({
          type: "position_imbalance",
          severity: "warning",
          message:
            `Team ${roster.teamId} has an unusual D/F ratio: ` +
            `${roster.positionCounts.defense}D / ${roster.positionCounts.forward}F ` +
            `(${(dRatio * 100).toFixed(0)}% D). Expected ~25–55% D.`,
          affectedTeamIds: [roster.teamId],
        });
      }
      if (fRatio < 0.45 || fRatio > 0.75) {
        warnings.push({
          type: "position_imbalance",
          severity: "warning",
          message:
            `Team ${roster.teamId} has an unusual F ratio: ` +
            `${roster.positionCounts.forward} forwards out of ${skaterCount} skaters ` +
            `(${(fRatio * 100).toFixed(0)}%). Expected ~45–75% F.`,
          affectedTeamIds: [roster.teamId],
        });
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// PASS 6 – PAIRWISE SWAP SUGGESTIONS
// ─────────────────────────────────────────────────────────────
/**
 * Enumerate all same-position swaps between the strongest and weakest teams.
 * Keep only swaps that genuinely reduce the spread, sorted by improvement.
 * Limits output to the top-5 suggestions to keep output readable.
 */
function generateSwapSuggestions(rosters: TeamRoster[]): SwapSuggestion[] {
  const suggestions: SwapSuggestion[] = [];
  // Swap analysis uses skater-only averages — same basis as the balancer.
  const skaterAvgs = rosters.map((r) => r.skatersAvgRating);
  const currentSpread =
    Math.max(...skaterAvgs) - Math.min(...skaterAvgs);

  // Only generate suggestions when there's meaningful imbalance
  if (currentSpread <= RATING_IMBALANCE_THRESHOLD / 2) return [];

  for (let i = 0; i < rosters.length; i++) {
    for (let j = i + 1; j < rosters.length; j++) {
      const teamA = rosters[i];
      const teamB = rosters[j];

      // Only consider swaps between teams with meaningfully different skater averages
      if (Math.abs(teamA.skatersAvgRating - teamB.skatersAvgRating) < 0.3) continue;

      const skatersA = teamA.players.filter((p) => p.position !== "goalie");
      const skatersB = teamB.players.filter((p) => p.position !== "goalie");

      for (const pa of skatersA) {
        for (const pb of skatersB) {
          // Only swap same-position players to preserve team compositions
          if (pa.position !== pb.position) continue;
          // No point swapping equal-rated players
          if (pa.rating === pb.rating) continue;

          // Simulate the swap using skater-only counts
          const newAvgA =
            (teamA.skatersAvgRating * skatersA.length - pa.rating + pb.rating) /
            skatersA.length;
          const newAvgB =
            (teamB.skatersAvgRating * skatersB.length - pb.rating + pa.rating) /
            skatersB.length;

          // Compute new overall skater-avg spread after the swap
          const otherAvgs = skaterAvgs.filter((_, idx) => idx !== i && idx !== j);
          const newSpread =
            Math.max(newAvgA, newAvgB, ...otherAvgs) -
            Math.min(newAvgA, newAvgB, ...otherAvgs);

          const improvement = currentSpread - newSpread;
          if (improvement > 0.05) {
            suggestions.push({
              player1: { playerId: pa.id, name: pa.name, fromTeamId: teamA.teamId },
              player2: { playerId: pb.id, name: pb.name, fromTeamId: teamB.teamId },
              ratingImprovement: Math.round(improvement * 100) / 100,
              reason:
                `Swapping ${pa.name} (★${pa.rating}, Team ${teamA.teamId}) ↔ ` +
                `${pb.name} (★${pb.rating}, Team ${teamB.teamId}) reduces skater ` +
                `avg spread from ${currentSpread.toFixed(2)} → ${newSpread.toFixed(2)}.`,
            });
          }
        }
      }
    }
  }

  // Return top-5 most impactful suggestions
  return suggestions
    .sort((a, b) => b.ratingImprovement - a.ratingImprovement)
    .slice(0, 5);
}

// ─────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────

/**
 * Auto-generate 4 balanced hockey team rosters from a list of registered players.
 *
 * @param players  Full array of registered players (all positions).
 * @returns        BalancingResult containing rosters, warnings, swap suggestions, and stats.
 *
 * @example
 * const result = balanceHockeyTeams(players);
 * result.teams.forEach(t => console.log(`Team ${t.teamId}: avg rating ${t.avgRating.toFixed(2)}`));
 * result.warnings.forEach(w => console.warn(`[${w.severity.toUpperCase()}] ${w.message}`));
 */
export function balanceHockeyTeams(players: Player[]): BalancingResult {
  // ── Input validation ─────────────────────────────────────
  if (!Array.isArray(players) || players.length === 0) {
    throw new Error("players must be a non-empty array.");
  }
  for (const p of players) {
    if (p.rating < 1 || p.rating > 10) {
      throw new Error(
        `Player ${p.name} has an invalid rating: ${p.rating}. Must be 1–10.`
      );
    }
    if (p.preferredTeamId != null && (p.preferredTeamId < 1 || p.preferredTeamId > NUM_TEAMS)) {
      throw new Error(
        `Player ${p.name} has an invalid preferredTeamId: ${p.preferredTeamId}. Must be 1–${NUM_TEAMS}.`
      );
    }
  }

  // ── Initialise empty rosters ─────────────────────────────
  const rosters: TeamRoster[] = Array.from({ length: NUM_TEAMS }, (_, i) => ({
    teamId: i + 1,
    players: [],
    avgRating: 0,
    skatersAvgRating: 0,
    positionCounts: { goalie: 0, defense: 0, forward: 0 },
    hasGoalie: false,
  }));

  const warnings: Warning[] = [];
  const stats: BalancingStats = {
    totalPlayers: players.length,
    totalSkaters: 0,
    totalGoalies: 0,
    friendGroupsDetected: 0,
    friendGroupsKeptIntact: 0,
    friendGroupsSplit: 0,
    preferencesHonored: 0,
    preferencesIgnored: 0,
  };

  const { goalies, skaters } = splitByPosition(players);
  stats.totalGoalies = goalies.length;
  stats.totalSkaters = skaters.length;

  // ── Pass 1: Goalies ───────────────────────────────────────
  assignGoalies(goalies, rosters, warnings, stats);

  // ── Passes 2–4: Skaters (clusters + individuals) ─────────
  assignSkaters(skaters, rosters, warnings, stats);

  // ── Pass 5: Validate ─────────────────────────────────────
  validateTeams(rosters, warnings);

  // ── Pass 6: Swap suggestions ─────────────────────────────
  const swapSuggestions = generateSwapSuggestions(rosters);

  // Sort warnings: errors first, then warnings, then info
  const severityOrder: Record<WarningSeverity, number> = {
    error: 0,
    warning: 1,
    info: 2,
  };
  warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return { teams: rosters, warnings, swapSuggestions, stats };
}

// ─────────────────────────────────────────────────────────────
// FORMATTING HELPER  (optional convenience utility)
// ─────────────────────────────────────────────────────────────

/**
 * Pretty-print a BalancingResult to the console.
 * Useful for quick CLI debugging.
 */
export function printBalancingResult(result: BalancingResult): void {
  console.log("\n══════════════════════════════════════");
  console.log("   HOCKEY TEAM BALANCING RESULT");
  console.log("══════════════════════════════════════");

  for (const team of result.teams) {
    console.log(
      `\nTeam ${team.teamId}  │  Players: ${team.players.length}  │  Avg Rating: ${team.avgRating.toFixed(2)}` +
      `  │  G:${team.positionCounts.goalie} D:${team.positionCounts.defense} F:${team.positionCounts.forward}`
    );
    for (const p of team.players) {
      const pref = p.preferredTeamId ? ` (pref T${p.preferredTeamId})` : "";
      console.log(
        `  · ${p.name.padEnd(20)} ${p.position.padEnd(8)} ★${p.rating}${pref}`
      );
    }
  }

  if (result.warnings.length > 0) {
    console.log("\n── WARNINGS ──────────────────────────");
    for (const w of result.warnings) {
      const icon = w.severity === "error" ? "🔴" : w.severity === "warning" ? "🟡" : "🔵";
      console.log(`${icon} [${w.severity.toUpperCase()}] ${w.message}`);
    }
  }

  if (result.swapSuggestions.length > 0) {
    console.log("\n── SWAP SUGGESTIONS ──────────────────");
    for (const s of result.swapSuggestions) {
      console.log(`  ↔  ${s.reason}`);
    }
  }

  console.log("\n── STATS ─────────────────────────────");
  console.log(
    `  Total players  : ${result.stats.totalPlayers}` +
    ` (${result.stats.totalGoalies}G + ${result.stats.totalSkaters} skaters)`
  );
  console.log(
    `  Friend groups  : ${result.stats.friendGroupsDetected} detected, ` +
    `${result.stats.friendGroupsKeptIntact} intact, ` +
    `${result.stats.friendGroupsSplit} split`
  );
  console.log(
    `  Preferences    : ${result.stats.preferencesHonored} honoured, ` +
    `${result.stats.preferencesIgnored} overridden`
  );
  console.log("══════════════════════════════════════\n");
}

// ─────────────────────────────────────────────────────────────
// QUICK SMOKE TEST  (run with: npx ts-node balanceTeams.ts)
// ─────────────────────────────────────────────────────────────

const examplePlayers: Player[] = [
  // Goalies
  { id: "g1", name: "Marc Fleury",    rating: 9, position: "goalie", preferredTeamId: 1 },
  { id: "g2", name: "Carey Price",    rating: 8, position: "goalie" },
  { id: "g3", name: "Jake Allen",     rating: 6, position: "goalie", preferredTeamId: 3 },
  { id: "g4", name: "Sam Montembeault",rating: 7, position: "goalie" },

  // Defenders
  { id: "d1", name: "Shea Weber",     rating: 9, position: "defense", preferredTeamId: 1, friendRequests: ["d2"] },
  { id: "d2", name: "P.K. Subban",    rating: 8, position: "defense", friendRequests: ["d1"] },
  { id: "d3", name: "Mike Matheson",  rating: 7, position: "defense", friendRequests: ["d4", "f3"] },
  { id: "d4", name: "Jeff Petry",     rating: 7, position: "defense", friendRequests: ["d3"] },
  { id: "d5", name: "Ben Chiarot",    rating: 6, position: "defense" },
  { id: "d6", name: "David Savard",   rating: 6, position: "defense" },
  { id: "d7", name: "Chris Wideman",  rating: 5, position: "defense", preferredTeamId: 2 },
  { id: "d8", name: "Victor Mete",    rating: 5, position: "defense" },

  // Forwards
  { id: "f1",  name: "Nick Suzuki",   rating: 9, position: "forward", preferredTeamId: 2, friendRequests: ["f2"] },
  { id: "f2",  name: "Brendan Gallagher", rating: 8, position: "forward", friendRequests: ["f1"] },
  { id: "f3",  name: "Josh Anderson", rating: 7, position: "forward", friendRequests: ["d3"] },
  { id: "f4",  name: "Jonathan Drouin", rating: 7, position: "forward", preferredTeamId: 4 },
  { id: "f5",  name: "Cole Caufield",  rating: 9, position: "forward" },
  { id: "f6",  name: "Kirby Dach",    rating: 7, position: "forward" },
  { id: "f7",  name: "Christian Dvorak", rating: 6, position: "forward" },
  { id: "f8",  name: "Joel Armia",    rating: 6, position: "forward" },
  { id: "f9",  name: "Sean Monahan",  rating: 7, position: "forward", preferredTeamId: 3, friendRequests: ["f10"] },
  { id: "f10", name: "Tyler Toffoli", rating: 7, position: "forward", friendRequests: ["f9"] },
  { id: "f11", name: "Michael Pezzetta", rating: 5, position: "forward" },
  { id: "f12", name: "Rem Pitlick",   rating: 5, position: "forward" },
  { id: "f13", name: "Laurent Dauphin", rating: 4, position: "forward" },
  { id: "f14", name: "Jake Evans",    rating: 5, position: "forward" },
  { id: "f15", name: "Ryan Poehling", rating: 5, position: "forward" },
  { id: "f16", name: "Cedric Paquette", rating: 4, position: "forward" },
];

// Uncomment the next two lines to run the smoke test:
// const result = balanceHockeyTeams(examplePlayers);
// printBalancingResult(result);
