export type Position = "forward" | "defenseman" | "goalie" | "flexible" | null;

export interface Player {
  id: string | number;
  name: string;
  rating: number; // 1-10
  position: Position;
  wantsCaptain: boolean;
  assignedPosition?: Position;
}

export interface Team {
  id: number;
  name: string;
  captainId?: string | number;
  captainName: string | null;
  players: Player[];
  averageRating: number;
  positionBreakdown: { forward: number; defenseman: number; goalie: number };
}

export function calculateTeamRating(team: Player[]): number {
  if (team.length === 0) return 0;
  const sum = team.reduce((acc, p) => acc + p.rating, 0);
  return Number((sum / team.length).toFixed(2));
}

export function assignPositions(team: Player[], positions: string[]): void {
  const breakdown = { forward: 0, defenseman: 0, goalie: 0 };
  const flexiblePlayers: Player[] = [];

  for (const p of team) {
    if (p.position === "forward" || p.position === "defenseman" || p.position === "goalie") {
      breakdown[p.position]++;
      p.assignedPosition = p.position;
    } else {
      flexiblePlayers.push(p);
    }
  }

  flexiblePlayers.sort((a, b) => b.rating - a.rating);

  const teamSize = team.length;
  const targetGoalies = 1;
  const targetDefense = Math.max(1, Math.floor(teamSize * 0.35)); // Roughly 3-4 D

  for (const p of flexiblePlayers) {
    if (breakdown.goalie < targetGoalies) {
      p.assignedPosition = "goalie";
      breakdown.goalie++;
    } else if (breakdown.defenseman < targetDefense) {
      p.assignedPosition = "defenseman";
      breakdown.defenseman++;
    } else {
      p.assignedPosition = "forward";
      breakdown.forward++;
    }
  }
}

export function selectCaptains(teams: Team[], captainCandidates: Player[]): void {
  const candidateIds = new Set(captainCandidates.map(c => c.id));

  for (const team of teams) {
    const interested = team.players.filter(p => candidateIds.has(p.id));
    interested.sort((a, b) => b.rating - a.rating);

    if (interested.length > 0) {
      team.captainId = interested[0].id;
      team.captainName = interested[0].name;
    } else {
      const allPlayers = [...team.players].sort((a, b) => b.rating - a.rating);
      if (allPlayers.length > 0) {
        team.captainId = allPlayers[0].id;
        team.captainName = allPlayers[0].name;
      }
    }
  }
}

export function validateInput(players: Player[]): boolean {
  if (!players || players.length === 0) return false;
  return players.every(p => p.rating >= 1 && p.rating <= 10);
}

export function balanceTeams(players: Player[]): Team[] {
  if (!validateInput(players)) throw new Error("Invalid player pool data.");

  const goalies = players.filter(p => p.position === 'goalie').sort((a, b) => b.rating - a.rating);
  const defenders = players.filter(p => p.position === 'defenseman').sort((a, b) => b.rating - a.rating);
  const forwards = players.filter(p => p.position === 'forward').sort((a, b) => b.rating - a.rating);
  const flexible = players.filter(p => p.position !== 'goalie' && p.position !== 'defenseman' && p.position !== 'forward').sort((a, b) => b.rating - a.rating);

  const NUM_TEAMS = 4;
  const teams: Team[] = Array.from({ length: NUM_TEAMS }, (_, i) => ({
    id: i + 1,
    name: `Team ${String.fromCharCode(65 + i)}`,
    captainName: null,
    players: [],
    averageRating: 0,
    positionBreakdown: { forward: 0, defenseman: 0, goalie: 0 }
  }));

  let direction = 1;
  let teamIdx = 0;

  const draftPool = (pool: Player[]) => {
    for (const player of pool) {
      teams[teamIdx].players.push(player);
      teamIdx += direction;
      if (teamIdx >= NUM_TEAMS) {
        teamIdx = NUM_TEAMS - 1;
        direction = -1;
      } else if (teamIdx < 0) {
        teamIdx = 0;
        direction = 1;
      }
    }
  };

  draftPool(goalies);
  draftPool(defenders);
  draftPool(forwards);
  draftPool(flexible);

  const captainCandidates = players.filter(p => p.wantsCaptain);

  for (const team of teams) {
    assignPositions(team.players, ["forward", "defenseman", "goalie"]);

    for (const p of team.players) {
      const activePos = p.assignedPosition || p.position;
      if (activePos === "forward" || activePos === "defenseman" || activePos === "goalie") {
        team.positionBreakdown[activePos]++;
      }
    }
    team.averageRating = calculateTeamRating(team.players);
  }

  selectCaptains(teams, captainCandidates);
  return teams;
}