import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ScheduleManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [deletingGameId, setDeletingGameId] = useState<number | null>(null);

  // tRPC Queries & Mutations
  const utils = trpc.useUtils();
  const { data: seasons = [], isLoading: loadingSeasons } = trpc.admin.getSeasons.useQuery();
  const { data: games = [], isLoading: loadingGames } = trpc.admin.getGamesBySeasonId.useQuery(
    selectedSeasonId ? { seasonId: parseInt(selectedSeasonId) } : undefined,
    { enabled: !!selectedSeasonId }
  );

  const deleteGameMutation = trpc.admin.deleteGame.useMutation({
    onSuccess: () => {
      toast.success('Game deleted successfully');
      setDeletingGameId(null);
      utils.admin.getGamesBySeasonId.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete game');
      setDeletingGameId(null);
    },
  });

  // Admin Access Check
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6 text-center">
          You must be an admin to access this page.
        </p>
        <Button onClick={() => navigate('/')} variant="outline">
          Back to Home
        </Button>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleDeleteGame = (gameId: number) => {
    if (confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      setDeletingGameId(gameId);
      deleteGameMutation.mutate({ gameId });
    }
  };

  const formatDate = (date: Date | string) => {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Parse YYYY-MM-DD string as local date to avoid timezone issues
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = date instanceof Date ? date : new Date(date);
    }
    
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold">Schedule Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>View & Delete Games</CardTitle>
          <CardDescription>Select a season to view and manage scheduled games</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Season Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Season</label>
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a season..." />
              </SelectTrigger>
              <SelectContent>
                {loadingSeasons ? (
                  <SelectItem value="loading" disabled>
                    Loading seasons...
                  </SelectItem>
                ) : seasons.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No seasons available
                  </SelectItem>
                ) : (
                  seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id.toString()}>
                      {season.name} ({new Date(season.startDate).getFullYear()})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Statistics - Games by Team and Venue */}
          {selectedSeasonId && !loadingGames && games.length > 0 && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Games by Team & Venue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-semibold py-2 px-2">Team</th>
                        {(() => {
                          const venues = new Set<string>();
                          games.forEach((game) => {
                            const venue = game.venue?.name || 'Unknown Venue';
                            venues.add(venue);
                          });
                          return Array.from(venues).sort().map((venue) => (
                            <th key={venue} className="text-center font-semibold py-2 px-2 text-xs">
                              {venue}
                            </th>
                          ));
                        })()}
                        <th className="text-center font-semibold py-2 px-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Build a map of team -> venue -> count
                        const teamVenueCounts: { [team: string]: { [venue: string]: number } } = {};
                        const allTeams = new Set<string>();
                        const allVenues = new Set<string>();

                        games.forEach((game) => {
                          const homeTeam = game.homeTeam?.name || 'Unknown';
                          const awayTeam = game.awayTeam?.name || 'Unknown';
                          const venue = game.venue?.name || 'Unknown Venue';

                          allTeams.add(homeTeam);
                          allTeams.add(awayTeam);
                          allVenues.add(venue);

                          if (!teamVenueCounts[homeTeam]) teamVenueCounts[homeTeam] = {};
                          if (!teamVenueCounts[awayTeam]) teamVenueCounts[awayTeam] = {};

                          teamVenueCounts[homeTeam][venue] = (teamVenueCounts[homeTeam][venue] || 0) + 1;
                          teamVenueCounts[awayTeam][venue] = (teamVenueCounts[awayTeam][venue] || 0) + 1;
                        });

                        const sortedTeams = Array.from(allTeams).sort();
                        const sortedVenues = Array.from(allVenues).sort();

                        return sortedTeams.map((team) => {
                          const teamTotal = Object.values(teamVenueCounts[team] || {}).reduce((a, b) => a + b, 0);
                          return (
                            <tr key={team} className="border-b hover:bg-muted/50">
                              <td className="font-medium py-2 px-2">{team}</td>
                              {sortedVenues.map((venue) => (
                                <td key={`${team}-${venue}`} className="text-center py-2 px-2">
                                  {teamVenueCounts[team]?.[venue] || 0}
                                </td>
                              ))}
                              <td className="text-center font-semibold py-2 px-2">{teamTotal}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Games List */}
          {selectedSeasonId && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {loadingGames ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading games...
                  </div>
                ) : games.length === 0 ? (
                  <p>No games scheduled for this season</p>
                ) : (
                  <p>{games.length} game(s) scheduled</p>
                )}
              </div>

              {!loadingGames && games.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {games.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {game.homeTeam?.name || 'Team A'} vs {game.awayTeam?.name || 'Team B'}
                          </span>
                          {game.homeTeam && game.awayTeam && (
                            <Badge variant="outline" className="text-xs">
                              Regular Season
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(game.gameDate)} @ {formatTime(game.gameTime)} •{' '}
                          {game.venue?.name || 'Unknown Venue'}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteGame(game.id)}
                        disabled={deletingGameId === game.id}
                        className="gap-2"
                      >
                        {deletingGameId === game.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
