import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Users } from 'lucide-react';

export default function GameAssignments() {
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [selectedRefereeId, setSelectedRefereeId] = useState<number | null>(null);
  const [selectedScorekeeperId, setSelectedScorekeeperId] = useState<number | null>(null);

  // Get upcoming games
  const { data: games, isLoading: gamesLoading } = trpc.league.getUpcomingGames.useQuery();

  // Get current assignment for selected game
  const { data: currentAssignment } = trpc.admin.getGameAssignment.useQuery(
    { gameId: selectedGameId! },
    { enabled: !!selectedGameId }
  );

  // Get available referees for selected game
  const { data: availableReferees } = trpc.admin.getAvailableStaffForGame.useQuery(
    { gameId: selectedGameId!, role: 'referee' },
    { enabled: !!selectedGameId }
  );

  // Get available scorekeepers for selected game
  const { data: availableScorekeepers } = trpc.admin.getAvailableStaffForGame.useQuery(
    { gameId: selectedGameId!, role: 'scorekeeper' },
    { enabled: !!selectedGameId }
  );

  // Assignment mutation
  const assignStaff = trpc.admin.assignStaffToGame.useMutation({
    onSuccess: () => {
      setSelectedRefereeId(null);
      setSelectedScorekeeperId(null);
    },
  });

  // Initialize selected staff from current assignment
  useMemo(() => {
    if (currentAssignment) {
      setSelectedRefereeId(currentAssignment.refereeId);
      setSelectedScorekeeperId(currentAssignment.scorekeeperId);
    }
  }, [currentAssignment]);

  const selectedGame = games?.find(g => g.id === selectedGameId);

  const handleAssign = () => {
    if (!selectedGameId) return;
    assignStaff.mutate({
      gameId: selectedGameId,
      refereeId: selectedRefereeId || undefined,
      scorekeeperId: selectedScorekeeperId || undefined,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Game Assignments</h1>
        <p className="text-gray-600">Assign referees and scorekeepers to games</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Game</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gamesLoading ? (
              <p className="text-gray-600">Loading games...</p>
            ) : games && games.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {games.map(game => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGameId(game.id)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedGameId === game.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-sm">
                      {game.homeTeamId} vs {game.awayTeamId}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(game.gameDate).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No games available</p>
            )}
          </CardContent>
        </Card>

        {/* Assignment Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assign Staff</CardTitle>
            <CardDescription>
              {selectedGame
                ? `${selectedGame.homeTeamId} vs ${selectedGame.awayTeamId}`
                : 'Select a game to assign staff'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedGameId ? (
              <div className="text-center py-8 text-gray-600">
                <AlertCircle className="inline-block mb-2 text-gray-400" />
                <p>Select a game to assign staff</p>
              </div>
            ) : (
              <>
                {/* Current Assignment */}
                {currentAssignment && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-900 mb-2">Current Assignment</p>
                    <div className="space-y-1 text-sm text-green-800">
                      <p>
                        Referee: {currentAssignment.refereeId ? 'Assigned' : 'Not assigned'}
                      </p>
                      <p>
                        Scorekeeper: {currentAssignment.scorekeeperId ? 'Assigned' : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Referee Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Referee</label>
                  <Select
                    value={selectedRefereeId?.toString() || ''}
                    onValueChange={val => setSelectedRefereeId(val ? parseInt(val) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select referee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {availableReferees?.map(ref => (
                        <SelectItem key={ref.id} value={ref.id.toString()}>
                          {ref.firstName} {ref.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableReferees && availableReferees.length === 0 && (
                    <p className="text-xs text-gray-600 mt-1">No available referees</p>
                  )}
                </div>

                {/* Scorekeeper Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Scorekeeper</label>
                  <Select
                    value={selectedScorekeeperId?.toString() || ''}
                    onValueChange={val => setSelectedScorekeeperId(val ? parseInt(val) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select scorekeeper" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {availableScorekeepers?.map(sk => (
                        <SelectItem key={sk.id} value={sk.id.toString()}>
                          {sk.firstName} {sk.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableScorekeepers && availableScorekeepers.length === 0 && (
                    <p className="text-xs text-gray-600 mt-1">No available scorekeepers</p>
                  )}
                </div>

                {/* Assign Button */}
                <Button
                  onClick={handleAssign}
                  disabled={assignStaff.isPending}
                  className="w-full"
                >
                  {assignStaff.isPending ? 'Assigning...' : 'Assign Staff'}
                </Button>

                {assignStaff.isSuccess && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">Staff assigned successfully</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
