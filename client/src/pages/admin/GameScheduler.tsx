import React, { useState } from 'react';
import { useRouter } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface VenueSchedule {
  days: number[];
  times: string[];
}

interface EvaluationGame {
  date: string;
  time: string;
  venueId: number;
}

interface ScheduledGame {
  id: string;
  homeTeamId: number;
  awayTeamId: number;
  venueId: number;
  gameDate: string;
  gameTime: string;
  seasonId: number;
}

export default function GameScheduler() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const language = 'en';
  const utils = trpc.useUtils();

  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<number[]>([]);
  const [venueSchedules, setVenueSchedules] = useState<Map<number, VenueSchedule>>(new Map());
  const [expandedVenue, setExpandedVenue] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [evaluationGameCount, setEvaluationGameCount] = useState(0);
  const [evaluationGames, setEvaluationGames] = useState<EvaluationGame[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  const [scheduledGames, setScheduledGames] = useState<ScheduledGame[]>([]);

  // Queries
  const { data: seasons } = trpc.admin.getSeasons.useQuery();
  const { data: teams } = trpc.admin.getTeams.useQuery(seasonId ? { seasonId } : undefined);
  const { data: venues } = trpc.admin.getVenues.useQuery();
  const createGamesMutation = trpc.admin.createGames.useMutation();

  if (authLoading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') {
    router.replace('/');
    return null;
  }

  const toggleTeam = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) ? prev.filter(t => t !== teamId) : [...prev, teamId]
    );
  };

  const toggleVenue = (venueId: number) => {
    setSelectedVenues(prev => 
      prev.includes(venueId) ? prev.filter(v => v !== venueId) : [...prev, venueId]
    );
  };

  const toggleDay = (venueId: number, dayOfWeek: number) => {
    const schedule = venueSchedules.get(venueId) || { days: [], times: [] };
    const newDays = schedule.days.includes(dayOfWeek)
      ? schedule.days.filter(d => d !== dayOfWeek)
      : [...schedule.days, dayOfWeek];
    
    const newSchedule = { ...schedule, days: newDays };
    const newMap = new Map(venueSchedules);
    newMap.set(venueId, newSchedule);
    setVenueSchedules(newMap);
  };

  const addTimeSlot = (venueId: number, time: string) => {
    const schedule = venueSchedules.get(venueId) || { days: [], times: [] };
    if (!schedule.times.includes(time)) {
      const newSchedule = { ...schedule, times: [...schedule.times, time] };
      const newMap = new Map(venueSchedules);
      newMap.set(venueId, newSchedule);
      setVenueSchedules(newMap);
    }
  };

  const removeTimeSlot = (venueId: number, time: string) => {
    const schedule = venueSchedules.get(venueId) || { days: [], times: [] };
    const newSchedule = { ...schedule, times: schedule.times.filter(t => t !== time) };
    const newMap = new Map(venueSchedules);
    newMap.set(venueId, newSchedule);
    setVenueSchedules(newMap);
  };

  const addBlackoutDate = () => {
    if (newBlackoutDate && !blackoutDates.includes(newBlackoutDate)) {
      setBlackoutDates([...blackoutDates, newBlackoutDate]);
      setNewBlackoutDate('');
    }
  };

  const removeBlackoutDate = (date: string) => {
    setBlackoutDates(blackoutDates.filter(d => d !== date));
  };

  const updateEvaluationGame = (index: number, field: string, value: string | number) => {
    const newGames = [...evaluationGames];
    newGames[index] = { ...newGames[index], [field]: value };
    setEvaluationGames(newGames);
  };

  const initializeEvaluationGames = (count: number) => {
    const newGames: EvaluationGame[] = [];
    for (let i = 0; i < count; i++) {
      newGames.push({ date: '', time: '', venueId: 0 });
    }
    setEvaluationGames(newGames);
  };

  const generateSchedule = () => {
    if (!seasonId) {
      toast.error('Please select a season');
      return;
    }
    if (selectedTeams.length === 0) {
      toast.error('Please select at least one team');
      return;
    }
    if (selectedVenues.length === 0) {
      toast.error('Please select at least one venue');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please set start and end dates');
      return;
    }

    // Validate venue configurations
    for (const venueId of selectedVenues) {
      const schedule = venueSchedules.get(venueId);
      if (!schedule || schedule.days.length === 0 || schedule.times.length === 0) {
        const venueName = venues?.find(v => v.id === venueId)?.name || `Venue ${venueId}`;
        toast.error(`${venueName}: Configure at least one day and time slot`);
        return;
      }
    }

    // Validate evaluation games if any
    if (evaluationGameCount > 0) {
      for (let i = 0; i < evaluationGameCount; i++) {
        if (!evaluationGames[i]?.date || !evaluationGames[i]?.time || !evaluationGames[i]?.venueId) {
          toast.error(`Evaluation game ${i + 1}: Please set date, time, and venue`);
          return;
        }
      }
    }

    console.log('DEBUG: Starting game generation');
    const start = new Date(startDate);
    const end = new Date(endDate);
    console.log(`DEBUG: Start date: ${start} End date: ${end}`);
    console.log(`DEBUG: Selected teams: ${selectedTeams}`);

    // Create evaluation games
    const games: ScheduledGame[] = [];
    const evaluationDates: string[] = [];

    for (let i = 0; i < evaluationGameCount; i++) {
      const evalGame = evaluationGames[i];
      games.push({
        id: `eval-${i}-white-black`,
        homeTeamId: 1, // Team White
        awayTeamId: 2, // Team Black
        venueId: evalGame.venueId,
        gameDate: evalGame.date,
        gameTime: evalGame.time,
        seasonId,
      });
      evaluationDates.push(evalGame.date);
    }

    console.log(`DEBUG: Total matchups: ${selectedTeams.length * (selectedTeams.length - 1)}`);
    console.log(`DEBUG: Evaluation dates: ${evaluationDates}`);
    console.log(`DEBUG: Blackout dates: ${blackoutDates}`);

    // Generate all possible matchups
    const matchups: Array<{ home: number; away: number }> = [];
    for (const homeTeam of selectedTeams) {
      for (const awayTeam of selectedTeams) {
        if (homeTeam !== awayTeam) {
          matchups.push({ home: homeTeam, away: awayTeam });
        }
      }
    }

    // Collect all available game slots
    const gameSlots: Array<{ date: string; venueId: number; time: string }> = [];
    const end_date_obj = new Date(endDate);
    console.log(`DEBUG: End date object: ${end_date_obj}`);
    const end_date_str = endDate;
    console.log(`DEBUG: End date string: ${end_date_str}`);

    let currentDate = new Date(startDate);
    let loopCount = 0;
    while (currentDate <= end_date_obj) {
      loopCount++;
      const dateStr = currentDate.toISOString().split('T')[0];
      console.log(`DEBUG: Loop ${loopCount} - Current: ${dateStr}, End: ${end_date_str}, Compare: ${currentDate <= end_date_obj}`);

      // Skip blackout dates and evaluation dates
      if (!blackoutDates.includes(dateStr) && !evaluationDates.includes(dateStr)) {
        for (const venueId of selectedVenues) {
          const schedule = venueSchedules.get(venueId);
          if (schedule) {
            const dayOfWeek = currentDate.getDay();
            if (schedule.days.includes(dayOfWeek)) {
              for (const time of schedule.times) {
                gameSlots.push({ date: dateStr, venueId, time });
              }
            }
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('DEBUG: Total game slots available:', gameSlots.length);
    console.log('DEBUG: Game slots:', gameSlots);

    // Build league week mapping
    const dateToLeagueWeek: Map<string, number> = new Map();
    const sortedDates = gameSlots.map(s => s.date).filter((v, i, a) => a.indexOf(v) === i).sort();

    let currentLeagueWeek = 0;
    const daysInCurrentWeek = new Set<number>();

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();

      if (daysInCurrentWeek.has(dayOfWeek)) {
        currentLeagueWeek++;
        daysInCurrentWeek.clear();
      }

      daysInCurrentWeek.add(dayOfWeek);
      dateToLeagueWeek.set(dateStr, currentLeagueWeek);
    }

    // Track venue distribution per team
    const teamVenueCount: Map<number, Map<number, number>> = new Map();
    selectedTeams.forEach(teamId => {
      teamVenueCount.set(teamId, new Map());
      selectedVenues.forEach(venueId => {
        teamVenueCount.get(teamId)!.set(venueId, 0);
      });
    });

    // Track weekly games per team to ensure one game per league week
    const teamLeagueWeekGames: Map<number, Map<number, number>> = new Map();
    selectedTeams.forEach(teamId => {
      teamLeagueWeekGames.set(teamId, new Map());
    });

    // Assign matchups to available slots
    let matchupIndex = 0;
    let seasonGamesCreated = 0;
    console.log(`DEBUG: About to assign games. Available slots: ${gameSlots.length}, Available matchups: ${matchups.length - matchupIndex}`);

    for (const slot of gameSlots) {
      if (matchupIndex >= matchups.length) {
        matchupIndex = 0;
      }

      const leagueWeekNumber = dateToLeagueWeek.get(slot.date) || 0;

      // Try to find a matchup where neither team has a game this league week
      let selectedMatchupIndex = matchupIndex;
      let attemptCount = 0;
      const maxAttempts = matchups.length;

      while (attemptCount < maxAttempts) {
        const testMatchup = matchups[selectedMatchupIndex];
        const homeLeagueWeekGames = teamLeagueWeekGames.get(testMatchup.home)!;
        const awayLeagueWeekGames = teamLeagueWeekGames.get(testMatchup.away)!;

        const homeGamesThisWeek = homeLeagueWeekGames.get(leagueWeekNumber) || 0;
        const awayGamesThisWeek = awayLeagueWeekGames.get(leagueWeekNumber) || 0;

        // If neither team has a game this week, use this matchup
        if (homeGamesThisWeek === 0 && awayGamesThisWeek === 0) {
          matchupIndex = selectedMatchupIndex;
          break;
        }

        // Try next matchup
        selectedMatchupIndex++;
        if (selectedMatchupIndex >= matchups.length) {
          selectedMatchupIndex = 0;
        }
        attemptCount++;
      }

      // Use the selected matchup (either valid or fallback)
      const matchup = matchups[matchupIndex];

      // Find the venue with the least games for both teams
      const homeTeamVenueCounts = teamVenueCount.get(matchup.home)!;
      const awayTeamVenueCounts = teamVenueCount.get(matchup.away)!;

      let bestVenueId = slot.venueId;
      let bestScore = (homeTeamVenueCounts.get(slot.venueId) || 0) + (awayTeamVenueCounts.get(slot.venueId) || 0);

      // Check other venues that have games at this date/time
      const sameTimeSlots = gameSlots.filter(s => s.date === slot.date && s.time === slot.time);
      for (const otherSlot of sameTimeSlots) {
        const homeCount = homeTeamVenueCounts.get(otherSlot.venueId) || 0;
        const awayCount = awayTeamVenueCounts.get(otherSlot.venueId) || 0;
        const score = homeCount + awayCount;
        if (score < bestScore) {
          bestScore = score;
          bestVenueId = otherSlot.venueId;
        }
      }

      games.push({
        id: `${slot.date}-${bestVenueId}-${slot.time}-${matchupIndex}`,
        homeTeamId: matchup.home,
        awayTeamId: matchup.away,
        venueId: bestVenueId,
        gameDate: slot.date,
        gameTime: slot.time,
        seasonId,
      });

      // Update venue counts
      homeTeamVenueCounts.set(bestVenueId, (homeTeamVenueCounts.get(bestVenueId) || 0) + 1);
      awayTeamVenueCounts.set(bestVenueId, (awayTeamVenueCounts.get(bestVenueId) || 0) + 1);

      // Update league week game counts
      const homeLeagueWeekGames = teamLeagueWeekGames.get(matchup.home)!;
      const awayLeagueWeekGames = teamLeagueWeekGames.get(matchup.away)!;
      homeLeagueWeekGames.set(leagueWeekNumber, (homeLeagueWeekGames.get(leagueWeekNumber) || 0) + 1);
      awayLeagueWeekGames.set(leagueWeekNumber, (awayLeagueWeekGames.get(leagueWeekNumber) || 0) + 1);

      matchupIndex++;
      seasonGamesCreated++;
    }
    console.log(`DEBUG: Created ${seasonGamesCreated} season games with balanced venue distribution`);

    setScheduledGames(games);
    toast.success(`Generated ${games.length} games (${evaluationGameCount > 0 ? `${evaluationGameCount} evaluation + ` : ''}${games.length - evaluationGameCount} regular)`);
  };

  const removeGame = (id: string) => {
    setScheduledGames(prev => prev.filter(g => g.id !== id));
  };

  const submitSchedule = async () => {
    if (scheduledGames.length === 0) {
      toast.error('No games to submit');
      return;
    }

    try {
      await createGamesMutation.mutateAsync({
        games: scheduledGames.map(g => ({
          homeTeamId: g.homeTeamId,
          awayTeamId: g.awayTeamId,
          venueId: g.venueId,
          gameDate: g.gameDate,
          gameTime: g.gameTime,
          seasonId: g.seasonId,
        })),
      });
      toast.success('Games created successfully');
      setScheduledGames([]);
    } catch (error) {
      toast.error('Failed to create games: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold">Game Scheduler</h1>
      </div>

      {/* Season Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Season</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={seasonId?.toString() || ''} onValueChange={v => setSeasonId(parseInt(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              {seasons?.map(s => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Team Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>Select teams for the season</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {teams?.map(team => (
            <div key={team.id} className="flex items-center gap-2">
              <Checkbox 
                checked={selectedTeams.includes(team.id)}
                onCheckedChange={() => toggleTeam(team.id)}
              />
              <label>{team.name}</label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Venue Selection and Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Venues</CardTitle>
          <CardDescription>Select venues and configure their schedules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {venues?.map(venue => (
            <div key={venue.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedVenues.includes(venue.id)}
                    onCheckedChange={() => toggleVenue(venue.id)}
                  />
                  <label className="font-medium">{venue.name}</label>
                </div>
                {selectedVenues.includes(venue.id) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setExpandedVenue(expandedVenue === venue.id ? null : venue.id)}
                  >
                    {expandedVenue === venue.id ? 'Hide' : 'Configure'}
                  </Button>
                )}
              </div>

              {expandedVenue === venue.id && selectedVenues.includes(venue.id) && (
                <div className="ml-6 space-y-3 border-l-2 pl-4">
                  {/* Days Selection */}
                  <div>
                    <Label className="text-sm font-medium">Available Days</Label>
                    <div className="grid grid-cols-7 gap-2 mt-2">
                      {dayNames.map((day, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <Checkbox 
                            checked={venueSchedules.get(venue.id)?.days.includes(idx) || false}
                            onCheckedChange={() => toggleDay(venue.id, idx)}
                          />
                          <span className="text-xs">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <Label className="text-sm font-medium">Time Slots</Label>
                    <div className="space-y-2 mt-2">
                      {venueSchedules.get(venue.id)?.times.map((time, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                          <span>{time}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeTimeSlot(venue.id, time)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input 
                          type="time" 
                          placeholder="HH:MM"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addTimeSlot(venue.id, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <Button 
                          onClick={(e) => {
                            const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                            addTimeSlot(venue.id, input.value);
                            input.value = '';
                          }}
                          size="sm"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Evaluation Games */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Games</CardTitle>
          <CardDescription>Configure evaluation games (Team White vs Team Black)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Number of Evaluation Games</Label>
            <Input 
              type="number" 
              min="0" 
              max="10"
              value={evaluationGameCount}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 0;
                setEvaluationGameCount(count);
                initializeEvaluationGames(count);
              }}
            />
          </div>

          {evaluationGames.map((game, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Evaluation Game {idx + 1}</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm">Date</Label>
                  <Input 
                    type="date"
                    value={game.date}
                    onChange={(e) => updateEvaluationGame(idx, 'date', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm">Time</Label>
                  <Input 
                    type="time"
                    value={game.time}
                    onChange={(e) => updateEvaluationGame(idx, 'time', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm">Venue</Label>
                  <Select value={game.venueId?.toString() || ''} onValueChange={v => updateEvaluationGame(idx, 'venueId', parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues?.map(v => (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Date Range */}
      <Card>
        <CardHeader>
          <CardTitle>Season Date Range</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Blackout Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Blackout Dates</CardTitle>
          <CardDescription>Dates when no games should be scheduled</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input 
              type="date"
              value={newBlackoutDate}
              onChange={(e) => setNewBlackoutDate(e.target.value)}
            />
            <Button onClick={addBlackoutDate} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {blackoutDates.map(date => (
              <div key={date} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <span>{date}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeBlackoutDate(date)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate Schedule Button */}
      <Button onClick={generateSchedule} className="w-full" size="lg">
        Generate Schedule
      </Button>

      {/* Scheduled Games */}
      {scheduledGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Games ({scheduledGames.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {scheduledGames.map(game => {
              const homeTeam = teams?.find(t => t.id === game.homeTeamId);
              const awayTeam = teams?.find(t => t.id === game.awayTeamId);
              const venue = venues?.find(v => v.id === game.venueId);
              const homeTeamName = game.homeTeamId === 1 ? 'Team White' : homeTeam?.name || `Team ${game.homeTeamId}`;
              const awayTeamName = game.awayTeamId === 2 ? 'Team Black' : awayTeam?.name || `Team ${game.awayTeamId}`;

              return (
                <div key={game.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                  <div className="flex-1">
                    <div className="font-medium">{homeTeamName} vs {awayTeamName}</div>
                    <div className="text-sm text-gray-600">
                      {game.gameDate} @ {game.gameTime} - {venue?.name}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeGame(game.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {scheduledGames.length > 0 && (
        <Button onClick={submitSchedule} className="w-full" size="lg" disabled={createGamesMutation.isPending}>
          {createGamesMutation.isPending ? 'Submitting...' : 'Submit Schedule'}
        </Button>
      )}
    </div>
  );
}
