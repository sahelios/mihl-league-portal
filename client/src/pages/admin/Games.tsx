import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, ArrowLeft, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatDate, formatTime } from "@/lib/dateUtils";
import { useEffect } from "react";

export default function Games() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [playerScores, setPlayerScores] = useState<Record<number, { goals: number; assists: number }>>({});

  // tRPC Queries & Mutations
  const utils = trpc.useUtils();
  const { data: seasons = [], isLoading: loadingSeasons } = trpc.admin.getSeasons.useQuery();
  const { data: gamesBySeasonId = [], isLoading: loadingGames } = trpc.admin.getGamesBySeasonId.useQuery(
    selectedSeasonId ? { seasonId: selectedSeasonId } : undefined,
    { enabled: !!selectedSeasonId }
  );
  const { data: allPlayers = [] } = trpc.registration.getAll.useQuery();

  const submitMutation = trpc.admin.submitGameScore.useMutation({
    onSuccess: () => {
      toast.success("Score submitted successfully!");
      setSelectedGameId(null);
      setPlayerScores({});
      utils.admin.getGamesBySeasonId.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit score");
    },
  });

  // Admin Access Check
  if (user?.email !== 'sarzouan@gmail.com') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6 text-center">
          You do not have permission to view this page.
        </p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return Home
        </Button>
      </div>
    );
  }

  const selectedGame = gamesBySeasonId.find(g => g.id === selectedGameId);
  const homeTeamPlayers = selectedGame ? allPlayers.filter(p => p.teamId === selectedGame.homeTeamId && p.seasonId === selectedSeasonId && p.status === 'approved') : [];
  const awayTeamPlayers = selectedGame ? allPlayers.filter(p => p.teamId === selectedGame.awayTeamId && p.seasonId === selectedSeasonId && p.status === 'approved') : [];
  
  // Debug logging
  useEffect(() => {
    if (selectedGame && homeTeamPlayers.length > 0) {
      console.log('Home Team Players:', homeTeamPlayers);
      console.log('First player:', homeTeamPlayers[0]);
    }
  }, [selectedGame, homeTeamPlayers]);

  const handlePlayerGoal = (playerId: number) => {
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        goals: (prev[playerId]?.goals || 0) + 1
      }
    }));
  };

  const handlePlayerAssist = (playerId: number) => {
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        assists: (prev[playerId]?.assists || 0) + 1
      }
    }));
  };

  const handleRemoveGoal = (playerId: number) => {
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        goals: Math.max(0, (prev[playerId]?.goals || 0) - 1)
      }
    }));
  };

  const handleRemoveAssist = (playerId: number) => {
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        assists: Math.max(0, (prev[playerId]?.assists || 0) - 1)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId) {
      toast.error("Please select a game");
      return;
    }

    // Calculate home team score
    const homeScore = homeTeamPlayers.reduce((sum, player) => {
      return sum + (playerScores[player.id]?.goals || 0);
    }, 0);

    // Calculate away team score
    const awayScore = awayTeamPlayers.reduce((sum, player) => {
      return sum + (playerScores[player.id]?.goals || 0);
    }, 0);

    submitMutation.mutate({
      gameId: selectedGameId,
      homeScore,
      awayScore
    });
  };

  // Helper function to format team names
  const getTeamName = (teamId: number) => {
    const game = gamesBySeasonId.find(g => g.homeTeamId === teamId || g.awayTeamId === teamId);
    if (game?.homeTeamId === teamId) {
      return game.homeTeam?.name || `Team ${teamId}`;
    }
    if (game?.awayTeamId === teamId) {
      return game.awayTeam?.name || `Team ${teamId}`;
    }
    return `Team ${teamId}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Game Score Entry</h1>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submit Game Score</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Season Selection */}
              <div className="space-y-2">
                <Label htmlFor="season">Select Season</Label>
                <Select value={selectedSeasonId?.toString() || ""} onValueChange={(val) => {
                  setSelectedSeasonId(parseInt(val));
                  setSelectedGameId(null);
                  setPlayerScores({});
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a season" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingSeasons ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                    ) : seasons.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No seasons available</div>
                    ) : (
                      seasons.map(season => (
                        <SelectItem key={season.id} value={season.id.toString()}>
                          {season.name} ({new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Game Selection - Only shown after season is selected */}
              {selectedSeasonId && (
                <div className="space-y-2">
                  <Label htmlFor="game">Select Game</Label>
                  <Select value={selectedGameId?.toString() || ""} onValueChange={(val) => {
                    setSelectedGameId(parseInt(val));
                    setPlayerScores({});
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a game" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingGames ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                      ) : gamesBySeasonId.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No games in this season</div>
                      ) : (
                        gamesBySeasonId.map(game => {
                          const homeTeamName = game.homeTeam?.name || `Team ${game.homeTeamId}`;
                          const awayTeamName = game.awayTeam?.name || `Team ${game.awayTeamId}`;
                          const isEvalGame = game.isEvaluationGame;
                          const gameLabel = isEvalGame ? "Team White vs Team Black" : `${homeTeamName} vs ${awayTeamName}`;
                          
                          return (
                            <SelectItem key={game.id} value={game.id.toString()}>
                              {gameLabel} - {formatDate(game.gameDate)} @ {formatTime(game.gameTime)}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Player Score Entry */}
              {selectedGame && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Home Team */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">
                        {selectedGame.homeTeam?.name || `Team ${selectedGame.homeTeamId}`}
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {homeTeamPlayers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No players found for this team</p>
                        ) : (
                          homeTeamPlayers.map(player => (
                            <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm">{player.firstName} {player.lastName}</span>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePlayerGoal(player.id)}
                                >
                                  <Plus className="h-3 w-3" />
                                  G: {playerScores[player.id]?.goals || 0}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePlayerAssist(player.id)}
                                >
                                  <Plus className="h-3 w-3" />
                                  A: {playerScores[player.id]?.assists || 0}
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">
                        {selectedGame.awayTeam?.name || `Team ${selectedGame.awayTeamId}`}
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {awayTeamPlayers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No players found for this team</p>
                        ) : (
                          awayTeamPlayers.map(player => (
                            <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm">{player.firstName} {player.lastName}</span>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePlayerGoal(player.id)}
                                >
                                  <Plus className="h-3 w-3" />
                                  G: {playerScores[player.id]?.goals || 0}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePlayerAssist(player.id)}
                                >
                                  <Plus className="h-3 w-3" />
                                  A: {playerScores[player.id]?.assists || 0}
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={!selectedGameId || submitMutation.isPending} className="w-full">
                {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Score
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
