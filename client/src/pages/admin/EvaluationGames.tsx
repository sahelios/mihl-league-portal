import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2, Users, ArrowLeft, Plus, Trash2, Users2 } from 'lucide-react';
import { toast } from 'sonner';

type EvalTeam = 'white' | 'black';

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

const POSITION_ORDER: Record<string, number> = { goalie: 0, defenseman: 1, defense: 1, forward: 2 };

export default function EvaluationGames() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Per-game selected player for the Add section
  const [addPlayerSelection, setAddPlayerSelection] = useState<Record<number, string>>({});
  const [addTeamSelection, setAddTeamSelection] = useState<Record<number, EvalTeam>>({});

  if (!loading && (!user || user.role !== 'admin')) {
    navigate('/');
    return null;
  }

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: evalGamesRaw = [], isLoading: loadingGames, refetch } =
    trpc.admin.getEvaluationAttendance.useQuery({});

  const { data: allPlayers = [], isLoading: loadingPlayers } =
    trpc.admin.getAllPlayersForEvaluation.useQuery();

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addToGameMutation = trpc.admin.addToEvaluationGame.useMutation({
    onSuccess: () => { refetch(); toast.success('Player added'); },
    onError: (e) => toast.error(e.message || 'Failed to add player'),
  });

  const removeFromGameMutation = trpc.admin.removeFromEvaluationGame.useMutation({
    onSuccess: () => { refetch(); toast.success('Player removed'); },
    onError: (e) => toast.error(e.message || 'Failed to remove player'),
  });

  const assignTeamMutation = trpc.admin.assignEvaluationTeam.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e) => toast.error(e.message || 'Failed to assign team'),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAdd = (gameId: number, gameDate: string) => {
    const registrationId = parseInt(addPlayerSelection[gameId] || '');
    if (!registrationId) { toast.error('Select a player first'); return; }
    const team = addTeamSelection[gameId] || 'white';
    addToGameMutation.mutate({ registrationId, evaluationDate: gameDate, team });
    setAddPlayerSelection(prev => ({ ...prev, [gameId]: '' }));
  };

  const handleRemove = (registrationId: number, evaluationDate: string) => {
    if (!confirm('Remove this player from the eval game?')) return;
    removeFromGameMutation.mutate({ registrationId, evaluationDate });
  };

  const handleTeamChange = (registrationId: number, evaluationDate: string, team: EvalTeam) => {
    assignTeamMutation.mutate({ registrationId, evaluationDate, team });
  };

  if (loading || loadingGames) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  const games = evalGamesRaw as any[];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Evaluation Games</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage rosters for each evaluation game. Assign players to White or Black team.
            </p>
          </div>
        </div>

        {games.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No evaluation games found in the active season.</p>
              <p className="text-sm mt-2">Create evaluation games in Schedule Management first, marking them as evaluation games.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/schedule')}>
                Go to Schedule Management
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8">
            {games.map((game: any) => {
              const gameId: number = game.id;
              const gameDate: string = game.date;
              const attendees: any[] = game.attendees || [];

              const whiteTeam = attendees
                .filter(p => p.evalTeam === 'white')
                .sort((a, b) => (POSITION_ORDER[a.position?.toLowerCase()] ?? 3) - (POSITION_ORDER[b.position?.toLowerCase()] ?? 3));
              const blackTeam = attendees
                .filter(p => p.evalTeam === 'black')
                .sort((a, b) => (POSITION_ORDER[a.position?.toLowerCase()] ?? 3) - (POSITION_ORDER[b.position?.toLowerCase()] ?? 3));
              const unassigned = attendees.filter(p => !p.evalTeam);

              // Players not yet in this game
              const assignedIds = new Set(attendees.map(p => p.id));
              const availableToAdd = allPlayers.filter((p: any) => !assignedIds.has(p.id));

              return (
                <Card key={gameId} className="border-border">
                  {/* Game Header */}
                  <CardHeader className="bg-muted/50 border-b border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl text-foreground">{formatDate(gameDate)}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {game.venue} · {game.time}
                        </p>
                      </div>
                      <div className="flex gap-6 text-right">
                        <div>
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <Users className="h-4 w-4 text-accent" />
                            <span className="font-semibold text-foreground">{attendees.length}/{game.maxPlayers}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Players</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Add Player */}
                    <div className="p-4 bg-muted rounded-lg border border-border">
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add Player to this Game
                      </h3>
                      <div className="flex gap-3 items-end flex-wrap">
                        <div className="flex-1 min-w-48">
                          <label className="text-sm text-muted-foreground mb-1.5 block">Player</label>
                          <Select
                            value={addPlayerSelection[gameId] || ''}
                            onValueChange={v => setAddPlayerSelection(prev => ({ ...prev, [gameId]: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={loadingPlayers ? 'Loading...' : 'Choose a player'} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableToAdd.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">All players assigned</div>
                              ) : (
                                availableToAdd.map((p: any) => (
                                  <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.firstName} {p.lastName}
                                    {p.position ? ` · ${p.position}` : ''}
                                    {p.playerRating ? ` (${p.playerRating})` : ''}
                                    {p.status !== 'approved' ? ` [${p.status}]` : ''}
                                    {p.evalGameDate ? ` ★ ${formatDate(p.evalGameDate).slice(0, 6)}` : ''}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1.5 block">Team</label>
                          <Select
                            value={addTeamSelection[gameId] || 'white'}
                            onValueChange={v => setAddTeamSelection(prev => ({ ...prev, [gameId]: v as EvalTeam }))}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="white">⬜ White</SelectItem>
                              <SelectItem value="black">⬛ Black</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => handleAdd(gameId, gameDate)}
                          disabled={addToGameMutation.isPending || !addPlayerSelection[gameId]}
                        >
                          {addToGameMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Team Grids */}
                    {attendees.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">
                        No players assigned yet. Use the form above to add players.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* White Team */}
                        <TeamSection
                          team="white"
                          players={whiteTeam}
                          evaluationDate={gameDate}
                          onRemove={handleRemove}
                          onTeamChange={handleTeamChange}
                          isMutating={assignTeamMutation.isPending}
                        />
                        {/* Black Team */}
                        <TeamSection
                          team="black"
                          players={blackTeam}
                          evaluationDate={gameDate}
                          onRemove={handleRemove}
                          onTeamChange={handleTeamChange}
                          isMutating={assignTeamMutation.isPending}
                        />
                      </div>
                    )}

                    {/* Unassigned within game */}
                    {unassigned.length > 0 && (
                      <div className="border border-yellow-200 rounded-lg bg-yellow-50 p-4">
                        <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                          {unassigned.length} player(s) not yet assigned to a team
                        </h4>
                        <div className="space-y-2">
                          {unassigned.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-yellow-100">
                              <span className="text-sm font-medium">{p.firstName} {p.lastName}</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-xs h-7"
                                  onClick={() => handleTeamChange(p.id, gameDate, 'white')}>
                                  ⬜ White
                                </Button>
                                <Button size="sm" variant="outline" className="text-xs h-7"
                                  onClick={() => handleTeamChange(p.id, gameDate, 'black')}>
                                  ⬛ Black
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ── TeamSection component ──────────────────────────────────────────────────
function TeamSection({
  team, players, evaluationDate, onRemove, onTeamChange, isMutating,
}: {
  team: EvalTeam;
  players: any[];
  evaluationDate: string;
  onRemove: (id: number, date: string) => void;
  onTeamChange: (id: number, date: string, team: EvalTeam) => void;
  isMutating: boolean;
}) {
  const isWhite = team === 'white';
  const otherTeam: EvalTeam = isWhite ? 'black' : 'white';

  const positionCounts = players.reduce((acc, p) => {
    const pos = (p.position || '').toLowerCase();
    acc[pos] = (acc[pos] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`rounded-lg border p-5 ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-gray-900 border-gray-700'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${isWhite ? 'text-foreground' : 'text-white'}`}>
          <Users2 className="h-5 w-5" />
          {isWhite ? '⬜ White Team' : '⬛ Black Team'}
        </h3>
        <div className={`text-xs ${isWhite ? 'text-muted-foreground' : 'text-gray-400'}`}>
          {players.length} players
          {positionCounts.goalie ? ` · ${positionCounts.goalie}G` : ''}
          {positionCounts.defenseman || positionCounts.defense
            ? ` · ${(positionCounts.defenseman || 0) + (positionCounts.defense || 0)}D` : ''}
          {positionCounts.forward ? ` · ${positionCounts.forward}F` : ''}
        </div>
      </div>

      {players.length === 0 ? (
        <p className={`text-center py-8 text-sm ${isWhite ? 'text-muted-foreground' : 'text-gray-400'}`}>
          No players assigned
        </p>
      ) : (
        <div className="space-y-2">
          {players.map(player => (
            <div
              key={player.id}
              className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${isWhite ? 'bg-white border-slate-200' : 'bg-gray-800 border-gray-700'}`}
            >
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${isWhite ? 'text-foreground' : 'text-white'}`}>
                  {player.firstName} {player.lastName}
                </div>
                <div className={`text-xs flex gap-2 mt-0.5 ${isWhite ? 'text-muted-foreground' : 'text-gray-400'}`}>
                  {player.position && <span className="capitalize">{player.position}</span>}
                  {player.playerRating && <span>★ {player.playerRating}</span>}
                  <Badge
                    variant={player.status === 'approved' ? 'default' : 'outline'}
                    className="text-xs h-4 px-1"
                  >
                    {player.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                  disabled={isMutating}
                  onClick={() => onTeamChange(player.id, evaluationDate, otherTeam)}
                >
                  → {otherTeam === 'white' ? '⬜' : '⬛'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 px-2"
                  onClick={() => onRemove(player.id, evaluationDate)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
