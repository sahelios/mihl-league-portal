import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, AlertCircle, Loader2, CalendarDays, Trophy, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Parse "YYYY-MM-DD" as a local date to avoid UTC timezone shifts. */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format a date string or Date object for display. */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDate(date.split('T')[0]) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    year:    'numeric',
  });
}

/** Format "HH:MM" → "9:30 PM" */
function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

/** Get ISO week key "YYYY-Www" for a YYYY-MM-DD string. */
function getISOWeekKey(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const tmp = new Date(d);
  const dow = tmp.getDay() === 0 ? 7 : tmp.getDay(); // Mon=1..Sun=7
  tmp.setDate(tmp.getDate() + 4 - dow);
  const yearStart = new Date(tmp.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface GameRow {
  id: number;
  gameDate: string;
  gameTime: string;
  homeTeam: { id: number; name: string } | null;
  awayTeam: { id: number; name: string } | null;
  venue:    { id: number; name: string } | null;
  isEvaluationGame: boolean;
}

interface WeekGroup {
  weekKey: string;
  weekLabel: string;   // "Week 1", "Eval", etc.
  games: GameRow[];
}

// ── Grouping logic ────────────────────────────────────────────────────────────

function groupByWeek(games: GameRow[]): WeekGroup[] {
  // Separate eval and regular
  const evalGames    = games.filter(g => g.isEvaluationGame);
  const regularGames = games.filter(g => !g.isEvaluationGame);

  // Group regular games by ISO week
  const weekMap = new Map<string, GameRow[]>();
  for (const g of regularGames) {
    const wk = getISOWeekKey(g.gameDate);
    if (!weekMap.has(wk)) weekMap.set(wk, []);
    weekMap.get(wk)!.push(g);
  }

  const groups: WeekGroup[] = [];

  // Add eval group first if any
  if (evalGames.length > 0) {
    groups.push({
      weekKey:   'eval',
      weekLabel: 'Evaluation Games',
      games:     evalGames.sort((a, b) => a.gameDate.localeCompare(b.gameDate)),
    });
  }

  // Add regular weeks in chronological order, labeled "Week 1", "Week 2", etc.
  const sortedWeeks = Array.from(weekMap.keys()).sort();
  sortedWeeks.forEach((wk, idx) => {
    groups.push({
      weekKey:   wk,
      weekLabel: `Week ${idx + 1}`,
      games:     weekMap.get(wk)!.sort((a, b) =>
        a.gameDate.localeCompare(b.gameDate) || a.gameTime.localeCompare(b.gameTime)
      ),
    });
  });

  return groups;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScheduleManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [deletingGameId,   setDeletingGameId]   = useState<number | null>(null);
  const [isDeletingAll,    setIsDeletingAll]     = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll]  = useState(false);

  const utils = trpc.useUtils();

  // ── Queries & Mutations ──
  const { data: seasons = [], isLoading: loadingSeasons } = trpc.admin.getSeasons.useQuery();

  const {
    data: games = [],
    isLoading: loadingGames,
    error: gamesError,
  } = trpc.admin.getGamesBySeasonId.useQuery(
    selectedSeasonId ? { seasonId: parseInt(selectedSeasonId) } : undefined,
    { enabled: !!selectedSeasonId }
  );

  const deleteGameMutation = trpc.admin.deleteGame.useMutation({
    onSuccess: () => {
      toast.success('Game deleted');
      setDeletingGameId(null);
      utils.admin.getGamesBySeasonId.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete game');
      setDeletingGameId(null);
    },
  });

  const deleteAllMutation = trpc.admin.deleteGamesBySeason.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'All games deleted');
      setIsDeletingAll(false);
      setConfirmDeleteAll(false);
      utils.admin.getGamesBySeasonId.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete games');
      setIsDeletingAll(false);
    },
  });

  // ── Access check ──
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You must be an admin to access this page.</p>
        <Button onClick={() => navigate('/')} variant="outline">Back to Home</Button>
      </div>
    );
  }

  // ── Handlers ──
  const handleDeleteGame = (gameId: number) => {
    setDeletingGameId(gameId);
    deleteGameMutation.mutate({ gameId });
  };

  const handleDeleteAll = () => {
    if (!selectedSeasonId) return;
    setIsDeletingAll(true);
    deleteAllMutation.mutate({ seasonId: parseInt(selectedSeasonId) });
  };

  // ── Derived data ──
  const weekGroups   = groupByWeek(games as GameRow[]);
  const regularCount = games.filter((g: GameRow) => !g.isEvaluationGame).length;
  const evalCount    = games.filter((g: GameRow) => g.isEvaluationGame).length;

  // Season year helper: parse local date to avoid UTC shift
  const getSeasonYear = (s: { startDate: string | Date }) => {
    const raw = typeof s.startDate === 'string'
      ? s.startDate.split('T')[0]
      : (s.startDate as Date).toISOString().split('T')[0];
    return parseLocalDate(raw).getFullYear();
  };

  // ── Render ──
  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage scheduled games by season
          </p>
        </div>
      </div>

      {/* Season Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Season</CardTitle>
          <CardDescription>Choose a season to view and manage its schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Choose a season..." />
            </SelectTrigger>
            <SelectContent>
              {loadingSeasons ? (
                <SelectItem value="loading" disabled>Loading seasons...</SelectItem>
              ) : seasons.length === 0 ? (
                <SelectItem value="none" disabled>No seasons available</SelectItem>
              ) : (
                seasons.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name} ({getSeasonYear(s)})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Season Stats */}
      {selectedSeasonId && !loadingGames && games.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{games.length}</p>
                  <p className="text-sm text-muted-foreground">Total Games</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{regularCount}</p>
                  <p className="text-sm text-muted-foreground">Regular Season</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{evalCount}</p>
                  <p className="text-sm text-muted-foreground">Evaluation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Venue Distribution Table */}
      {selectedSeasonId && !loadingGames && games.length > 0 && (() => {
        // Build team × venue matrix from game data
        const teamMap   = new Map<string, Map<string, number>>();
        const allVenues = new Set<string>();

        (games as GameRow[]).filter(g => !g.isEvaluationGame).forEach(g => {
          const home  = g.homeTeam?.name  ?? 'Unknown';
          const away  = g.awayTeam?.name  ?? 'Unknown';
          const venue = g.venue?.name     ?? 'Unknown Venue';
          allVenues.add(venue);
          [home, away].forEach(team => {
            if (!teamMap.has(team)) teamMap.set(team, new Map());
            teamMap.get(team)!.set(venue, (teamMap.get(team)!.get(venue) ?? 0) + 1);
          });
        });

        const sortedTeams  = Array.from(teamMap.keys()).sort();
        const sortedVenues = Array.from(allVenues).sort();

        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Venue Distribution (Regular Season)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-semibold py-2 px-3">Team</th>
                      {sortedVenues.map(v => (
                        <th key={v} className="text-center font-semibold py-2 px-3 text-xs">{v}</th>
                      ))}
                      <th className="text-center font-semibold py-2 px-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTeams.map(team => {
                      const counts = sortedVenues.map(v => teamMap.get(team)?.get(v) ?? 0);
                      const total  = counts.reduce((a, b) => a + b, 0);
                      const max    = Math.max(...counts);
                      const min    = Math.min(...counts);
                      const imb    = max - min;
                      return (
                        <tr key={team} className="border-b hover:bg-muted/50">
                          <td className="font-medium py-2 px-3">{team}</td>
                          {counts.map((c, i) => (
                            <td key={i} className="text-center py-2 px-3">
                              <span className={imb > 2 ? 'text-orange-600 font-semibold' : ''}>
                                {c}
                              </span>
                            </td>
                          ))}
                          <td className="text-center font-semibold py-2 px-3">{total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Games List */}
      {selectedSeasonId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Games</CardTitle>
                <CardDescription>
                  {loadingGames
                    ? 'Loading...'
                    : games.length === 0
                    ? 'No games scheduled for this season'
                    : `${games.length} game${games.length !== 1 ? 's' : ''} · grouped by week`}
                </CardDescription>
              </div>
              {/* Delete All button */}
              {!loadingGames && games.length > 0 && (
                <div className="flex items-center gap-2">
                  {confirmDeleteAll ? (
                    <>
                      <span className="text-sm text-destructive font-medium">
                        Delete all {games.length} games?
                      </span>
                      <Button
                        variant="destructive" size="sm"
                        onClick={handleDeleteAll}
                        disabled={isDeletingAll}
                      >
                        {isDeletingAll ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-1" />Deleting...</>
                        ) : 'Confirm'}
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => setConfirmDeleteAll(false)}
                        disabled={isDeletingAll}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline" size="sm"
                      className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                      onClick={() => setConfirmDeleteAll(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete All Games
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {loadingGames ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading games...
              </div>
            ) : gamesError ? (
              <div className="flex items-center gap-2 text-destructive py-8 justify-center">
                <AlertCircle className="h-5 w-5" />
                Failed to load games
              </div>
            ) : games.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No games scheduled for this season.
                {' '}
                <button
                  className="text-primary underline"
                  onClick={() => navigate('/admin/game-scheduler')}
                >
                  Go to Game Scheduler
                </button>
              </p>
            ) : (
              <div className="space-y-6">
                {weekGroups.map(group => (
                  <div key={group.weekKey}>
                    {/* Week header */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-sm text-foreground">{group.weekLabel}</h3>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">
                        {group.games.length} game{group.games.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Games in this week */}
                    <div className="space-y-2">
                      {group.games.map(game => (
                        <div
                          key={game.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {game.homeTeam?.name ?? 'Team A'} vs {game.awayTeam?.name ?? 'Team B'}
                              </span>
                              {game.isEvaluationGame ? (
                                <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                                  Evaluation
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Regular Season
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(game.gameDate)} · {formatTime(game.gameTime)}
                              {game.venue?.name && (
                                <> · <span className="font-medium">{game.venue.name}</span></>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGame(game.id)}
                            disabled={deletingGameId === game.id}
                            className="text-muted-foreground hover:text-destructive shrink-0"
                          >
                            {deletingGameId === game.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
