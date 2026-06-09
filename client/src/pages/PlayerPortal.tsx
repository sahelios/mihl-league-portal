import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Loader2, Users, Calendar, TrendingUp, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatDate, formatTime } from "@/lib/dateUtils";

export default function PlayerPortal() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);

  // Fetch player team and registration
  const { data: playerReg, isLoading: regLoading } = trpc.league.getPlayerRegistration.useQuery(
    { email: user?.email || "" },
    { enabled: !!user?.email }
  );

  // Fetch team info (only if player has a team)
  const { data: team, isLoading: teamLoading } = trpc.league.getTeamDetails.useQuery(
    { teamId: playerReg?.teamId || 0 },
    { enabled: !!playerReg?.teamId }
  );

  // Fetch upcoming games for team (only if player has a team)
  const { data: upcomingGames = [], isLoading: gamesLoading } = trpc.league.getTeamSchedule.useQuery(
    { teamId: playerReg?.teamId || 0, playerRegistrationId: playerReg?.id },
    { enabled: !!playerReg?.teamId }
  );

  // Fetch evaluation games (for unassigned players or during evaluation period)
  const { data: evaluationGames = [], isLoading: evalGamesLoading } = trpc.league.getPlayerEvaluationGames.useQuery(
    { playerRegistrationId: playerReg?.id || 0 },
    { enabled: !!playerReg?.id }
  );

  // Fetch player stats (only if player has a team)
  const { data: playerStats, isLoading: statsLoading } = trpc.league.getPlayerStats.useQuery(
    { playerTeamId: playerReg?.id || 0 },
    { enabled: !!playerReg?.id && !!playerReg?.teamId }
  );

  // Fetch player availability (only if player has a team)
  const { data: availability = {}, isLoading: availLoading } = trpc.league.getPlayerAvailability.useQuery(
    { playerTeamId: playerReg?.id || 0 },
    { enabled: !!playerReg?.id && !!playerReg?.teamId }
  );

  const utils = trpc.useUtils();
  const updateAvailabilityMutation = trpc.league.updatePlayerAvailability.useMutation({
    onSuccess: () => {
      utils.league.getPlayerAvailability.invalidate();
      utils.league.getGameTeamAvailability.invalidate();
      setIsDialogOpen(false);
      setSelectedGame(null);
    },
  });

  // Fetch team availability for expanded game
  React.useEffect(() => {
    if (expandedGameId) {
      console.log(`[PlayerPortal] Expanded game ${expandedGameId}`);
    }
  }, [expandedGameId]);

  const { data: teamAvailability = [], isLoading: teamAvailLoading } = trpc.league.getGameTeamAvailability.useQuery(
    { gameId: expandedGameId || 0 },
    { enabled: expandedGameId !== null }
  );

  // Check access
  if (authLoading || regLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="mx-auto text-red-500" size={48} />
            <p className="text-foreground font-semibold">Login Required</p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Check if player is on waiting list
  const isOnWaitingList = playerReg?.waitingListStatus === "waiting";
  const isPromotedFromWaitingList = playerReg?.waitingListStatus === "promoted_from_waiting_list";

  if (!playerReg) {
    return (
      <DashboardLayout>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="mx-auto text-yellow-600" size={48} />
            <p className="text-foreground font-semibold">No Registration Found</p>
            <p className="text-muted-foreground text-sm">Your registration could not be found.</p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (isOnWaitingList) {
    return (
      <DashboardLayout>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="mx-auto text-orange-600" size={48} />
            <p className="text-foreground font-semibold">On Waiting List</p>
            <p className="text-muted-foreground text-sm">You are currently on the waiting list for this season. We'll notify you when a spot becomes available.</p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // If player is not assigned to a team yet, show only evaluation games
  if (!playerReg?.teamId) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{playerReg.firstName} {playerReg.lastName}</h1>
                  <p className="text-muted-foreground">Player Registration</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Team</p>
                    <p className="text-lg font-semibold text-yellow-600">Pending Assignment</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p className="text-lg font-semibold text-foreground capitalize">{playerReg.position || "Not Set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline">Evaluation Phase</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluation Games */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
                Evaluation Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evalGamesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin" />
                </div>
              ) : evaluationGames.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No evaluation games scheduled yet</p>
              ) : (
                <div className="space-y-3">
                  {evaluationGames.map((game: any) => (
                    <div key={game.id} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">
                            {game.teamHome?.name} vs {game.teamAway?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {game.date && game.time ? (
                              <>
                                {formatDate(game.date)} at {formatTime(game.time)}
                              </>
                            ) : (
                              'Time TBA'
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{game.venue?.name}</p>
                        </div>
                        <Badge variant="default">Evaluation</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Please attend this evaluation game. Your performance will help determine your team assignment.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-2">
                <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-foreground">Team Assignment Pending</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You haven't been assigned to a team yet. Attend the evaluation games above to showcase your skills. After evaluation, you'll be assigned to a team and can view the full season schedule.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{playerReg.firstName} {playerReg.lastName}</h1>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Team</p>
                  <p className="text-lg font-semibold text-foreground">{team?.name || "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="text-lg font-semibold text-foreground capitalize">{playerReg.position || "Not Set"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-lg font-semibold text-foreground">{playerReg.playerRating ? `${playerReg.playerRating}/10` : "Not Rated"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Games Played</p>
                  <Calendar size={20} className="text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{playerStats?.gamesPlayed || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Goals</p>
                  <TrendingUp size={20} className="text-green-500" />
                </div>
                <p className="text-2xl font-bold">{playerStats?.goals || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Points</p>
                  <TrendingUp size={20} className="text-purple-500" />
                </div>
                <p className="text-2xl font-bold">{playerStats?.points || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={20} />
                  Upcoming Games
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gamesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : upcomingGames.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No upcoming games scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingGames.map((game: any) => {
                      const isAvailable = availability[game.id] !== false;
                      return (
                        <div key={game.id} className="border border-border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">
                                {game.teamHome?.name} vs {game.teamAway?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {game.date && game.time ? (
                                  <>
                                    {formatDate(game.date)} at {formatTime(game.time)}
                                  </>
                                ) : (
                                  'Time TBA'
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">{game.venue?.name}</p>
                            </div>
                            <Badge variant={isAvailable ? "default" : "destructive"}>
                              {isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedGameId(expandedGameId === game.id ? null : game.id)}
                              className="flex items-center gap-1"
                            >
                              <Users size={16} />
                              Team Availability
                              <ChevronDown size={16} className={`transition-transform ${expandedGameId === game.id ? 'rotate-180' : ''}`} />
                            </Button>
                            <Dialog open={selectedGame === game.id} onOpenChange={(open) => {
                            if (!open) {
                              setSelectedGame(null);
                              setIsDialogOpen(false);
                            } else {
                              setSelectedGame(game.id);
                              setIsDialogOpen(true);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedGame(game.id);
                                  setIsDialogOpen(true);
                                }}
                              >
                                {isAvailable ? "Mark Unavailable" : "Mark Available"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {isAvailable ? "Mark Unavailable" : "Mark Available"}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  {game.teamHome?.name} vs {game.teamAway?.name}
                                </p>
                                <div className="space-y-2">
                                  <Button
                                    className="w-full"
                                    onClick={() => {
                                      updateAvailabilityMutation.mutate({
                                        playerTeamId: playerReg.id,
                                        gameId: game.id,
                                        available: !isAvailable,
                                      });
                                    }}
                                    disabled={updateAvailabilityMutation.isPending}
                                  >
                                    {updateAvailabilityMutation.isPending && (
                                      <Loader2 size={16} className="mr-2 animate-spin" />
                                    )}
                                    Confirm
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                            </div>

                          {expandedGameId === game.id ? (
                            <div className="border-t border-border pt-3 mt-3">
                              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <Users size={16} />
                                Team Availability
                              </h4>
                              {teamAvailLoading ? (
                                <div className="flex justify-center py-4">
                                  <Loader2 className="animate-spin" size={20} />
                                </div>
                              ) : teamAvailability.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No availability data</p>
                              ) : (
                                <div className="space-y-2">
                                  {teamAvailability.map((player: any) => (
                                    <div key={player.playerTeamId} className="flex items-center justify-between p-2 bg-muted rounded">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{player.name}</p>
                                        {player.position && <p className="text-xs text-muted-foreground">{player.position}</p>}
                                      </div>
                                      <Badge variant={player.isAvailable ? "default" : "destructive"} className="ml-2">
                                        {player.isAvailable ? "Available" : "Unavailable"}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  Team Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Team Name</p>
                      <p className="font-semibold">{team?.name}</p>
                    </div>
                    {team?.colors && (
                      <div>
                        <p className="text-sm text-muted-foreground">Colors</p>
                        <p className="font-semibold">{team.colors}</p>
                      </div>
                    )}
                    {team?.captainId && (
                      <div>
                        <p className="text-sm text-muted-foreground">Team Captain</p>
                        <p className="font-semibold">Captain ID: {team.captainId}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
