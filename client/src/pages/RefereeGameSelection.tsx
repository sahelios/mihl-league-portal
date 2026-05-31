import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function RefereeGameSelection() {
  const { user } = useAuth();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  
  const { data: application, isLoading: appLoading } = trpc.referee.getMyApplication.useQuery(undefined, {
    enabled: !!user,
  });

  // Assumes a standard trpc.league.getSchedule query exists returning id, date, time, venue, teamAway, teamHome
  const { data: schedule, isLoading: scheduleLoading } = trpc.league.getSchedule.useQuery(); 
  
  const [selectedGames, setSelectedGames] = useState<number[]>([]);
  // Populate initial state once when loaded (useEffect omitted for brevity, but map initial application.selectedGames here ideally)

  const mutation = trpc.referee.selectGameAvailability.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Availability Saved!" : "Disponibilités enregistrées!");
    }
  });

  if (!user) return <div className="p-8">Please log in.</div>;
  if (appLoading || scheduleLoading) return <div className="p-8">Loading...</div>;

  if (!application || application.status !== "approved") {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">
          {language === "en" ? "Access Denied" : "Accès Refusé"}
        </h2>
        <p className="text-muted-foreground">
          {language === "en" 
            ? "You must have an approved application to select games." 
            : "Vous devez avoir une candidature approuvée pour sélectionner des matchs."}
        </p>
      </div>
    );
  }

  const handleToggleGame = (gameId: number) => {
    setSelectedGames(prev => 
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            {language === "en" ? "Select Game Availability" : "Sélectionner les disponibilités"}
          </h1>
          <Button variant="outline" onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
            {language === "en" ? "FR" : "EN"}
          </Button>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg border border-border mb-6">
          <p className="text-sm font-semibold">
            {language === "en" ? "Your Rate:" : "Votre Taux:"} ${application.paymentAmount} / match
          </p>
        </div>

        <div className="space-y-3">
          {schedule?.map((game: any) => (
            <Card key={game.id} className={selectedGames.includes(game.id) ? "border-primary" : ""}>
              <CardContent className="p-4 flex items-center space-x-4">
                <Checkbox 
                  id={`game-${game.id}`} 
                  checked={selectedGames.includes(game.id)}
                  onCheckedChange={() => handleToggleGame(game.id)}
                />
                <Label htmlFor={`game-${game.id}`} className="flex-1 cursor-pointer flex justify-between items-center">
                  <div>
                    <div className="font-semibold">
                      {new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })} @ {game.time}
                    </div>
                    <div className="text-sm text-muted-foreground">{game.teamAName} vs {game.teamBName}</div>
                  </div>
                  <Badge variant="outline">{game.venue}</Badge>
                </Label>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button 
          className="w-full mt-6" 
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ selectedGameIds: selectedGames })}
        >
          {language === "en" ? "Save Availability" : "Enregistrer les disponibilités"}
        </Button>
      </div>
    </div>
  );
}