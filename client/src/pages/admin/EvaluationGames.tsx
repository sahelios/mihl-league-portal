import { ArrowLeft, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Users, Target, Trash2, Users2, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

type PlayerTeam = "white" | "black" | null;

interface PlayerWithTeam {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  rating: number;
  status: string;
  team: PlayerTeam;
}

export default function EvaluationGames() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [teamAssignments, setTeamAssignments] = useState<Record<string, Record<number, PlayerTeam>>>({});

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

  // Initialize team assignments from API
  useEffect(() => {
    if (evaluationAttendance) {
      const assignments: Record<string, Record<number, PlayerTeam>> = {};
      evaluationAttendance.forEach((game) => {
        assignments[game.date] = {};
        game.attendees.forEach((player) => {
          assignments[game.date][player.id] = (player as any).team || null;
        });
      });
      setTeamAssignments(assignments);
    }
  }, [evaluationAttendance]);

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
    // Update local state immediately for UI responsiveness
    setTeamAssignments(prev => ({
      ...prev,
      [evaluationDate]: {
        ...prev[evaluationDate],
        [registrationId]: team
      }
    }));
    // Send to backend
    assignTeamMutation.mutate({ registrationId, evaluationDate, team });
  };

  const getPlayersByTeamAndPosition = (game: any, team: PlayerTeam) => {
    return game.attendees
      .filter((p: any) => (teamAssignments[game.date]?.[p.id] || null) === team)
      .sort((a: any, b: any) => {
        const positionOrder = { goalie: 0, defenseman: 1, forward: 2 };
        const posA = positionOrder[a.position.toLowerCase() as keyof typeof positionOrder] || 3;
        const posB = positionOrder[b.position.toLowerCase() as keyof typeof positionOrder] || 3;
        if (posA !== posB) return posA - posB;
        return (b.rating || 0) - (a.rating || 0);
      });
  };

  const countPositions = (players: any[]) => {
    const counts = { forward: 0, defenseman: 0, goalie: 0 };
    players.forEach(p => {
      const pos = p.position.toLowerCase();
      if (pos === 'forward') counts.forward++;
      else if (pos === 'defenseman') counts.defenseman++;
      else if (pos === 'goalie') counts.goalie++;
    });
    return counts;
  };

  const renderTeamSection = (game: any, team: "white" | "black") => {
    const players = getPlayersByTeamAndPosition(game, team);
    const counts = countPositions(players);
    const isWhite = team === "white";
    const bgColor = isWhite ? "bg-slate-50 dark:bg-slate-900" : "bg-gray-900 dark:bg-gray-950";
    const borderColor = isWhite ? "border-slate-200" : "border-gray-700";
    const textColor = isWhite ? "text-foreground" : "text-white";
    const badgeBg = isWhite ? "bg-slate-200" : "bg-gray-700";

    return (
      <div key={team} className={`${bgColor} rounded-lg border ${borderColor} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${textColor} flex items-center gap-2`}>
            <Users2 className="h-5 w-5" />
            {isWhite ? "White Team" : "Black Team"}
          </h3>
          <div className={`text-sm ${isWhite ? "text-muted-foreground" : "text-gray-300"}`}>
            F: {counts.forward}/6 • D: {counts.defenseman}/4 • G: {counts.goalie}/1
          </div>
        </div>

        {players.length === 0 ? (
          <p className={`text-center py-8 ${isWhite ? "text-muted-foreground" : "text-gray-400"}`}>
            No players assigned to this team
          </p>
        ) : (
          <div className="space-y-3">
            {players.map((player) => (
              <div 
                key={player.id} 
                className={`p-4 rounded-lg border ${isWhite ? "bg-white border-slate-200" : "bg-gray-800 border-gray-700"} flex items-center justify-between`}
              >
                <div className="flex-1">
                  <div className={`font-semibold ${textColor}`}>
                    {player.firstName} {player.lastName}
                  </div>
                  <div className={`text-sm ${isWhite ? "text-muted-foreground" : "text-gray-400"}`}>
                    {player.email}
                  </div>
                </div>

                <div className="flex gap-2 items-center flex-wrap justify-end">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${isWhite ? "" : "bg-gray-700 text-white"}`}
                  >
                    {player.position}
                  </Badge>
                  <Badge 
                    variant="secondary"
                    className={`text-xs ${isWhite ? "" : "bg-gray-700 text-white"}`}
                  >
                    Rating: {player.rating}
                  </Badge>
                  <Badge 
                    variant={player.status === 'approved' ? 'default' : 'outline'}
                    className={`text-xs ${isWhite ? "" : "bg-gray-600 text-white border-gray-600"}`}
                  >
                    {player.status}
                  </Badge>

                  {/* Team Toggle Buttons */}
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant={teamAssignments[game.date]?.[player.id] === 'white' ? 'default' : 'outline'}
                      onClick={() => handleAssignTeam(player.id, game.date, 'white')}
                      disabled={assignTeamMutation.isPending}
                      className="text-xs"
                    >
                      White
                    </Button>
                    <Button
                      size="sm"
                      variant={teamAssignments[game.date]?.[player.id] === 'black' ? 'default' : 'outline'}
                      onClick={() => handleAssignTeam(player.id, game.date, 'black')}
                      disabled={assignTeamMutation.isPending}
                      className="text-xs"
                    >
                      Black
                    </Button>
                  </div>

                  {/* Remove Button */}
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
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Evaluation Games</h1>
          <p className="text-muted-foreground">Manage team assignments for evaluation games</p>
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderTeamSection(game, "white")}
                    {renderTeamSection(game, "black")}
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
