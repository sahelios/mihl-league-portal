import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Users, Target, Trash2, Users2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function EvaluationGames() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedTeams, setSelectedTeams] = useState<Record<string, Record<number, string>>>({});

  // Redirect if not admin
  if (!isLoading && user?.role !== "admin") {
    navigate("/");
    return null;
  }

  // Fetch evaluation game attendance
  const { data: evaluationAttendance, isLoading: isLoadingAttendance, refetch } = 
    trpc.registration.getEvaluationAttendance.useQuery();

  // Mutations
  const removeFromGameMutation = trpc.admin.removeFromEvaluationGame.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const assignTeamMutation = trpc.admin.assignEvaluationTeam.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const getTeamAssignmentQuery = trpc.admin.getEvaluationTeamAssignment.useQuery;

  if (isLoading || isLoadingAttendance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-foreground">Loading evaluation games...</p>
        </div>
      </div>
    );
  }

  if (!evaluationAttendance) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="text-center">
          <p className="text-muted-foreground">No evaluation game data available</p>
        </div>
      </div>
    );
  }

  const handleRemovePlayer = (registrationId: number, evaluationDate: string) => {
    if (confirm("Are you sure you want to remove this player from the evaluation game?")) {
      removeFromGameMutation.mutate({ registrationId, evaluationDate });
    }
  };

  const handleAssignTeam = (registrationId: number, evaluationDate: string, team: "white" | "black") => {
    assignTeamMutation.mutate({ registrationId, evaluationDate, team });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Evaluation Games</h1>
          <p className="text-muted-foreground">Player attendance and team assignments for evaluation games</p>
        </div>

        <div className="grid gap-8">
          {evaluationAttendance.map((game) => (
            <Card key={game.date} className="border-border">
              <CardHeader className="bg-muted/50 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl text-foreground">{game.label}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {game.venue} • {game.time}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-accent" />
                        <span className="font-semibold text-foreground">
                          {game.totalPlayers}/{game.maxPlayers}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Players</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-accent" />
                        <span className="font-semibold text-foreground">
                          {game.totalGoalies}/{game.maxGoalies}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Goalies</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {game.attendees.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No registrations yet</p>
                ) : (
                  <div className="space-y-4">
                    {/* Goalies */}
                    {game.attendees.filter(a => a.position === 'goalie').length > 0 && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-accent" />
                          Goalies ({game.attendees.filter(a => a.position === 'goalie').length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {game.attendees
                            .filter(a => a.position === 'goalie')
                            .map((player) => (
                              <div key={player.id} className="p-3 bg-muted rounded-lg border border-border">
                                <div className="font-semibold text-foreground">
                                  {player.firstName} {player.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {player.email}
                                </div>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  <Badge variant="secondary" className="text-xs">
                                    Rating: {player.rating}
                                  </Badge>
                                  <Badge 
                                    variant={player.status === 'approved' ? 'default' : 'outline'}
                                    className="text-xs"
                                  >
                                    {player.status}
                                  </Badge>
                                </div>
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemovePlayer(player.id, game.date)}
                                    disabled={removeFromGameMutation.isPending}
                                    className="text-xs"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Players */}
                    {game.attendees.filter(a => a.position !== 'goalie').length > 0 && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4 text-accent" />
                          Players ({game.attendees.filter(a => a.position !== 'goalie').length})
                        </h3>
                        <div className="space-y-2">
                          {game.attendees
                            .filter(a => a.position !== 'goalie')
                            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                            .map((player) => (
                              <div key={player.id} className="p-3 bg-muted rounded-lg border border-border flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-semibold text-foreground">
                                    {player.firstName} {player.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {player.email}
                                  </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <Badge variant="secondary" className="text-xs">
                                    {player.position}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    Rating: {player.rating}
                                  </Badge>
                                  <Badge 
                                    variant={player.status === 'approved' ? 'default' : 'outline'}
                                    className="text-xs"
                                  >
                                    {player.status}
                                  </Badge>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant={selectedTeams[game.date]?.[player.id] === 'white' ? 'default' : 'outline'}
                                      onClick={() => handleAssignTeam(player.id, game.date, 'white')}
                                      disabled={assignTeamMutation.isPending}
                                      className="text-xs"
                                    >
                                      <Users2 className="h-3 w-3 mr-1" />
                                      White
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={selectedTeams[game.date]?.[player.id] === 'black' ? 'default' : 'outline'}
                                      onClick={() => handleAssignTeam(player.id, game.date, 'black')}
                                      disabled={assignTeamMutation.isPending}
                                      className="text-xs"
                                    >
                                      <Users2 className="h-3 w-3 mr-1" />
                                      Black
                                    </Button>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemovePlayer(player.id, game.date)}
                                    disabled={removeFromGameMutation.isPending}
                                    className="text-xs"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
