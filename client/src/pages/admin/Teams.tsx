import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2, ArrowLeft, Users, UserX, GripVertical, Shield } from 'lucide-react';
import { toast } from 'sonner';

const POSITION_LABELS: Record<string, string> = {
  forward: 'F', defenseman: 'D', defense: 'D', goalie: 'G',
};

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
};

const TEAM_COLORS: string[] = [
  'border-blue-500 bg-blue-50',
  'border-red-500 bg-red-50',
  'border-green-500 bg-green-50',
  'border-purple-500 bg-purple-50',
];

export default function AdminTeams() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [draggedPlayer, setDraggedPlayer] = useState<any>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  if (!loading && (!user || user.email !== 'sarzouan@gmail.com')) {
    navigate('/');
    return null;
  }

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: seasons = [] } = trpc.admin.getSeasons.useQuery();
  const activeSeason = (seasons as any[]).find((s: any) => s.isActive);
  const activeSeasonId = activeSeason?.id;

  const { data: teams = [], isLoading: loadingTeams } = trpc.admin.getTeams.useQuery(
    { seasonId: activeSeasonId },
    { enabled: !!activeSeasonId }
  );

  // Use the same procedure as admin/Players - registration.getAll
  const { data: allPlayers = [], isLoading: loadingPlayers, refetch } =
    trpc.registration.getAll.useQuery();

  // ── Mutations ─────────────────────────────────────────────────────────────
  const assignTeamMutation = trpc.admin.assignPlayerToTeam.useMutation({
    onSuccess: () => { refetch(); toast.success('Player assigned'); },
    onError: (e) => toast.error(e.message || 'Failed to assign player'),
  });

  const removeFromTeamMutation = trpc.admin.assignPlayerToTeam.useMutation({
    onSuccess: () => { refetch(); toast.success('Player removed from team'); },
    onError: (e) => toast.error(e.message || 'Failed to remove player'),
  });

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, player: any) => {
    setDraggedPlayer(player);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetId);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetTeamId: number | null) => {
    e.preventDefault();
    setDragOverTarget(null);
    if (!draggedPlayer) return;
    if (draggedPlayer.teamId === targetTeamId) return; // no change

    assignTeamMutation.mutate({
      registrationId: draggedPlayer.id,
      teamId: targetTeamId,
      seasonId: activeSeasonId!,
    });
    setDraggedPlayer(null);
  };

  // ── Partition players ─────────────────────────────────────────────────────
  const players = allPlayers as any[];
  const teamsList = teams as any[];
  
  // Debug logging
  console.log('Teams page - Total players:', players.length);
  console.log('Teams page - Active season:', activeSeasonId);
  const ronReiter = players.find(p => p.email === 'ron@snjbuild.ca');
  console.log('Ron Reiter data:', ronReiter);

  // Filter out evaluation teams (Team White/Team Black)
  const isEvaluationTeam = (teamName: string) => 
    teamName?.toLowerCase().includes('white') || teamName?.toLowerCase().includes('black');
  
  // Get IDs of evaluation teams
  const evaluationTeamIds = teamsList
    .filter(t => isEvaluationTeam(t.name))
    .map(t => t.id);

  // Filter players by active season and team, excluding evaluation teams
  const getTeamRoster = (teamId: number) =>
    players.filter(p => p.seasonId === activeSeasonId && p.teamId === teamId);

  // Unassigned players from active season only (excluding those assigned to evaluation teams)
  const unassigned = players.filter(p => {
    if (p.seasonId !== activeSeasonId) return false;
    // If player has no team, they're unassigned
    if (!p.teamId) return true;
    // If player's team is an evaluation team, they're unassigned (for regular season purposes)
    if (evaluationTeamIds.includes(p.teamId)) return true;
    // Otherwise they're assigned to a regular season team
    return false;
  });

  // Helper to count players by position
  const countByPosition = (playerList: any[]) => {
    const total = playerList.length;
    const forwards = playerList.filter(p => p.position?.toLowerCase() === 'forward').length;
    const defence = playerList.filter(p => p.position?.toLowerCase() === 'defense' || p.position?.toLowerCase() === 'defenseman').length;
    const goalies = playerList.filter(p => p.position?.toLowerCase() === 'goalie').length;
    return { total, forwards, defence, goalies };
  };

  if (loading || loadingTeams || loadingPlayers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {activeSeason?.name || 'Active Season'} — Drag players between teams or to/from the unassigned pool.
            </p>
          </div>
        </div>

        {!activeSeasonId ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No active season found. Activate a season in Season Management first.
              <div className="mt-4">
                <Button variant="outline" onClick={() => navigate('/admin/seasons')}>Season Management</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="md:col-span-1">
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{unassigned.length}</div>
                  <div className="text-xs text-gray-500 mt-1">Unassigned</div>
                </CardContent>
              </Card>
              {teamsList.map((t: any, i: number) => {
                const roster = getTeamRoster(t.id);
                const counts = countByPosition(roster);
                return (
                  <Card key={t.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center mb-2">
                        <div className="text-2xl font-bold text-blue-600">{counts.total}</div>
                        <div className="text-xs text-gray-500 truncate">{t.name}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-xs text-center">
                        <div><span className="font-semibold text-blue-600">{counts.forwards}</span><br/>F</div>
                        <div><span className="font-semibold text-green-600">{counts.defence}</span><br/>D</div>
                        <div><span className="font-semibold text-red-600">{counts.goalies}</span><br/>G</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Drag-and-drop arena */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {/* Unassigned Pool */}
              <PlayerPool
                title="Unassigned Pool"
                subtitle={`${unassigned.length} players`}
                players={unassigned}
                teamId={null}
                colorClass="border-orange-400 bg-orange-50"
                isDragOver={dragOverTarget === 'unassigned'}
                onDragStart={handleDragStart}
                onDragOver={e => handleDragOver(e, 'unassigned')}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, null)}
                onManualAssign={(playerId, teamId) =>
                  assignTeamMutation.mutate({ registrationId: playerId, teamId, seasonId: activeSeasonId! })
                }
                teams={teamsList}
                icon={<UserX className="h-5 w-5 text-orange-500" />}
              />

              {/* Team Columns */}
              {teamsList.filter((team: any) => !isEvaluationTeam(team.name)).map((team: any, i: number) => {
                const roster = getTeamRoster(team.id);
                const colorClass = TEAM_COLORS[i % TEAM_COLORS.length];
                return (
                  <PlayerPool
                    key={team.id}
                    title={team.name}
                    subtitle={`${roster.length} players`}
                    players={roster}
                    teamId={team.id}
                    colorClass={colorClass}
                    isDragOver={dragOverTarget === `team-${team.id}`}
                    onDragStart={handleDragStart}
                    onDragOver={e => handleDragOver(e, `team-${team.id}`)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, team.id)}
                    onManualAssign={(playerId, targetTeamId) =>
                      assignTeamMutation.mutate({ registrationId: playerId, teamId: targetTeamId, seasonId: activeSeasonId! })
                    }
                    teams={teamsList}
                    icon={<Shield className="h-5 w-5" />}
                  />
                );
              })}
            </div>

              {teamsList.filter((team: any) => !isEvaluationTeam(team.name)).length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No teams found for this season. Create teams in Team Management settings.
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => navigate('/admin/team-management')}>
                      Manage Teams
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ── PlayerPool component ───────────────────────────────────────────────────
function PlayerPool({
  title, subtitle, players, teamId, colorClass, isDragOver,
  onDragStart, onDragOver, onDragLeave, onDrop, onManualAssign, teams, icon,
}: {
  title: string;
  subtitle: string;
  players: any[];
  teamId: number | null;
  colorClass: string;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent, player: any) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onManualAssign: (playerId: number, teamId: number | null) => void;
  teams: any[];
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border-2 transition-all min-h-48 ${colorClass} ${isDragOver ? 'ring-2 ring-blue-400 ring-offset-1 scale-[1.01]' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="p-4 border-b border-current border-opacity-20 flex items-center gap-2">
        {icon}
        <div>
          <h3 className="font-bold text-sm">{title}</h3>
          <p className="text-xs opacity-75">{subtitle}</p>
        </div>
      </div>

      <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
        {players.length === 0 ? (
          <p className="text-xs text-center opacity-50 py-4">No players</p>
        ) : (
          players.map((player: any) => (
            <div
              key={player.id}
              draggable
              onDragStart={e => onDragStart(e, player)}
              className="p-2 bg-white rounded border border-current border-opacity-20 cursor-move hover:shadow-md transition-shadow text-sm flex items-center justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{player.firstName} {player.lastName}</div>
                <div className="text-xs opacity-75">{POSITION_LABELS[player.position?.toLowerCase()] || '—'}</div>
              </div>
              <Badge variant="outline" className={STATUS_COLORS[player.status] || ''}>{player.status}</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
