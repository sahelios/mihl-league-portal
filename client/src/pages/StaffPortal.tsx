import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Clock, User, Lock, Users } from 'lucide-react';

export function StaffPortal() {
  const { user } = useAuth();
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());
  const [gameStaffStatus, setGameStaffStatus] = useState<Record<number, any>>({});

  // Get upcoming games
  const { data: upcomingGames, isLoading: gamesLoading } = trpc.league.getUpcomingGames.useQuery();

  // Get user's available games
  const { data: myAvailableGames, isLoading: availableLoading, refetch: refetchAvailable } = 
    trpc.league.getMyAvailableGames.useQuery();

  // Get staff status for each game
  const getGameStaffStatus = trpc.league.getGameStaffStatus.useQuery(
    { gameId: 0 },
    { enabled: false }
  );

  // Mutations - use referee.selectGameAvailability which properly creates staffAvailability records
  const updateAvailability = trpc.referee.selectGameAvailability.useMutation({
    onSuccess: () => {
      refetchAvailable();
      // Refetch all game statuses
      if (upcomingGames) {
        upcomingGames.forEach(game => {
          getGameStaffStatus.refetch({ gameId: game.id });
        });
      }
    },
    onError: (error: any) => {
      console.error('Failed to update availability:', error.message);
    }
  });

  // Initialize selected games from available games
  useEffect(() => {
    if (myAvailableGames) {
      const gameIds = new Set(myAvailableGames.map(g => g.id));
      setSelectedGames(gameIds);
    }
  }, [myAvailableGames]);

  // Load staff status for all games on mount
  useEffect(() => {
    if (upcomingGames && upcomingGames.length > 0) {
      const loadStatuses = async () => {
        const statuses: Record<number, any> = {};
        for (const game of upcomingGames) {
          const result = await getGameStaffStatus.refetch({ gameId: game.id });
          if (result.data) {
            statuses[game.id] = result.data;
          }
        }
        setGameStaffStatus(statuses);
      };
      loadStatuses();
    }
  }, [upcomingGames]);

  const handleToggleGame = async (gameId: number) => {
    const newSet = new Set(selectedGames);
    if (newSet.has(gameId)) {
      newSet.delete(gameId);
    } else {
      newSet.add(gameId);
    }
    setSelectedGames(newSet);
    // Call the mutation with all selected game IDs
    updateAvailability.mutate({ selectedGameIds: Array.from(newSet) });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to access the staff portal.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Staff Portal</h1>
        <p className="text-gray-600">Mark your availability for upcoming games</p>
      </div>

      {/* User Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Games List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Games</CardTitle>
          <CardDescription>Select the games you're available for</CardDescription>
        </CardHeader>
        <CardContent>
          {gamesLoading || availableLoading ? (
            <div className="text-center py-8">
              <Clock className="inline-block animate-spin text-gray-400" />
              <p className="text-gray-600 mt-2">Loading games...</p>
            </div>
          ) : upcomingGames && upcomingGames.length > 0 ? (
            <div className="space-y-4">
              {upcomingGames.map(game => {
                const staffStatus = gameStaffStatus[game.id];
                const isSelected = selectedGames.has(game.id);
                const isTaken = user?.role === 'referee' ? staffStatus?.referee : staffStatus?.scorekeeper;
                const canSelect = !isTaken || isSelected;

                // Get available staff for display
                const availableStaff = user?.role === 'referee' 
                  ? staffStatus?.availableReferees || []
                  : staffStatus?.availableScorekeepers || [];

                return (
                  <div
                    key={game.id}
                    className={`border rounded-lg p-4 transition ${
                      canSelect ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    {/* Game Header with Checkbox */}
                    <div className="flex items-start gap-4 mb-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleGame(game.id)}
                        disabled={
                          updateAvailability.isPending ||
                          (!canSelect && !isSelected)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-lg">
                          {game.teamAName} vs {game.teamBName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(game.gameDate + 'T00:00:00').toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })} at {game.gameTime}
                        </p>
                      </div>
                      {isSelected ? (
                        <Badge variant="default" className="flex items-center gap-1 whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3" />
                          Available
                        </Badge>
                      ) : isTaken ? (
                        <Badge variant="secondary" className="flex items-center gap-1 whitespace-nowrap">
                          <Lock className="w-3 h-3" />
                          Taken
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="whitespace-nowrap">Not Available</Badge>
                      )}
                    </div>

                    {/* Staff Status Section */}
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                      {/* Referee Column */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Referee
                        </h4>
                        {staffStatus?.referee ? (
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <p className="font-medium text-sm text-green-900">{staffStatus.referee.name}</p>
                            <p className="text-xs text-green-700">{staffStatus.referee.email}</p>
                            <Badge variant="default" className="mt-1 text-xs">Assigned</Badge>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p className="text-xs text-yellow-700 font-medium">No referee assigned</p>
                          </div>
                        )}
                        {staffStatus?.availableReferees && staffStatus.availableReferees.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs font-semibold text-blue-900 flex items-center gap-1 mb-1">
                              <Users className="w-3 h-3" />
                              Available ({staffStatus.availableReferees.length})
                            </p>
                            <div className="space-y-1">
                              {staffStatus.availableReferees.map((ref: any) => (
                                <div key={ref.id} className="text-xs text-blue-700">
                                  <p className="font-medium">{ref.name}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Scorekeeper Column */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Scorekeeper
                        </h4>
                        {staffStatus?.scorekeeper ? (
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <p className="font-medium text-sm text-green-900">{staffStatus.scorekeeper.name}</p>
                            <p className="text-xs text-green-700">{staffStatus.scorekeeper.email}</p>
                            <Badge variant="default" className="mt-1 text-xs">Assigned</Badge>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p className="text-xs text-yellow-700 font-medium">No scorekeeper assigned</p>
                          </div>
                        )}
                        {staffStatus?.availableScorekeepers && staffStatus.availableScorekeepers.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs font-semibold text-blue-900 flex items-center gap-1 mb-1">
                              <Users className="w-3 h-3" />
                              Available ({staffStatus.availableScorekeepers.length})
                            </p>
                            <div className="space-y-1">
                              {staffStatus.availableScorekeepers.map((sk: any) => (
                                <div key={sk.id} className="text-xs text-blue-700">
                                  <p className="font-medium">{sk.name}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Warning if taken */}
                    {isTaken && !isSelected && (
                      <div className="mt-3 text-xs text-red-600 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {user?.role === 'referee' ? 'Referee' : 'Scorekeeper'} already assigned: {isTaken.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <AlertCircle className="inline-block mb-2 text-gray-400" />
              <p>No upcoming games available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          You're available for <strong>{selectedGames.size}</strong> game(s).
        </p>
      </div>
    </div>
  );
}
