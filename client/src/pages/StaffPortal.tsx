import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Clock, User, Lock, Trash2 } from 'lucide-react';
// Toast notifications are handled by mutation callbacks

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

  // Mutations
  const addAvailability = trpc.league.addStaffAvailability.useMutation({
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
      console.error('Failed to mark availability:', error.message);
    }
  });

  const removeAvailability = trpc.league.removeStaffAvailability.useMutation({
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
      console.error('Failed to remove availability:', error.message);
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
    const isSelected = selectedGames.has(gameId);
    
    if (isSelected) {
      setSelectedGames(prev => {
        const newSet = new Set(prev);
        newSet.delete(gameId);
        return newSet;
      });
      removeAvailability.mutate({ gameId });
    } else {
      setSelectedGames(prev => new Set(prev).add(gameId));
      addAvailability.mutate({ gameId });
    }
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
            <div className="space-y-3">
              {upcomingGames.map(game => {
                const staffStatus = gameStaffStatus[game.id];
                const isSelected = selectedGames.has(game.id);
                const isTaken = user?.role === 'referee' ? staffStatus?.referee : staffStatus?.scorekeeper;
                const canSelect = !isTaken || isSelected;

                return (
                  <div
                    key={game.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg transition ${
                      canSelect ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleGame(game.id)}
                      disabled={
                        addAvailability.isPending || 
                        removeAvailability.isPending ||
                        (!canSelect && !isSelected)
                      }
                    />
                    <div className="flex-1">
                      <p className="font-semibold">
                        {game.teamAName} vs {game.teamBName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(game.gameDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })} at {game.gameTime}
                      </p>
                      {isTaken && !isSelected && (
                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {user?.role === 'referee' ? 'Referee' : 'Scorekeeper'} already assigned: {isTaken.name}
                        </div>
                      )}
                    </div>
                    {isSelected ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Available
                      </Badge>
                    ) : isTaken ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Taken
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Available</Badge>
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
