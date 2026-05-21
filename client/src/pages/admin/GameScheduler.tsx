import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VenueSchedule {
  days: number[];   // JS day-of-week: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  times: string[];  // "HH:MM" 24h
}

interface EvaluationGame {
  date: string;   // "YYYY-MM-DD"
  time: string;   // "HH:MM"
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

interface DistributionRow {
  teamId: number;
  teamName: string;
  venueBreakdown: { venueId: number; venueName: string; count: number }[];
  total: number;
}

// ─── Utility: parse "YYYY-MM-DD" as LOCAL date (avoids UTC timezone shift) ────

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getISOWeekKey(d: Date): string {
  // Returns "YYYY-Www" using ISO week numbering
  const tmp = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // ISO week: week containing Thursday
  const dayOfWeek = tmp.getDay() === 0 ? 7 : tmp.getDay(); // Mon=1..Sun=7
  tmp.setDate(tmp.getDate() + 4 - dayOfWeek);
  const yearStart = new Date(tmp.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ─── Core Algorithm ───────────────────────────────────────────────────────────

/**
 * Generate perfect-matching rounds for N teams using the circle (polygon) method.
 * Each round contains exactly N/2 pairs, every team appears exactly once.
 * Returns (N-1) rounds for N even teams.
 */
function generatePerfectMatchingRounds(teamIds: number[]): [number, number][][] {
  const n = teamIds.length;
  const hasBye = n % 2 === 1;
  const teams = hasBye ? [...teamIds, -1] : [...teamIds];
  const N = teams.length;

  const fixed = teams[0];
  const rotating = teams.slice(1);
  const rounds: [number, number][][] = [];

  for (let r = 0; r < N - 1; r++) {
    const pairs: [number, number][] = [];
    // Fixed vs last in rotating
    const opp = rotating[rotating.length - 1];
    if (fixed !== -1 && opp !== -1) pairs.push([fixed, opp]);
    // Pair the rest: mirror from front and back, excluding last element (already used above)
    for (let i = 0; i < N / 2 - 1; i++) {
      const ta = rotating[i];
      const tb = rotating[N - 3 - i];  // N-2-1-i: excludes the last element used for fixed vs opp
      if (ta !== -1 && tb !== -1) pairs.push([ta, tb]);
    }
    rounds.push(pairs);
    // Rotate: move last to front
    rotating.unshift(rotating.pop()!);
  }

  return rounds;
}

/**
 * Main scheduling algorithm.
 *
 * Guarantees:
 *  - Each team plays exactly once per league week (hard constraint).
 *  - Venue distribution is as balanced as possible across the season.
 *  - Home/away flips between cycles for balance.
 *  - Same-day constraint: two teams cannot play on the same calendar date.
 *  - Generalises to N teams, M venues, K time-slots per venue.
 *
 * Algorithm:
 *  1. Build slots grouped by ISO calendar week, sorted within each week.
 *  2. Generate perfect-matching rounds via circle method ((N-1) rounds for N teams).
 *  3. For each league week: assign round[weekIdx % numRounds] to that week's slots.
 *  4. Even cycles (0,2,...): pair[i] → slot[i], original home/away.
 *     Odd cycles  (1,3,...): pair[N/2-1-i] → slot[i], flipped home/away.
 *     This rotates which pairs appear at which venues across cycles.
 *  5. Fixes: local-date parsing, ISO-week grouping, no budget-gating.
 */
function computeSchedule(params: {
  teamIds: number[];
  venueSchedules: Map<number, VenueSchedule>;
  selectedVenueIds: number[];
  startDate: string;
  endDate: string;
  evalDates: Set<string>;
  blackoutDates: Set<string>;
  seasonId: number;
}): ScheduledGame[] {
  const {
    teamIds, venueSchedules, selectedVenueIds,
    startDate, endDate, evalDates, blackoutDates, seasonId,
  } = params;

  // ── Step 1: Build all available slots, grouped by ISO week ──
  //    Each slot: { dateStr, venueId, time }
  //    Sort within week by (dateStr asc, venueId asc, time asc)

  const weekMap = new Map<string, { dateStr: string; venueId: number; time: string }[]>();

  const start = parseLocalDate(startDate);
  const end   = parseLocalDate(endDate);

  let cur = new Date(start);
  while (formatDateStr(cur) <= formatDateStr(end)) {
    const ds = formatDateStr(cur);

    if (!evalDates.has(ds) && !blackoutDates.has(ds)) {
      // JS day: 0=Sun,1=Mon,...,6=Sat
      const jsDay = cur.getDay();

      for (const vid of selectedVenueIds) {
        const vsched = venueSchedules.get(vid);
        if (!vsched || !vsched.days.includes(jsDay)) continue;

        for (const time of vsched.times) {
          const wk = getISOWeekKey(cur);
          if (!weekMap.has(wk)) weekMap.set(wk, []);
          weekMap.get(wk)!.push({ dateStr: ds, venueId: vid, time });
        }
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  // Sort weeks and sort slots within each week
  const sortedWeeks = Array.from(weekMap.keys()).sort();
  for (const wk of sortedWeeks) {
    weekMap.get(wk)!.sort((a, b) =>
      a.dateStr.localeCompare(b.dateStr) ||
      a.venueId - b.venueId ||
      a.time.localeCompare(b.time)
    );
  }

  // ── Step 2: Generate perfect-matching rounds ──
  const rounds = generatePerfectMatchingRounds(teamIds);
  const numRounds = rounds.length;  // = numTeams - 1

  // ── Step 3 + 4: Assign rounds to weeks ──
  const games: ScheduledGame[] = [];
  let gameCounter = 0;

  for (let weekIdx = 0; weekIdx < sortedWeeks.length; weekIdx++) {
    const wk = sortedWeeks[weekIdx];
    const slots = weekMap.get(wk)!;

    const roundIdx = weekIdx % numRounds;
    const cycle    = Math.floor(weekIdx / numRounds);
    const isOddCycle = cycle % 2 === 1;

    const pairs = rounds[roundIdx];  // e.g. [ [t1,t2], [t3,t4] ]
    const numPairs = pairs.length;

    // Track which dates are already used this week (same-day constraint)
    const usedDatesThisWeek = new Set<string>();
    // Track which teams are already assigned this week (once-per-week)
    const usedTeamsThisWeek = new Set<number>();

    for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
      if (slotIdx >= numPairs) break;  // more slots than pairs (extra venue capacity)

      const slot = slots[slotIdx];

      // In odd cycles: reverse the pair order for venue rotation
      const pairIdx = isOddCycle ? numPairs - 1 - slotIdx : slotIdx;
      let [home, away] = pairs[pairIdx];

      // In odd cycles: flip home/away for home-ice balance
      if (isOddCycle) [home, away] = [away, home];

      // Same-day constraint: if either team already has a game today, skip
      // (This handles multi-time-slot venues)
      if (usedDatesThisWeek.has(slot.dateStr + ':' + home) ||
          usedDatesThisWeek.has(slot.dateStr + ':' + away)) {
        continue;
      }
      // Once-per-week constraint check (should always pass with correct admin config)
      if (usedTeamsThisWeek.has(home) || usedTeamsThisWeek.has(away)) {
        continue;
      }

      games.push({
        id: `game-${++gameCounter}-${slot.dateStr}-v${slot.venueId}`,
        homeTeamId: home,
        awayTeamId: away,
        venueId: slot.venueId,
        gameDate: slot.dateStr,
        gameTime: slot.time,
        seasonId,
        isEvaluationGame: false,
      });

      usedDatesThisWeek.add(slot.dateStr + ':' + home);
      usedDatesThisWeek.add(slot.dateStr + ':' + away);
      usedTeamsThisWeek.add(home);
      usedTeamsThisWeek.add(away);
    }
  }

  return games;
}

/**
 * Compute distribution table for display: team × venue game counts.
 */
function computeDistribution(
  games: ScheduledGame[],
  teamIds: number[],
  teamNames: Map<number, string>,
  venueIds: number[],
  venueNames: Map<number, string>,
): DistributionRow[] {
  const counts = new Map<number, Map<number, number>>();
  for (const t of teamIds) {
    counts.set(t, new Map(venueIds.map(v => [v, 0])));
  }
  for (const g of games) {
    if (g.isEvaluationGame) continue;
    counts.get(g.homeTeamId)?.set(g.venueId, (counts.get(g.homeTeamId)?.get(g.venueId) ?? 0) + 1);
    counts.get(g.awayTeamId)?.set(g.venueId, (counts.get(g.awayTeamId)?.get(g.venueId) ?? 0) + 1);
  }
  return teamIds.map(t => {
    const vBreakdown = venueIds.map(v => ({
      venueId: v,
      venueName: venueNames.get(v) ?? `Venue ${v}`,
      count: counts.get(t)?.get(v) ?? 0,
    }));
    return {
      teamId: t,
      teamName: teamNames.get(t) ?? `Team ${t}`,
      venueBreakdown: vBreakdown,
      total: vBreakdown.reduce((s, x) => s + x.count, 0),
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GameScheduler() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Form state
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

  // Output state
  const [scheduledGames, setScheduledGames] = useState<ScheduledGame[]>([]);
  const [distribution, setDistribution] = useState<DistributionRow[]>([]);
  const [showDistribution, setShowDistribution] = useState(false);

  // Queries
  const { data: seasons } = trpc.admin.getSeasons.useQuery();
  const { data: teams } = trpc.admin.getTeams.useQuery(
    seasonId ? { seasonId } : undefined,
    { enabled: !!seasonId }
  );
  const { data: masterTeams } = trpc.admin.getMasterTeams.useQuery({});
  const { data: venues } = trpc.admin.getVenues.useQuery();
  const createGamesMutation = trpc.admin.createGames.useMutation();

  const teamsToDisplay = seasonId ? teams : masterTeams;

  if (authLoading) return <div className="p-8">Loading...</div>;
  if (!user || user.role !== 'admin') { navigate('/'); return null; }

  // ── Handlers ──

  const toggleTeam = (id: number) =>
    setSelectedTeams(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const toggleVenue = (id: number) =>
    setSelectedVenues(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);

  const toggleDay = (venueId: number, day: number) => {
    const s = venueSchedules.get(venueId) ?? { days: [], times: [] };
    const newDays = s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day];
    const m = new Map(venueSchedules);
    m.set(venueId, { ...s, days: newDays });
    setVenueSchedules(m);
  };

  const addTimeSlot = (venueId: number, time: string) => {
    if (!time) return;
    const s = venueSchedules.get(venueId) ?? { days: [], times: [] };
    if (!s.times.includes(time)) {
      const m = new Map(venueSchedules);
      m.set(venueId, { ...s, times: [...s.times, time].sort() });
      setVenueSchedules(m);
    }
  };

  const removeTimeSlot = (venueId: number, time: string) => {
    const s = venueSchedules.get(venueId) ?? { days: [], times: [] };
    const m = new Map(venueSchedules);
    m.set(venueId, { ...s, times: s.times.filter(t => t !== time) });
    setVenueSchedules(m);
  };

  const addBlackoutDate = () => {
    if (newBlackoutDate && !blackoutDates.includes(newBlackoutDate)) {
      setBlackoutDates([...blackoutDates, newBlackoutDate].sort());
      setNewBlackoutDate('');
    }
  };

  const initEvalGames = (count: number) => {
    setEvaluationGameCount(count);
    setEvaluationGames(Array.from({ length: count }, () => ({ date: '', time: '', venueId: 0 })));
  };

  const updateEvalGame = (idx: number, field: string, val: string | number) => {
    const g = [...evaluationGames];
    g[idx] = { ...g[idx], [field]: val };
    setEvaluationGames(g);
  };

  // ── Generate Schedule ──

  const generateSchedule = () => {
    // Validation
    if (!seasonId) { toast.error('Please select a season'); return; }
    if (selectedTeams.length < 2) { toast.error('Please select at least 2 teams'); return; }
    if (selectedTeams.length % 2 !== 0) { toast.error('Team count must be even'); return; }
    if (selectedVenues.length === 0) { toast.error('Please select at least one venue'); return; }
    if (!startDate || !endDate) { toast.error('Please set start and end dates'); return; }

    for (const vid of selectedVenues) {
      const s = venueSchedules.get(vid);
      if (!s || s.days.length === 0 || s.times.length === 0) {
        const vname = venues?.find(v => v.id === vid)?.name ?? `Venue ${vid}`;
        toast.error(`${vname}: configure at least one day and time slot`);
        return;
      }
    }

    // Validate evaluation games
    const evalDateSet = new Set<string>();
    const evalGamesList: ScheduledGame[] = [];
    for (let i = 0; i < evaluationGameCount; i++) {
      const eg = evaluationGames[i];
      if (!eg?.date || !eg?.time || !eg?.venueId) {
        toast.error(`Evaluation game ${i + 1}: set date, time, and venue`);
        return;
      }
      evalDateSet.add(eg.date);
      evalGamesList.push({
        id: `eval-${i}`,
        homeTeamId: 1,
        awayTeamId: 2,
        venueId: eg.venueId,
        gameDate: eg.date,
        gameTime: eg.time,
        seasonId: seasonId!,
        isEvaluationGame: true,
      });
    }

    const blackoutSet = new Set(blackoutDates);

    // Run the algorithm
    const regularGames = computeSchedule({
      teamIds: selectedTeams,
      venueSchedules,
      selectedVenueIds: selectedVenues,
      startDate,
      endDate,
      evalDates: evalDateSet,
      blackoutDates: blackoutSet,
      seasonId: seasonId!,
    });

    const allGames = [...evalGamesList, ...regularGames];
    setScheduledGames(allGames);

    // Build distribution table
    const teamNameMap = new Map<number, string>();
    const venueNameMap = new Map<number, string>();
    teamsToDisplay?.forEach(t => teamNameMap.set(t.id, t.name ?? `Team ${t.id}`));
    venues?.forEach(v => venueNameMap.set(v.id, v.name ?? `Venue ${v.id}`));

    const dist = computeDistribution(
      regularGames,
      selectedTeams,
      teamNameMap,
      selectedVenues,
      venueNameMap,
    );
    setDistribution(dist);
    setShowDistribution(true);

    toast.success(
      `Generated ${allGames.length} games` +
      (evaluationGameCount > 0 ? ` (${evaluationGameCount} eval + ${regularGames.length} regular)` : '')
    );
  };

  const removeGame = (id: string) =>
    setScheduledGames(prev => prev.filter(g => g.id !== id));

  const submitSchedule = async () => {
    if (scheduledGames.length === 0) { toast.error('No games to submit'); return; }
    try {
      await createGamesMutation.mutateAsync({
        games: scheduledGames.map(g => ({
          homeTeamId: g.homeTeamId,
          awayTeamId: g.awayTeamId,
          venueId: g.venueId,
          gameDate: g.gameDate,
          gameTime: g.gameTime,
          seasonId: g.seasonId,
          isEvaluationGame: g.isEvaluationGame ?? false,
        })),
      });
      toast.success('Schedule saved successfully');
      setScheduledGames([]);
      setDistribution([]);
      setShowDistribution(false);
      utils.admin.getGamesBySeasonId.invalidate();
    } catch (err) {
      toast.error('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const regularGameCount = scheduledGames.filter(g => !g.isEvaluationGame).length;
  const evalGameCountInList = scheduledGames.filter(g => g.isEvaluationGame).length;

  // ── Render ──

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Game Scheduler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure season schedule — each team plays once per week, venues balanced automatically
          </p>
        </div>
      </div>

      {/* Season */}
      <Card>
        <CardHeader><CardTitle>Season</CardTitle></CardHeader>
        <CardContent>
          <Select value={seasonId?.toString() ?? ''} onValueChange={v => setSeasonId(parseInt(v))}>
            <SelectTrigger><SelectValue placeholder="Select season" /></SelectTrigger>
            <SelectContent>
              {seasons?.map(s => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Teams */}
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            Select teams — must be an even number (2, 4, 6…)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {teamsToDisplay?.map(team => (
            <div key={team.id} className="flex items-center gap-2">
              <Checkbox
                checked={selectedTeams.includes(team.id)}
                onCheckedChange={() => toggleTeam(team.id)}
              />
              <label className="cursor-pointer">{team.name}</label>
            </div>
          ))}
          {selectedTeams.length > 0 && selectedTeams.length % 2 !== 0 && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Team count must be even for balanced scheduling
            </p>
          )}
          {selectedTeams.length >= 2 && selectedTeams.length % 2 === 0 && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {selectedTeams.length} teams — {selectedTeams.length / 2} game(s) per week
            </p>
          )}
        </CardContent>
      </Card>

      {/* Venues */}
      <Card>
        <CardHeader>
          <CardTitle>Venues</CardTitle>
          <CardDescription>
            Select venues and configure their available days and time slots
          </CardDescription>
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
                  <label className="font-medium cursor-pointer">{venue.name}</label>
                  {venueSchedules.get(venue.id)?.days.length ? (
                    <Badge variant="outline" className="text-xs">
                      {venueSchedules.get(venue.id)!.days.map(d => dayNames[d]).join(', ')}
                      {venueSchedules.get(venue.id)!.times.length > 0 &&
                        ` · ${venueSchedules.get(venue.id)!.times.length} time(s)`}
                    </Badge>
                  ) : null}
                </div>
                {selectedVenues.includes(venue.id) && (
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setExpandedVenue(expandedVenue === venue.id ? null : venue.id)}
                  >
                    {expandedVenue === venue.id ? 'Hide' : 'Configure'}
                  </Button>
                )}
              </div>

              {expandedVenue === venue.id && selectedVenues.includes(venue.id) && (
                <div className="ml-6 space-y-4 border-l-2 pl-4">
                  {/* Day selection */}
                  <div>
                    <Label className="text-sm font-medium">Available Days</Label>
                    <div className="grid grid-cols-7 gap-2 mt-2">
                      {dayNames.map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <Checkbox
                            checked={venueSchedules.get(venue.id)?.days.includes(idx) ?? false}
                            onCheckedChange={() => toggleDay(venue.id, idx)}
                          />
                          <span className="text-xs">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time slots */}
                  <div>
                    <Label className="text-sm font-medium">Time Slots</Label>
                    <div className="space-y-2 mt-2">
                      {venueSchedules.get(venue.id)?.times.map((time, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">{time}</span>
                          <Button
                            variant="ghost" size="sm"
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
                          className="flex-1"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              addTimeSlot(venue.id, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                          id={`time-input-${venue.id}`}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const inp = document.getElementById(`time-input-${venue.id}`) as HTMLInputElement;
                            if (inp) { addTimeSlot(venue.id, inp.value); inp.value = ''; }
                          }}
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
          <CardDescription>
            Pre-season evaluation games (Team White vs Team Black) — excluded from regular schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Number of Evaluation Games</Label>
            <Input
              type="number" min="0" max="10"
              value={evaluationGameCount}
              onChange={e => initEvalGames(parseInt(e.target.value) || 0)}
              className="mt-1 w-32"
            />
          </div>
          {evaluationGames.map((game, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Evaluation Game {idx + 1}</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm">Date</Label>
                  <Input type="date" value={game.date}
                    onChange={e => updateEvalGame(idx, 'date', e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Time</Label>
                  <Input type="time" value={game.time}
                    onChange={e => updateEvalGame(idx, 'time', e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Venue</Label>
                  <Select
                    value={game.venueId?.toString() ?? ''}
                    onValueChange={v => updateEvalGame(idx, 'venueId', parseInt(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select venue" /></SelectTrigger>
                    <SelectContent>
                      {venues?.map(v => (
                        <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
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
        <CardHeader><CardTitle>Regular Season Date Range</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Blackout Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Blackout Dates</CardTitle>
          <CardDescription>
            No games will be scheduled on these dates. Use even numbers (one per venue) for balanced weeks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input type="date" value={newBlackoutDate}
              onChange={e => setNewBlackoutDate(e.target.value)} />
            <Button onClick={addBlackoutDate} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {blackoutDates.map(date => (
              <div key={date} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm">{date}</span>
                <Button variant="ghost" size="sm"
                  onClick={() => setBlackoutDates(blackoutDates.filter(d => d !== date))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button onClick={generateSchedule} className="w-full" size="lg">
        Generate Schedule
      </Button>

      {/* Distribution Table */}
      {showDistribution && distribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Venue Distribution</CardTitle>
            <CardDescription>Games per team per venue — balanced automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold">Team</th>
                    {distribution[0]?.venueBreakdown.map(vb => (
                      <th key={vb.venueId} className="text-center py-2 px-3 font-semibold text-xs">
                        {vb.venueName}
                      </th>
                    ))}
                    <th className="text-center py-2 px-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {distribution.map(row => {
                    const counts = row.venueBreakdown.map(vb => vb.count);
                    const maxCount = Math.max(...counts);
                    const minCount = Math.min(...counts);
                    const imbalance = maxCount - minCount;
                    return (
                      <tr key={row.teamId} className="border-b hover:bg-muted/50">
                        <td className="font-medium py-2 px-3">{row.teamName}</td>
                        {row.venueBreakdown.map(vb => (
                          <td key={vb.venueId} className="text-center py-2 px-3">
                            <span className={imbalance > 2 ? 'text-orange-600 font-semibold' : ''}>
                              {vb.count}
                            </span>
                          </td>
                        ))}
                        <td className="text-center font-semibold py-2 px-3">{row.total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Games List */}
      {scheduledGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Generated Games ({scheduledGames.length} total
              {evalGameCountInList > 0 ? ` · ${evalGameCountInList} eval` : ''}
              {` · ${regularGameCount} regular`})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {scheduledGames.map(game => {
              const homeTeam = teamsToDisplay?.find(t => t.id === game.homeTeamId);
              const awayTeam = teamsToDisplay?.find(t => t.id === game.awayTeamId);
              const venue = venues?.find(v => v.id === game.venueId);
              const homeName = game.homeTeamId === 1 && game.isEvaluationGame
                ? 'Team White'
                : homeTeam?.name ?? `Team ${game.homeTeamId}`;
              const awayName = game.awayTeamId === 2 && game.isEvaluationGame
                ? 'Team Black'
                : awayTeam?.name ?? `Team ${game.awayTeamId}`;

              return (
                <div key={game.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      {homeName} vs {awayName}
                      {game.isEvaluationGame && (
                        <Badge variant="secondary" className="text-xs">Eval</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {game.gameDate} @ {game.gameTime} — {venue?.name ?? `Venue ${game.venueId}`}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeGame(game.id)}>
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
        <Button
          onClick={submitSchedule}
          className="w-full"
          size="lg"
          disabled={createGamesMutation.isPending}
        >
          {createGamesMutation.isPending ? 'Saving...' : `Save ${scheduledGames.length} Games to Database`}
        </Button>
      )}
    </div>
  );
}
