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
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [venueId, setVenueId] = useState("");
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
  const [scheduledGames, setScheduledGames] = useState<ScheduledGame[]>([]);

  // tRPC Queries
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
    if (selectedTeams.length < 2) {
      toast.error(language === "en" ? "Select at least 2 teams" : "Sélectionnez au moins 2 équipes");
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

    const games: ScheduledGame[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Generate all games for selected recurring days with ice time slots
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      
      // Skip blackout dates
      if (blackoutDates.includes(dateString)) {
        continue;
      }

      const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][d.getDay()];
      
      if (recurringDays.includes(dayName)) {
        // Create matchups for each ice time slot
        iceTimeSlots.forEach(slot => {
          for (let i = 0; i < selectedTeams.length - 1; i++) {
            games.push({
              id: `${dateString}-${slot.id}-${i}`,
              homeTeamId: selectedTeams[i],
              awayTeamId: selectedTeams[i + 1],
              venueId: parseInt(venueId),
              gameDate: dateString,
              gameTime: slot.time,
            });
          }
        });
      }
    }

    setScheduledGames(games);
    toast.success(language === "en" 
      ? `Generated ${games.length} games` 
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
      setRecurringDays([]);
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
                ? "Create recurring game schedules with ice time slots" 
                : "Créez des calendriers de matchs récurrents avec créneaux horaires"}
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

            {/* Venue Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "en" ? "Venue" : "Lieu"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={venueId} onValueChange={setVenueId}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "en" ? "Select venue" : "Sélectionnez un lieu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {venues?.map((venue: any) => (
                      <SelectItem key={venue.id} value={venue.id.toString()}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Date Range Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "en" ? "Date Range" : "Plage de Dates"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="startDate" className="text-sm">{language === "en" ? "Start Date" : "Date de Début"}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-sm">{language === "en" ? "End Date" : "Date de Fin"}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recurring Days Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "en" ? "Days" : "Jours"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {days.map(day => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={recurringDays.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <Label className="font-normal cursor-pointer text-sm">{day.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button onClick={generateSchedule} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {language === "en" ? "Generate Schedule" : "Générer le Calendrier"}
            </Button>
          </div>

          {/* Ice Time Slots & Blackout Dates */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ice Time Slots Card */}
            <Card>
              <CardHeader>
                <CardTitle>{language === "en" ? "Ice Time Slots" : "Créneaux Horaires"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {iceTimeSlots.map(slot => (
                    <div key={slot.id} className="flex items-center justify-between p-2 bg-muted/50 rounded border border-border">
                      <span className="font-mono">{slot.time}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(slot.id)}
                        className="text-destructive hover:text-destructive"
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
                    placeholder={language === "en" ? "Add time slot" : "Ajouter un créneau"}
                  />
                  <Button onClick={addTimeSlot} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Blackout Dates Card */}
            <Card>
              <CardHeader>
                <CardTitle>{language === "en" ? "Blackout Dates" : "Dates Exclues"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {blackoutDates.map(date => (
                    <div key={date} className="flex items-center justify-between p-2 bg-muted/50 rounded border border-border">
                      <span>{new Date(date).toLocaleDateString()}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlackoutDate(date)}
                        className="text-destructive hover:text-destructive"
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
                  <Button onClick={addBlackoutDate} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Scheduled Games Preview */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "en" ? "Scheduled Games" : "Matchs Programmés"}
                  <Badge className="ml-2">{scheduledGames.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scheduledGames.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {language === "en" 
                      ? "No games scheduled yet. Configure and generate a schedule above." 
                      : "Aucun match programmé. Configurez et générez un calendrier ci-dessus."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {scheduledGames.map((game, idx) => {
                        const homeTeam = teams?.find(t => t.id === game.homeTeamId);
                        const awayTeam = teams?.find(t => t.id === game.awayTeamId);
                        const venue = venues?.find((v: any) => v.id === game.venueId);

                        return (
                          <div key={game.id} className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border">
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">
                                {homeTeam?.name} vs {awayTeam?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(game.gameDate).toLocaleDateString()} @ {game.gameTime} - {venue?.name}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGame(game.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    <Button onClick={submitSchedule} className="w-full mt-6">
                      {language === "en" ? "Create Games" : "Créer les Matchs"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
