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

interface IceTimeSlot {
  id: string;
  time: string;
}

export default function GameScheduler() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");

  // Form State
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [iceTimeSlots, setIceTimeSlots] = useState<IceTimeSlot[]>([
    { id: "1", time: "19:00" },
    { id: "2", time: "20:30" },
    { id: "3", time: "22:00" }
  ]);
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [newBlackoutDate, setNewBlackoutDate] = useState("");
  const [evaluationGameCount, setEvaluationGameCount] = useState(0);
  const [evaluationDate, setEvaluationDate] = useState("");
  const [evaluationTime, setEvaluationTime] = useState("18:00");
  const [scheduledGames, setScheduledGames] = useState<ScheduledGame[]>([]);

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

  const toggleDay = (day: string) => {
    setRecurringDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

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

  const addTimeSlot = () => {
    if (!newTimeSlot) {
      toast.error(language === "en" ? "Enter a time" : "Entrez une heure");
      return;
    }
    if (iceTimeSlots.some(slot => slot.time === newTimeSlot)) {
      toast.error(language === "en" ? "Time slot already exists" : "Créneau horaire déjà existant");
      return;
    }
    setIceTimeSlots([...iceTimeSlots, { id: Date.now().toString(), time: newTimeSlot }]);
    setNewTimeSlot("");
  };

  const removeTimeSlot = (id: string) => {
    setIceTimeSlots(iceTimeSlots.filter(slot => slot.id !== id));
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
    if (!startDate || !endDate) {
      toast.error(language === "en" ? "Select start and end dates" : "Sélectionnez les dates de début et de fin");
      return;
    }
    if (recurringDays.length === 0) {
      toast.error(language === "en" ? "Select at least one day" : "Sélectionnez au moins un jour");
      return;
    }
    if (iceTimeSlots.length === 0) {
      toast.error(language === "en" ? "Add at least one ice time slot" : "Ajoutez au moins un créneau horaire");
      return;
    }
    if (evaluationGameCount > 0 && !evaluationDate) {
      toast.error(language === "en" ? "Set evaluation game date" : "Définissez la date des matchs d'évaluation");
      return;
    }

    const games: ScheduledGame[] = [];
    const seasonId = parseInt(selectedSeason);

    // Step 1: Create evaluation games first
    if (evaluationGameCount > 0 && evaluationDate) {
      const evalVenueId = selectedVenues[0]; // Use first venue for evaluation games
      for (let i = 0; i < evaluationGameCount; i++) {
        const slotIndex = i % iceTimeSlots.length;
        const slot = iceTimeSlots[slotIndex];
        
        // Create matchups for evaluation games
        for (let j = 0; j < selectedTeams.length - 1; j++) {
          games.push({
            id: `eval-${evaluationDate}-${slotIndex}-${j}`,
            homeTeamId: selectedTeams[j],
            awayTeamId: selectedTeams[j + 1],
            venueId: evalVenueId,
            gameDate: evaluationDate,
            gameTime: slot.time,
            seasonId,
            isEvaluation: true,
          });
        }
      }
    }

    // Step 2: Create regular season games with 1 game per ice slot
    const start = new Date(startDate);
    const end = new Date(endDate);
    let slotIndex = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      
      // Skip blackout dates
      if (blackoutDates.includes(dateString)) {
        continue;
      }

      const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][d.getDay()];
      
      if (recurringDays.includes(dayName)) {
        // Rotate through venues
        const venueId = selectedVenues[games.length % selectedVenues.length];
        
        // Use one ice time slot per game date
        const slot = iceTimeSlots[slotIndex % iceTimeSlots.length];
        slotIndex++;

        // Create one matchup per game slot
        for (let i = 0; i < selectedTeams.length - 1; i++) {
          games.push({
            id: `${dateString}-${venueId}-${i}`,
            homeTeamId: selectedTeams[i],
            awayTeamId: selectedTeams[i + 1],
            venueId,
            gameDate: dateString,
            gameTime: slot.time,
            seasonId,
          });
        }
      }
    }

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
      setRecurringDays([]);
      setEvaluationGameCount(0);
      setEvaluationDate("");
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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
                ? "Create recurring game schedules with evaluation games and multiple venues" 
                : "Créez des calendriers de matchs récurrents avec matchs d'évaluation et plusieurs lieux"}
            </p>
          </div>
          <button
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
          >
            {language === "en" ? "FR" : "EN"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

            {/* Venues Card */}
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
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedVenues.length} {language === "en" ? "selected" : "sélectionnés"}
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
          </div>

          {/* Main Content Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recurring Days Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "en" ? "Game Days" : "Jours de Matchs"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {days.map(day => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={recurringDays.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <Label className="font-normal cursor-pointer">{day.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ice Time Slots Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "en" ? "Ice Time Slots" : "Créneaux Horaires"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {iceTimeSlots.map(slot => (
                    <div key={slot.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="font-mono">{slot.time}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTimeSlot(slot.id)}
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
                  <Button onClick={addTimeSlot} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
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
                    onChange={(e) => setEvaluationGameCount(parseInt(e.target.value) || 0)}
                  />
                </div>
                {evaluationGameCount > 0 && (
                  <>
                    <div className="space-y-2">
                      <Label>{language === "en" ? "Evaluation Date" : "Date d'évaluation"}</Label>
                      <Input type="date" value={evaluationDate} onChange={(e) => setEvaluationDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "en" ? "Evaluation Time" : "Heure d'évaluation"}</Label>
                      <Input type="time" value={evaluationTime} onChange={(e) => setEvaluationTime(e.target.value)} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

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
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Team {game.homeTeamId} vs Team {game.awayTeamId}
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
