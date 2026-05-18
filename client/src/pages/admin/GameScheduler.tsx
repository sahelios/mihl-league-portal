import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, ArrowLeft, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface ScheduledGame {
  id: string;
  homeTeamId: number;
  awayTeamId: number;
  venueId: number;
  gameDate: string;
  gameTime: string;
  seasonId: number;
  isEvaluation?: boolean;
}

interface VenueSchedule {
  venueId: number;
  days: string[];
  timeSlots: string[];
}

interface EvaluationGame {
  id: string;
  date: string;
  time: string;
  venueId: number;
}

export default function GameScheduler() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");

  // Form State
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<number[]>([]);
  const [venueSchedules, setVenueSchedules] = useState<Map<number, VenueSchedule>>(new Map());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [newBlackoutDate, setNewBlackoutDate] = useState("");
  const [evaluationGameCount, setEvaluationGameCount] = useState(0);
  const [evaluationGames, setEvaluationGames] = useState<EvaluationGame[]>([]);
  const [scheduledGames, setScheduledGames] = useState<ScheduledGame[]>([]);
  const [currentEditingVenue, setCurrentEditingVenue] = useState<number | null>(null);
  const [newTimeSlot, setNewTimeSlot] = useState("");

  // tRPC Queries
  const { data: seasons, isLoading: loadingSeasons } = trpc.admin.getSeasons.useQuery();
  const { data: teams, isLoading: loadingTeams } = trpc.league.getTeams.useQuery();
  const { data: venues, isLoading: loadingVenues } = trpc.admin.getVenues.useQuery();
  const createGamesMutation = trpc.admin.createGames.useMutation();

  // Admin Access Check
  if (!loading && user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {language === "en" ? "Access Denied" : "Accès Refusé"}
        </h1>
        <p className="text-muted-foreground mb-6 text-center">
          {language === "en" 
            ? "You do not have permission to view this page." 
            : "Vous n'avez pas la permission de consulter cette page."}
        </p>
        <Button onClick={() => navigate("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "en" ? "Return to Admin" : "Retour à l'administration"}
        </Button>
      </div>
    );
  }

  const days = [
    { value: "monday", label: language === "en" ? "Monday" : "Lundi" },
    { value: "tuesday", label: language === "en" ? "Tuesday" : "Mardi" },
    { value: "wednesday", label: language === "en" ? "Wednesday" : "Mercredi" },
    { value: "thursday", label: language === "en" ? "Thursday" : "Jeudi" },
    { value: "friday", label: language === "en" ? "Friday" : "Vendredi" },
    { value: "saturday", label: language === "en" ? "Saturday" : "Samedi" },
    { value: "sunday", label: language === "en" ? "Sunday" : "Dimanche" },
  ];

  const toggleTeam = (teamId: number) => {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(t => t !== teamId) : [...prev, teamId]
    );
  };

  const toggleVenue = (venueId: number) => {
    setSelectedVenues(prev => {
      const newVenues = prev.includes(venueId) ? prev.filter(v => v !== venueId) : [...prev, venueId];
      
      // Initialize venue schedule if adding
      if (!prev.includes(venueId)) {
        const newSchedules = new Map(venueSchedules);
        newSchedules.set(venueId, { venueId, days: [], timeSlots: [] });
        setVenueSchedules(newSchedules);
      }
      
      return newVenues;
    });
  };

  const toggleDay = (venueId: number, day: string) => {
    const newSchedules = new Map(venueSchedules);
    const schedule = newSchedules.get(venueId) || { venueId, days: [], timeSlots: [] };
    
    const updatedSchedule = {
      ...schedule,
      days: schedule.days.includes(day)
        ? schedule.days.filter(d => d !== day)
        : [...schedule.days, day]
    };
    
    newSchedules.set(venueId, updatedSchedule);
    setVenueSchedules(newSchedules);
  };

  const addTimeSlot = (venueId: number) => {
    if (!newTimeSlot) {
      toast.error(language === "en" ? "Enter a time" : "Entrez une heure");
      return;
    }
    
    const newSchedules = new Map(venueSchedules);
    const schedule = newSchedules.get(venueId) || { venueId, days: [], timeSlots: [] };
    
    if (schedule.timeSlots.includes(newTimeSlot)) {
      toast.error(language === "en" ? "Time slot already exists" : "Créneau horaire déjà existant");
      return;
    }
    
    const updatedSchedule = {
      ...schedule,
      timeSlots: [...schedule.timeSlots, newTimeSlot]
    };
    newSchedules.set(venueId, updatedSchedule);
    setVenueSchedules(newSchedules);
    setNewTimeSlot("");
  };

  const removeTimeSlot = (venueId: number, time: string) => {
    const newSchedules = new Map(venueSchedules);
    const schedule = newSchedules.get(venueId);
    
    if (schedule) {
      const updatedSchedule = {
        ...schedule,
        timeSlots: schedule.timeSlots.filter(t => t !== time)
      };
      newSchedules.set(venueId, updatedSchedule);
      setVenueSchedules(newSchedules);
    }
  };

  const addBlackoutDate = () => {
    if (!newBlackoutDate) {
      toast.error(language === "en" ? "Select a date" : "Sélectionnez une date");
      return;
    }
    if (blackoutDates.includes(newBlackoutDate)) {
      toast.error(language === "en" ? "Date already blackedout" : "Date déjà exclue");
      return;
    }
    setBlackoutDates([...blackoutDates, newBlackoutDate]);
    setNewBlackoutDate("");
  };

  const removeBlackoutDate = (date: string) => {
    setBlackoutDates(blackoutDates.filter(d => d !== date));
  };

  const updateEvaluationGame = (index: number, field: string, value: any) => {
    const newEvalGames = [...evaluationGames];
    if (newEvalGames[index]) {
      newEvalGames[index] = { ...newEvalGames[index], [field]: value };
      setEvaluationGames(newEvalGames);
    }
  };

  const initializeEvaluationGames = (count: number) => {
    const games: EvaluationGame[] = [];
    for (let i = 0; i < count; i++) {
      games.push({
        id: `eval-${i}`,
        date: '',
        time: '18:00',
        venueId: selectedVenues[0] || 0
      });
    }
    setEvaluationGames(games);
  };

  const generateSchedule = () => {
    // Validation
    if (!selectedSeason) {
      toast.error(language === "en" ? "Select a season" : "Sélectionnez une saison");
      return;
    }
    if (selectedTeams.length < 2) {
      toast.error(language === "en" ? "Select at least 2 teams" : "Sélectionnez au moins 2 équipes");
      return;
    }
    if (selectedVenues.length === 0) {
      toast.error(language === "en" ? "Select at least one venue" : "Sélectionnez au moins un lieu");
      return;
    }
    
    // Validate each venue has days and times configured
    for (const venueId of selectedVenues) {
      const schedule = venueSchedules.get(venueId);
      if (!schedule || schedule.days.length === 0 || schedule.timeSlots.length === 0) {
        const venueName = venues?.find(v => v.id === venueId)?.name || `Venue ${venueId}`;
        toast.error(language === "en" 
          ? `${venueName}: Configure at least one day and time slot` 
          : `${venueName}: Configurez au moins un jour et un créneau horaire`);
        return;
      }
    }
    
    if (!startDate || !endDate) {
      toast.error(language === "en" ? "Select start and end dates" : "Sélectionnez les dates de début et de fin");
      return;
    }
    // Validate evaluation games
    if (evaluationGameCount > 0) {
      for (let i = 0; i < evaluationGames.length; i++) {
        if (!evaluationGames[i].date) {
          toast.error(language === "en" ? `Set date for evaluation game ${i + 1}` : `Définissez la date pour le match d'évaluation ${i + 1}`);
          return;
        }
      }
    }

    const games: ScheduledGame[] = [];
    const seasonId = parseInt(selectedSeason);

    // Step 1: Create evaluation games first (with white/black teams only)
    const evaluationDates = new Set<string>();
    if (evaluationGameCount > 0) {
      for (let i = 0; i < evaluationGames.length; i++) {
        const evalGame = evaluationGames[i];
        evaluationDates.add(evalGame.date);
        games.push({
          id: `eval-${evalGame.date}-${i}`,
          homeTeamId: 1,
          awayTeamId: 2,
          venueId: evalGame.venueId,
          gameDate: evalGame.date,
          gameTime: evalGame.time,
          seasonId,
          isEvaluation: true,
        });
      }
    }

    // Step 2: Create regular season games with round-robin scheduling
    // Parse dates correctly without timezone issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    
    // Generate all possible matchups (round-robin) - each team plays every other team
    const matchups: Array<{home: number, away: number}> = [];
    for (let i = 0; i < selectedTeams.length; i++) {
      for (let j = 0; j < selectedTeams.length; j++) {
        if (i !== j) {
          matchups.push({home: selectedTeams[i], away: selectedTeams[j]});
        }
      }
    }
    
    // Shuffle matchups for randomization
    for (let i = matchups.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matchups[i], matchups[j]] = [matchups[j], matchups[i]];
    }
    
    let matchupIndex = 0;
    
    // Collect all available game slots
    const gameSlots: Array<{date: string, time: string, venueId: number}> = [];
    
    console.log('DEBUG: Starting game generation');
    console.log('DEBUG: Start date:', start, 'End date:', end);
    console.log('DEBUG: Selected teams:', selectedTeams);
    console.log('DEBUG: Total matchups:', matchups.length);
    console.log('DEBUG: Evaluation dates:', Array.from(evaluationDates));
    console.log('DEBUG: Blackout dates:', blackoutDates);
    
    // Create a proper date range loop that includes the end date
    const currentDate = new Date(start);
    let loopCount = 0;
    console.log('DEBUG: End date object:', end);
    console.log('DEBUG: End date string:', `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`);
    
    while (currentDate <= end) {
      loopCount++;
      // Format date as YYYY-MM-DD without timezone conversion
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      if (loopCount <= 10 || loopCount % 10 === 0) {
        console.log(`DEBUG: Loop ${loopCount} - Current: ${dateString}, End: ${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}, Compare: ${currentDate <= end}`);
      }
      
      // Skip blackout dates and evaluation game dates
      if (blackoutDates.includes(dateString) || evaluationDates.has(dateString)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][currentDate.getDay()];
      
      // Check each venue's schedule for this day
      for (const venueId of selectedVenues) {
        const schedule = venueSchedules.get(venueId);
        if (!schedule) {
          continue;
        }
        
        if (dateString.includes('08-')) {
          console.log(`DEBUG: ${dateString} (${dayName}) - venue ${venueId} has days: [${schedule.days.join(', ')}], match: ${schedule.days.includes(dayName)}`);
        }
        
        if (!schedule.days.includes(dayName)) {
          continue;
        }

        // Add one game slot per time slot
        for (const timeSlot of schedule.timeSlots) {
          gameSlots.push({date: dateString, time: timeSlot, venueId});
          if (dateString.includes('08-')) {
            console.log(`DEBUG: ADDED slot for ${dateString} at ${timeSlot} for venue ${venueId}`);
          }
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log(`DEBUG: Loop completed after ${loopCount} iterations`);
    
    console.log('DEBUG: Total game slots available:', gameSlots.length);
    console.log('DEBUG: Game slots:', gameSlots);
    
    // Assign matchups to available slots with smart venue distribution
    let seasonGamesCreated = 0;
    console.log(`DEBUG: About to assign games. Available slots: ${gameSlots.length}, Available matchups: ${matchups.length - matchupIndex}`);
    
    // Track venue distribution per team
    const teamVenueCount: Map<number, Map<number, number>> = new Map();
    selectedTeams.forEach(teamId => {
      teamVenueCount.set(teamId, new Map());
      selectedVenues.forEach(venueId => {
        teamVenueCount.get(teamId)!.set(venueId, 0);
      });
    });
    
    // Track weekly games per team to ensure one game per league week
    // League weeks are Tue+Thu pairs, not calendar weeks
    const teamLeagueWeekGames: Map<number, Map<number, number>> = new Map();
    
    // Build a map of all game dates to their league week number
    // A league week consists of different days (e.g., Tue+Thu, Mon+Wed, etc.)
    // When we see a repeat of a day, we move to the next league week
    const dateToLeagueWeek: Map<string, number> = new Map();
    const sortedDates = gameSlots.map(s => s.date).filter((v, i, a) => a.indexOf(v) === i).sort();
    
    let currentLeagueWeek = 0;
    const daysInCurrentWeek = new Set<number>(); // Track which days we've seen in current week
    
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      
      // If we've already seen this day of week in the current league week, move to next week
      if (daysInCurrentWeek.has(dayOfWeek)) {
        currentLeagueWeek++;
        daysInCurrentWeek.clear();
      }
      
      daysInCurrentWeek.add(dayOfWeek);
      dateToLeagueWeek.set(dateStr, currentLeagueWeek);
    }
    
    selectedTeams.forEach(teamId => {
      teamLeagueWeekGames.set(teamId, new Map());
    });
    
    for (const slot of gameSlots) {
      // Cycle through matchups - if we've used all, start over
      if (matchupIndex >= matchups.length) {
        matchupIndex = 0; // Reset to start cycling through matchups again
      }
      
      const matchup = matchups[matchupIndex];
      const leagueWeekNumber = dateToLeagueWeek.get(slot.date) || 0;
      
      // Check if both teams already have a game this league week
      const homeLeagueWeekGames = teamLeagueWeekGames.get(matchup.home)!;
      const awayLeagueWeekGames = teamLeagueWeekGames.get(matchup.away)!;
      
      const homeGamesThisWeek = homeLeagueWeekGames.get(leagueWeekNumber) || 0;
      const awayGamesThisWeek = awayLeagueWeekGames.get(leagueWeekNumber) || 0;
      
      // Skip this matchup if either team already has a game this league week
      if (homeGamesThisWeek > 0 || awayGamesThisWeek > 0) {
        // Try next matchup
        matchupIndex++;
        if (matchupIndex >= matchups.length) {
          matchupIndex = 0;
        }
        continue; // Skip to next slot
      }
      
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
      homeLeagueWeekGames.set(leagueWeekNumber, (homeLeagueWeekGames.get(leagueWeekNumber) || 0) + 1);
      awayLeagueWeekGames.set(leagueWeekNumber, (awayLeagueWeekGames.get(leagueWeekNumber) || 0) + 1);
      
      matchupIndex++;
      seasonGamesCreated++;
    }
    console.log(`DEBUG: Created ${seasonGamesCreated} season games with balanced venue distribution`);

    setScheduledGames(games);
    toast.success(language === "en" 
      ? `Generated ${games.length} games (${evaluationGameCount > 0 ? `${evaluationGameCount * (selectedTeams.length - 1)} evaluation + ` : ''}${games.length - (evaluationGameCount > 0 ? evaluationGameCount * (selectedTeams.length - 1) : 0)} regular)` 
      : `${games.length} matchs générés`);
  };

  const removeGame = (id: string) => {
    setScheduledGames(prev => prev.filter(g => g.id !== id));
  };

  const submitSchedule = async () => {
    if (scheduledGames.length === 0) {
      toast.error(language === "en" ? "No games to submit" : "Aucun match à soumettre");
      return;
    }

    try {
      await createGamesMutation.mutateAsync({ games: scheduledGames });
      toast.success(language === "en" 
        ? "Schedule created successfully!" 
        : "Calendrier créé avec succès!");
      setScheduledGames([]);
      setSelectedTeams([]);
      setSelectedVenues([]);
      setVenueSchedules(new Map());
      setEvaluationGameCount(0);
      setEvaluationGames([]);
    } catch (error: any) {
      toast.error(error.message || (language === "en" ? "Failed to create schedule" : "Échec de la création du calendrier"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  const getVenueName = (venueId: number) => venues?.find(v => v.id === venueId)?.name || `Venue ${venueId}`;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {language === "en" ? "Game Scheduler" : "Planificateur de Matchs"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === "en" 
                ? "Create schedules with venue-specific days and time slots" 
                : "Créez des calendriers avec jours et créneaux spécifiques à chaque lieu"}
            </p>
          </div>
          <button
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
          >
            {language === "en" ? "FR" : "EN"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Season Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "en" ? "Season" : "Saison"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "en" ? "Select season" : "Sélectionnez une saison"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingSeasons ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                    ) : (
                      seasons?.map((season: any) => (
                        <SelectItem key={season.id} value={season.id.toString()}>
                          {season.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Teams Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "en" ? "Teams" : "Équipes"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {loadingTeams ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    teams?.map(team => (
                      <div key={team.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedTeams.includes(team.id)}
                          onCheckedChange={() => toggleTeam(team.id)}
                        />
                        <Label className="font-normal cursor-pointer">{team.name}</Label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedTeams.length} {language === "en" ? "selected" : "sélectionnés"}
                </p>
              </CardContent>
            </Card>

            {/* Date Range Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "en" ? "Date Range" : "Plage de Dates"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === "en" ? "Start Date" : "Date de début"}</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{language === "en" ? "End Date" : "Date de fin"}</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Evaluation Games Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "en" ? "Evaluation Games" : "Matchs d'Évaluation"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === "en" ? "Number of Evaluation Games" : "Nombre de matchs d'évaluation"}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={evaluationGameCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      setEvaluationGameCount(count);
                      initializeEvaluationGames(count);
                    }}
                  />
                </div>
                {evaluationGameCount > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-sm">{language === "en" ? "Configure Each Evaluation Game" : "Configurez Chaque Match d'Évaluation"}</h3>
                    {evaluationGames.map((game, index) => (
                      <div key={game.id} className="p-3 bg-muted rounded space-y-3">
                        <div className="font-medium text-sm">{language === "en" ? `Evaluation Game ${index + 1}` : `Match d'Évaluation ${index + 1}`}</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">{language === "en" ? "Date" : "Date"}</Label>
                            <Input
                              type="date"
                              value={game.date}
                              onChange={(e) => updateEvaluationGame(index, 'date', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{language === "en" ? "Time" : "Heure"}</Label>
                            <Input
                              type="time"
                              value={game.time}
                              onChange={(e) => updateEvaluationGame(index, 'time', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{language === "en" ? "Venue" : "Lieu"}</Label>
                            <Select value={game.venueId.toString()} onValueChange={(value) => updateEvaluationGame(index, 'venueId', parseInt(value))}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {venues?.map((venue: any) => (
                                  <SelectItem key={venue.id} value={venue.id.toString()}>
                                    {venue.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Venue Configuration Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Venues Selection Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "en" ? "Venues" : "Lieux"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {loadingVenues ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    venues?.map((venue: any) => (
                      <div key={venue.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedVenues.includes(venue.id)}
                          onCheckedChange={() => toggleVenue(venue.id)}
                        />
                        <Label className="font-normal cursor-pointer">{venue.name}</Label>
                        {selectedVenues.includes(venue.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentEditingVenue(currentEditingVenue === venue.id ? null : venue.id)}
                          >
                            {currentEditingVenue === venue.id ? "Hide" : "Configure"}
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Venue-Specific Configuration */}
            {currentEditingVenue && selectedVenues.includes(currentEditingVenue) && (
              <Card className="border-accent">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === "en" ? "Configure" : "Configurer"} {getVenueName(currentEditingVenue)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Days Selection */}
                  <div>
                    <h3 className="font-semibold mb-3">{language === "en" ? "Available Days" : "Jours Disponibles"}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {days.map(day => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            checked={venueSchedules.get(currentEditingVenue)?.days.includes(day.value) || false}
                            onCheckedChange={() => toggleDay(currentEditingVenue, day.value)}
                          />
                          <Label className="font-normal cursor-pointer">{day.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <h3 className="font-semibold mb-3">{language === "en" ? "Ice Time Slots" : "Créneaux Horaires"}</h3>
                    <div className="space-y-2 mb-4">
                      {venueSchedules.get(currentEditingVenue)?.timeSlots.map(time => (
                        <div key={time} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="font-mono">{time}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTimeSlot(currentEditingVenue, time)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={newTimeSlot}
                        onChange={(e) => setNewTimeSlot(e.target.value)}
                        placeholder="HH:MM"
                      />
                      <Button onClick={() => addTimeSlot(currentEditingVenue)} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blackout Dates Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "en" ? "Blackout Dates" : "Dates Exclues"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {blackoutDates.map(date => (
                    <div key={date} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="font-mono">{date}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBlackoutDate(date)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={newBlackoutDate}
                    onChange={(e) => setNewBlackoutDate(e.target.value)}
                  />
                  <Button onClick={addBlackoutDate} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button onClick={generateSchedule} className="w-full" size="lg">
              {language === "en" ? "Generate Schedule" : "Générer le Calendrier"}
            </Button>
          </div>
        </div>

        {/* Scheduled Games Preview */}
        {scheduledGames.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>
                {language === "en" 
                  ? `Preview: ${scheduledGames.length} Games` 
                  : `Aperçu: ${scheduledGames.length} Matchs`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {scheduledGames.map(game => (
                  <div key={game.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {game.isEvaluation && <Badge variant="secondary">{language === "en" ? "Eval" : "Éval"}</Badge>}
                        <span className="font-mono text-sm">
                          {game.gameDate} @ {game.gameTime}
                        </span>
                        <Badge variant="outline">{getVenueName(game.venueId)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {game.isEvaluation ? (
                          <>
                            <span className="cursor-pointer hover:underline">{game.homeTeamId === 1 ? 'Team White' : 'Team Black'}</span>
                            {' vs '}
                            <span className="cursor-pointer hover:underline">{game.awayTeamId === 2 ? 'Team Black' : 'Team White'}</span>
                          </>
                        ) : (
                          <>
                            <span>{teams?.find(t => t.id === game.homeTeamId)?.name || `Team ${game.homeTeamId}`}</span>
                            {' vs '}
                            <span>{teams?.find(t => t.id === game.awayTeamId)?.name || `Team ${game.awayTeamId}`}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeGame(game.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button onClick={submitSchedule} className="w-full mt-4" size="lg">
                {language === "en" ? "Submit Schedule" : "Soumettre le Calendrier"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
