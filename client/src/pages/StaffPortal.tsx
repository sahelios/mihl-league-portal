import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export function StaffPortal() {
  const { user } = useAuth();
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());

  // Get upcoming games
  const { data: upcomingGames, isLoading: gamesLoading } = trpc.league.getUpcomingGames.useQuery();

  // Get user's available games
  const { data: myAvailableGames, isLoading: availableLoading, refetch: refetchAvailable } = 
    trpc.league.getMyAvailableGames.useQuery();

  // Mutations
  const addAvailability = trpc.league.addStaffAvailability.useMutation({
    onSuccess: () => refetchAvailable(),
  });

  const removeAvailability = trpc.league.removeStaffAvailability.useMutation({
    onSuccess: () => refetchAvailable(),
  });

  // Initialize selected games from available games
  useEffect(() => {
    if (myAvailableGames) {
      const gameIds = new Set(myAvailableGames.map(g => g.id));
      setSelectedGames(gameIds);
    }
  }, [myAvailableGames]);

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
              {upcomingGames.map(game => (
                <div
                  key={game.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <Checkbox
                    checked={selectedGames.has(game.id)}
                    onCheckedChange={() => handleToggleGame(game.id)}
                    disabled={addAvailability.isPending || removeAvailability.isPending}
                  />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {game.homeTeamId} vs {game.awayTeamId}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(game.gameDate).toLocaleDateString()} at {game.gameTime}
                    </p>
                  </div>
                  {selectedGames.has(game.id) ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Available</Badge>
                  )}
                </div>
              ))}
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
          Admins will use this information to assign referees and scorekeepers.
        </p>
      </div>
    </div>
  );
}
