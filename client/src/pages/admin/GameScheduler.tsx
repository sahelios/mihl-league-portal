import { useState } from 'react';
import { useLocation } from 'wouter';
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
  isEvaluationGame?: boolean;
}

// Helper function to generate all perfect matchings
function generatePerfectMatchings(teamIndices: number[]): number[][][] {
  if (teamIndices.length === 2) {
    return [[[teamIndices[0], teamIndices[1]]]];
  }
  
  const first = teamIndices[0];
  const rest = teamIndices.slice(1);
  const result: number[][][] = [];
  
  for (let i = 0; i < rest.length; i++) {
    const partner = rest[i];
    const remaining = rest.slice(0, i).concat(rest.slice(i + 1));
    const subMatchings = generatePerfectMatchings(remaining);
    
    for (const subMatching of subMatchings) {
      result.push([[first, partner], ...subMatching]);
    }
  }
  
  return result;
}

export default function GameScheduler() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
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
  const { data: teams } = trpc.admin.getTeams.useQuery(seasonId ? { seasonId } : undefined, { enabled: !!seasonId });
  const { data: masterTeams } = trpc.admin.getMasterTeams.useQuery({});
  const { data: venues } = trpc.admin.getVenues.useQuery();
  const createGamesMutation = trpc.admin.createGames.useMutation();
  
  // Use master teams if no season is selected, otherwise use season teams
  const teamsToDisplay = seasonId ? teams : masterTeams;

  if (authLoading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') {
    navigate('/');
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

    // Validate for weekly mode
    if (selectedTeams.length % 2 !== 0) {
      toast.error('Weekly mode requires an even number of teams');
      return;
    }
    if (selectedVenues.length !== selectedTeams.length / 2) {
      toast.error(`For ${selectedTeams.length} teams, you need exactly ${selectedTeams.length / 2} venues`);
      return;
    }

    const games: ScheduledGame[] = [];
    const evaluationDates: string[] = [];

    // Create evaluation games
    const teamWhiteId = 1;
    const teamBlackId = 2;

    for (let i = 0; i < evaluationGameCount; i++) {
      const evalGame = evaluationGames[i];
      games.push({
        id: `eval-${i}-white-black`,
        homeTeamId: teamWhiteId,
        awayTeamId: teamBlackId,
        venueId: evalGame.venueId,
        gameDate: evalGame.date,
        gameTime: evalGame.time,
        seasonId,
        isEvaluationGame: true,
      });
      evaluationDates.push(evalGame.date);
    }

    // Parse dates
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    let currentDate = new Date(startYear, startMonth - 1, startDay);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const endDateObj = new Date(endYear, endMonth - 1, endDay);

    // Collect all available game slots
    const gameSlots: Array<{ date: string; venueId: number; time: string }> = [];

    while (currentDate <= endDateObj) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

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

    if (gameSlots.length === 0) {
      toast.error('No available game slots found. Check your date range and venue schedules.');
      return;
    }

    // Build league week mapping
    const dateToLeagueWeek: Map<string, number> = new Map();
    const sortedDates = gameSlots.map(s => s.date).filter((v, i, a) => a.indexOf(v) === i).sort();

    let currentLeagueWeek = 0;
    const daysInCurrentWeek = new Set<number>();

    for (const dateStr of sortedDates) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();

      if (daysInCurrentWeek.has(dayOfWeek)) {
        currentLeagueWeek++;
        daysInCurrentWeek.clear();
      }

      daysInCurrentWeek.add(dayOfWeek);
      dateToLeagueWeek.set(dateStr, currentLeagueWeek);
    }

    // Generate perfect matchings for weekly scheduling
    const teamIndices = selectedTeams.map((_, i) => i);
    const matchings = generatePerfectMatchings(teamIndices);
    const numWeeks = Math.floor(gameSlots.length / selectedVenues.length);

    // Build matching sequence (cycle through matchings)
    const matchingSequence: number[] = [];
    for (let w = 0; w < numWeeks; w++) {
      matchingSequence.push(w % matchings.length);
    }

    // Assign games using weekly scheduling
    let gameIndex = 0;
    for (let weekIdx = 0; weekIdx < matchingSequence.length; weekIdx++) {
      const matchingIdx = matchingSequence[weekIdx];
      const matching = matchings[matchingIdx];

      // Get slots for this week
      const weekSlots = gameSlots.slice(weekIdx * selectedVenues.length, (weekIdx + 1) * selectedVenues.length);
      
      if (weekSlots.length === 0) break;

      // Alternate venue assignment direction each week for balance
      const venueOrder = weekIdx % 2 === 0 
        ? selectedVenues 
        : [...selectedVenues].reverse();

      for (let pairIdx = 0; pairIdx < matching.length && pairIdx < weekSlots.length; pairIdx++) {
        const [homeTeamIdx, awayTeamIdx] = matching[pairIdx];
        const slot = weekSlots[pairIdx];

        games.push({
          id: `${slot.date}-${slot.venueId}-${slot.time}-${gameIndex}`,
          homeTeamId: selectedTeams[homeTeamIdx],
          awayTeamId: selectedTeams[awayTeamIdx],
          venueId: slot.venueId,
          gameDate: slot.date,
          gameTime: slot.time,
          seasonId,
          isEvaluationGame: false,
        });

        gameIndex++;
      }
    }

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
          isEvaluationGame: g.isEvaluationGame || false,
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
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded">
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
      {seasonId && (
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>Select an even number of teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {teamsToDisplay?.map(team => (
                <div key={team.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`team-${team.id}`}
                    checked={selectedTeams.includes(team.id)}
                    onCheckedChange={() => toggleTeam(team.id)}
                  />
                  <label htmlFor={`team-${team.id}`} className="text-sm cursor-pointer">
                    {team.name}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Venue Selection & Configuration */}
      {seasonId && (
        <Card>
          <CardHeader>
            <CardTitle>Venues</CardTitle>
            <CardDescription>Select venues and configure their schedules (need {selectedTeams.length / 2} venues for {selectedTeams.length} teams)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {venues?.map(venue => (
                <div key={venue.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`venue-${venue.id}`}
                    checked={selectedVenues.includes(venue.id)}
                    onCheckedChange={() => toggleVenue(venue.id)}
                  />
                  <label htmlFor={`venue-${venue.id}`} className="text-sm cursor-pointer">
                    {venue.name}
                  </label>
                </div>
              ))}
            </div>

            {/* Venue Schedule Configuration */}
            {selectedVenues.length > 0 && (
              <div className="space-y-4 mt-6">
                {selectedVenues.map(venueId => {
                  const venue = venues?.find(v => v.id === venueId);
                  const schedule = venueSchedules.get(venueId) || { days: [], times: [] };
                  const isExpanded = expandedVenue === venueId;

                  return (
                    <div key={venueId} className="border rounded-lg p-4">
                      <button
                        onClick={() => setExpandedVenue(isExpanded ? null : venueId)}
                        className="w-full text-left font-semibold flex justify-between items-center"
                      >
                        {venue?.name}
                        <span>{isExpanded ? '▼' : '▶'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          {/* Days Selection */}
                          <div>
                            <label className="text-sm font-medium">Days of Week</label>
                            <div className="grid grid-cols-7 gap-2 mt-2">
                              {dayNames.map((day, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => toggleDay(venueId, idx)}
                                  className={`p-2 rounded text-sm ${
                                    schedule.days.includes(idx)
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-200'
                                  }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Time Slots */}
                          <div>
                            <label className="text-sm font-medium">Time Slots</label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                type="time"
                                onChange={e => {
                                  if (e.target.value) {
                                    addTimeSlot(venueId, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {schedule.times.map(time => (
                                <div key={time} className="bg-blue-100 px-3 py-1 rounded flex items-center gap-2">
                                  {time}
                                  <button
                                    onClick={() => removeTimeSlot(venueId, time)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Date Range */}
      {seasonId && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blackout Dates */}
      {seasonId && (
        <Card>
          <CardHeader>
            <CardTitle>Blackout Dates</CardTitle>
            <CardDescription>Dates when no games should be scheduled</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="date"
                value={newBlackoutDate}
                onChange={e => setNewBlackoutDate(e.target.value)}
              />
              <Button onClick={addBlackoutDate}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {blackoutDates.map(date => (
                <div key={date} className="bg-red-100 px-3 py-1 rounded flex items-center gap-2">
                  {date}
                  <button
                    onClick={() => removeBlackoutDate(date)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Games */}
      {seasonId && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Games</CardTitle>
            <CardDescription>Team White vs Team Black games</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Number of Evaluation Games</Label>
              <Input
                type="number"
                min="0"
                value={evaluationGameCount}
                onChange={e => {
                  const count = parseInt(e.target.value) || 0;
                  setEvaluationGameCount(count);
                  initializeEvaluationGames(count);
                }}
              />
            </div>

            {evaluationGames.map((game, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Evaluation Game {idx + 1}</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={game.date}
                      onChange={e => updateEvaluationGame(idx, 'date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={game.time}
                      onChange={e => updateEvaluationGame(idx, 'time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Venue</Label>
                    <Select
                      value={game.venueId?.toString() || ''}
                      onValueChange={v => updateEvaluationGame(idx, 'venueId', parseInt(v))}
                    >
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
      )}

      {/* Generate Button */}
      {seasonId && (
        <Button onClick={generateSchedule} className="w-full" size="lg">
          Generate Schedule
        </Button>
      )}

      {/* Scheduled Games Preview */}
      {scheduledGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Schedule Preview</CardTitle>
            <CardDescription>{scheduledGames.length} games</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scheduledGames.map((game, idx) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold">
                      {game.homeTeamId === 1 && game.awayTeamId === 2 && game.isEvaluationGame
                        ? 'Team White vs Team Black'
                        : `Team ${game.homeTeamId} vs Team ${game.awayTeamId}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {game.gameDate} @ {game.gameTime}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeGame(game.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={submitSchedule} className="w-full mt-4">
              Submit Schedule
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
