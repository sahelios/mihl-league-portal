import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Users, Loader2, Plus, X } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/dateUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function StaffAvailability() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);

  // Get upcoming games - always call hooks, but conditionally use data
  const { data: upcomingGames = [], isLoading: gamesLoading } = trpc.league.getUpcomingGames.useQuery();

  // Check auth and loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  // Admin Access Check
  if (!user || user.email !== 'sarzouan@gmail.com') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6 text-center">
          You do not have permission to view this page.
        </p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Staff Availability</h1>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="space-y-4">
          {gamesLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">Loading games...</p>
              </CardContent>
            </Card>
          ) : upcomingGames.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">No upcoming games</p>
              </CardContent>
            </Card>
          ) : (
            upcomingGames.map(game => (
              <GameAvailabilityCard
                key={game.id}
                game={game}
                isExpanded={expandedGameId === game.id}
                onToggle={() => setExpandedGameId(expandedGameId === game.id ? null : game.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface GameAvailabilityCardProps {
  game: any;
  isExpanded: boolean;
  onToggle: () => void;
}

function GameAvailabilityCard({ game, isExpanded, onToggle }: GameAvailabilityCardProps) {
  const [selectedReferee, setSelectedReferee] = useState<number | null>(null);
  const [selectedScorekeeper, setSelectedScorekeeper] = useState<number | null>(null);

  const { data: referees = [] } = trpc.admin.getAvailableStaffForGame.useQuery(
    { gameId: game.id, role: 'referee' },
    { enabled: isExpanded }
  );

  const { data: scorekeepers = [] } = trpc.admin.getAvailableStaffForGame.useQuery(
    { gameId: game.id, role: 'scorekeeper' },
    { enabled: isExpanded }
  );

  const { data: allReferees = [] } = trpc.admin.getAllApprovedStaff.useQuery(
    { role: 'referee' },
    { enabled: isExpanded }
  );

  const { data: allScorekeepers = [] } = trpc.admin.getAllApprovedStaff.useQuery(
    { role: 'scorekeeper' },
    { enabled: isExpanded }
  );

  const { data: gameAssignment } = trpc.admin.getGameAssignment.useQuery(
    { gameId: game.id },
    { enabled: isExpanded }
  );

  const assignStaffMutation = trpc.admin.assignStaffToGame.useMutation();
  const removeStaffMutation = trpc.admin.removeStaffFromGame.useMutation();

  const homeTeamName = game.teamAName || `Team ${game.homeTeamId}`;
  const awayTeamName = game.teamBName || `Team ${game.awayTeamId}`;
  const gameLabel = game.isEvaluationGame ? 'Team White vs Team Black' : `${homeTeamName} vs ${awayTeamName}`;

  const handleAssignReferee = async () => {
    if (!selectedReferee) return;
    await assignStaffMutation.mutateAsync({
      gameId: game.id,
      refereeId: selectedReferee,
    });
    setSelectedReferee(null);
  };

  const handleAssignScorekeeper = async () => {
    if (!selectedScorekeeper) return;
    await assignStaffMutation.mutateAsync({
      gameId: game.id,
      scorekeeperId: selectedScorekeeper,
    });
    setSelectedScorekeeper(null);
  };

  const handleRemoveReferee = async () => {
    await removeStaffMutation.mutateAsync({
      gameId: game.id,
      role: 'referee',
    });
  };

  const handleRemoveScorekeeper = async () => {
    await removeStaffMutation.mutateAsync({
      gameId: game.id,
      role: 'scorekeeper',
    });
  };

  const assignedReferee = gameAssignment?.refereeId 
    ? allReferees.find(r => r.id === gameAssignment.refereeId)
    : null;

  const assignedScorekeeper = gameAssignment?.scorekeeperId
    ? allScorekeepers.find(s => s.id === gameAssignment.scorekeeperId)
    : null;

  return (
    <Card className="cursor-pointer hover:shadow-md transition" onClick={onToggle}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{gameLabel}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(game.gameDate)} at {formatTime(game.gameTime)}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {referees.length} Available
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {scorekeepers.length} Available
            </Badge>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-6" onClick={(e) => e.stopPropagation()}>
          {/* Assigned Referees */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Assigned Referee</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8">
                    <Plus className="w-3 h-3 mr-1" />
                    Assign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Referee</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={selectedReferee?.toString() || ''} onValueChange={(v) => setSelectedReferee(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a referee" />
                      </SelectTrigger>
                      <SelectContent>
                        {allReferees.map(ref => (
                          <SelectItem key={ref.id} value={ref.id.toString()}>
                            {ref.firstName} {ref.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAssignReferee}
                      disabled={!selectedReferee || assignStaffMutation.isPending}
                    >
                      {assignStaffMutation.isPending ? 'Assigning...' : 'Assign Referee'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {assignedReferee ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">{assignedReferee.firstName} {assignedReferee.lastName}</p>
                  <p className="text-xs text-muted-foreground">{assignedReferee.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveReferee}
                  disabled={removeStaffMutation.isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No referee assigned</p>
            )}
          </div>

          {/* Available Referees */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Available Referees ({referees.length})</h3>
            {referees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referees available</p>
            ) : (
              <div className="space-y-2">
                {referees.map(ref => (
                  <div key={ref.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{ref.firstName} {ref.lastName}</p>
                      <p className="text-xs text-muted-foreground">{ref.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {ref.yearsOfExperience} years
                      </p>
                      {ref.desiredPayPerGame && (
                        <p className="text-xs font-medium">${ref.desiredPayPerGame}/game</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Scorekeepers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Assigned Scorekeeper</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8">
                    <Plus className="w-3 h-3 mr-1" />
                    Assign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Scorekeeper</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={selectedScorekeeper?.toString() || ''} onValueChange={(v) => setSelectedScorekeeper(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a scorekeeper" />
                      </SelectTrigger>
                      <SelectContent>
                        {allScorekeepers.map(sk => (
                          <SelectItem key={sk.id} value={sk.id.toString()}>
                            {sk.firstName} {sk.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAssignScorekeeper}
                      disabled={!selectedScorekeeper || assignStaffMutation.isPending}
                    >
                      {assignStaffMutation.isPending ? 'Assigning...' : 'Assign Scorekeeper'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {assignedScorekeeper ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">{assignedScorekeeper.firstName} {assignedScorekeeper.lastName}</p>
                  <p className="text-xs text-muted-foreground">{assignedScorekeeper.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveScorekeeper}
                  disabled={removeStaffMutation.isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No scorekeeper assigned</p>
            )}
          </div>

          {/* Available Scorekeepers */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Available Scorekeepers ({scorekeepers.length})</h3>
            {scorekeepers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scorekeepers available</p>
            ) : (
              <div className="space-y-2">
                {scorekeepers.map(sk => (
                  <div key={sk.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{sk.firstName} {sk.lastName}</p>
                      <p className="text-xs text-muted-foreground">{sk.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {sk.yearsOfExperience} years
                      </p>
                      {sk.desiredPayPerGame && (
                        <p className="text-xs font-medium">${sk.desiredPayPerGame}/game</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
