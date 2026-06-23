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
import { DashboardLayout } from "@/components/DashboardLayout";

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
  const { data: gamePlayersData, isLoading: loadingGamePlayers } = trpc.admin.getGamePlayers.useQuery(
    selectedGameId ? { gameId: selectedGameId } : undefined,
    { enabled: !!selectedGameId }
  );
  const { data: evalGamePlayers = [] } = trpc.admin.getEvaluationGamePlayers.useQuery(
    selectedGameId ? { gameId: selectedGameId } : undefined,
    { enabled: !!selectedGameId }
  );

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
  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  const selectedGame = gamesBySeasonId.find(g => g.id === selectedGameId);
  const isEvalGame = selectedGame?.isEvaluationGame;

  // For evaluation games, use evalGamePlayers; for regular games, use gamePlayersData
  let homeTeamPlayers: any[] = [];
  let awayTeamPlayers: any[] = [];

  if (isEvalGame && evalGamePlayers.length > 0) {
    // Split evaluation game players by team
    homeTeamPlayers = evalGamePlayers.filter(p => p.evalTeam === 'white');
    awayTeamPlayers = evalGamePlayers.filter(p => p.evalTeam === 'black');
  } else if (selectedGame && !isEvalGame && gamePlayersData) {
    // Regular season games: use the procedure data
    homeTeamPlayers = gamePlayersData.homePlayers || [];
    awayTeamPlayers = gamePlayersData.awayPlayers || [];
  }

  const handlePlayerGoal = (playerId: number) => {
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: {
        goals: (prev[playerId]?.goals || 0) + 1,
        assists: prev[playerId]?.assists || 0,
      },
    }));
  };

  const handleRemoveGoal = (playerId: number) => {
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: {
        goals: Math.max(0, (prev[playerId]?.goals || 0) - 1),
        assists: prev[playerId]?.assists || 0,
      },
    }));
  };

  const handlePlayerAssist = (playerId: number) => {
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: {
        goals: prev[playerId]?.goals || 0,
        assists: (prev[playerId]?.assists || 0) + 1,
      },
    }));
  };

  const handleRemoveAssist = (playerId: number) => {
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: {
        goals: prev[playerId]?.goals || 0,
        assists: Math.max(0, (prev[playerId]?.assists || 0) - 1),
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGameId) {
      toast.error("Please select a game");
      return;
    }

    const scores = Object.entries(playerScores)
      .filter(([_, score]) => score.goals > 0 || score.assists > 0)
      .map(([playerId, score]) => ({
        playerId: parseInt(playerId),
        goals: score.goals,
        assists: score.assists,
      }));

    submitMutation.mutate({
      gameId: selectedGameId,
      scores,
    });
  };

  if (loadingSeasons) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Game Score Entry</h1>
            <p className="text-muted-foreground text-sm mt-1">Enter player goals and assists for each game</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submit Game Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Season Selection */}
              {loadingSeasons ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
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
                      {seasons.map(season => (
                        <SelectItem key={season.id} value={season.id.toString()}>
                          {season.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Game Selection */}
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
                  {loadingGamePlayers && !isEvalGame ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Home Team / White Team */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">
                          {isEvalGame ? "Team White" : selectedGame.homeTeam?.name || `Team ${selectedGame.homeTeamId}`}
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {homeTeamPlayers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No players found for this team</p>
                          ) : (
                            homeTeamPlayers.map(player => {
                              const isGoalie = player.position?.toLowerCase() === 'goalie';
                              return (
                                <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <span className="text-sm">{player.firstName} {player.lastName}</span>
                                  <div className="flex gap-1">
                                    {isGoalie ? (
                                      <>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handlePlayerGoal(player.id)}
                                          title="Add shot"
                                        >
                                          <Plus className="h-3 w-3" />
                                          SA: {playerScores[player.id]?.goals || 0}
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleRemoveGoal(player.id)}
                                          disabled={(playerScores[player.id]?.goals || 0) === 0}
                                          title="Remove shot"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
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
                                          onClick={() => handleRemoveGoal(player.id)}
                                          disabled={(playerScores[player.id]?.goals || 0) === 0}
                                        >
                                          <Minus className="h-3 w-3" />
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
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleRemoveAssist(player.id)}
                                          disabled={(playerScores[player.id]?.assists || 0) === 0}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Away Team / Black Team */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">
                          {isEvalGame ? "Team Black" : selectedGame.awayTeam?.name || `Team ${selectedGame.awayTeamId}`}
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {awayTeamPlayers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No players found for this team</p>
                          ) : (
                            awayTeamPlayers.map(player => {
                              const isGoalie = player.position?.toLowerCase() === 'goalie';
                              return (
                                <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <span className="text-sm">{player.firstName} {player.lastName}</span>
                                  <div className="flex gap-1">
                                    {isGoalie ? (
                                      <>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handlePlayerGoal(player.id)}
                                          title="Add shot"
                                        >
                                          <Plus className="h-3 w-3" />
                                          SA: {playerScores[player.id]?.goals || 0}
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleRemoveGoal(player.id)}
                                          disabled={(playerScores[player.id]?.goals || 0) === 0}
                                          title="Remove shot"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
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
                                          onClick={() => handleRemoveGoal(player.id)}
                                          disabled={(playerScores[player.id]?.goals || 0) === 0}
                                        >
                                          <Minus className="h-3 w-3" />
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
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleRemoveAssist(player.id)}
                                          disabled={(playerScores[player.id]?.assists || 0) === 0}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              {selectedGame && (
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={submitMutation.isPending || Object.keys(playerScores).length === 0}
                  >
                    {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Scores
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setPlayerScores({});
                      setSelectedGameId(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
