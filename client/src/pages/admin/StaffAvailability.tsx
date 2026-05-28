import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Users } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/dateUtils';

export default function StaffAvailability() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);

  // Admin Access Check
  if (user?.email !== 'sarzouan@gmail.com') {
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

  // Get upcoming games
  const { data: upcomingGames = [], isLoading: gamesLoading } = trpc.league.getUpcomingGames.useQuery();

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
  const { data: referees = [] } = trpc.admin.getAvailableStaffForGame.useQuery(
    { gameId: game.id, role: 'referee' },
    { enabled: isExpanded }
  );

  const { data: scorekeepers = [] } = trpc.admin.getAvailableStaffForGame.useQuery(
    { gameId: game.id, role: 'scorekeeper' },
    { enabled: isExpanded }
  );

  const homeTeamName = game.teamAName || `Team ${game.homeTeamId}`;
  const awayTeamName = game.teamBName || `Team ${game.awayTeamId}`;
  const gameLabel = game.isEvaluationGame ? 'Team White vs Team Black' : `${homeTeamName} vs ${awayTeamName}`;

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
              {referees.length} Referees
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {scorekeepers.length} Scorekeepers
            </Badge>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-6">
          {/* Referees */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Referees ({referees.length})</h3>
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
                        {ref.experience} years
                      </p>
                      {ref.desiredSalary && (
                        <p className="text-xs font-medium">${ref.desiredSalary}/game</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scorekeepers */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Scorekeepers ({scorekeepers.length})</h3>
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
                        {sk.experience} years
                      </p>
                      {sk.desiredSalary && (
                        <p className="text-xs font-medium">${sk.desiredSalary}/game</p>
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
