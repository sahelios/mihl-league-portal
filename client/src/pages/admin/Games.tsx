import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, ArrowLeft, Languages } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Games() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    gameId: "",
    teamAScore: 0,
    teamBScore: 0,
    scorers: "",
    assists: "",
  });

  // tRPC Queries & Mutations
  const utils = trpc.useUtils();
  const { data: upcomingGames, isLoading: loadingGames } = trpc.admin.getUpcomingGames.useQuery();
  const { data: recentGames, isLoading: loadingRecent } = trpc.admin.getRecentGames.useQuery();

  const submitMutation = trpc.admin.submitGameScore.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Score submitted successfully!" : "Score soumis avec succès !");
      setForm({ gameId: "", teamAScore: 0, teamBScore: 0, scorers: "", assists: "" });
      utils.admin.getRecentGames.invalidate();
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  // Admin Access Check
  if (user?.role !== "admin") {
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
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "en" ? "Return Home" : "Retour à l'accueil"}
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gameId) {
      toast.error(language === "en" ? "Please select a game" : "Veuillez sélectionner un match");
      return;
    }
    if (form.teamAScore < 0 || form.teamBScore < 0) {
      toast.error(language === "en" ? "Scores cannot be negative" : "Les scores ne peuvent pas être négatifs");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        gameId: parseInt(form.gameId),
        teamAScore: form.teamAScore,
        teamBScore: form.teamBScore,
        scorers: form.scorers,
        assists: form.assists,
      });
    } catch (error) {
      // Handled by onError
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header & Language Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {language === "en" ? "Game Management" : "Gestion des Matchs"}
            </h1>
            <p className="text-muted-foreground">
              {language === "en" ? "Record scores and player stats" : "Enregistrer les scores et stats"}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="flex items-center gap-2"
          >
            <Languages className="h-4 w-4" />
            {language === "en" ? "Français" : "English"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: Enter Score Form */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">
                {language === "en" ? "Enter Score" : "Saisir le Score"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="game-select">
                    {language === "en" ? "Select Game" : "Sélectionner le Match"}
                  </Label>
                  <Select 
                    value={form.gameId} 
                    onValueChange={(val) => setForm({ ...form, gameId: val })}
                  >
                    <SelectTrigger id="game-select" className="bg-background">
                      <SelectValue placeholder={language === "en" ? "Choose a game..." : "Choisir un match..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingGames ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        upcomingGames?.map((game) => (
                          <SelectItem key={game.id} value={game.id.toString()}>
                            {game.teamAName} vs {game.teamBName} - {game.date}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scoreA">
                      {language === "en" ? "Team A Score" : "Score Équipe A"}
                    </Label>
                    <Input
                      id="scoreA"
                      type="number"
                      min="0"
                      value={form.teamAScore}
                      onChange={(e) => setForm({ ...form, teamAScore: parseInt(e.target.value) || 0 })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scoreB">
                      {language === "en" ? "Team B Score" : "Score Équipe B"}
                    </Label>
                    <Input
                      id="scoreB"
                      type="number"
                      min="0"
                      value={form.teamBScore}
                      onChange={(e) => setForm({ ...form, teamBScore: parseInt(e.target.value) || 0 })}
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scorers">
                    {language === "en" ? "Goal Scorers" : "Buteurs"}
                  </Label>
                  <Textarea
                    id="scorers"
                    placeholder={language === "en" ? "Name 1, Name 2..." : "Nom 1, Nom 2..."}
                    value={form.scorers}
                    onChange={(e) => setForm({ ...form, scorers: e.target.value })}
                    className="bg-background min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assists">
                    {language === "en" ? "Assists" : "Aides"}
                  </Label>
                  <Textarea
                    id="assists"
                    placeholder={language === "en" ? "Name 1, Name 2..." : "Nom 1, Nom 2..."}
                    value={form.assists}
                    onChange={(e) => setForm({ ...form, assists: e.target.value })}
                    className="bg-background min-h-[100px]"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === "en" ? "Submit Results" : "Soumettre les Résultats"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Section 2: Recent Games List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {language === "en" ? "Recent Games" : "Matchs Récents"}
            </h2>
            
            {loadingRecent ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4">
                {recentGames?.map((game) => (
                  <Card key={game.id} className="border-border bg-card overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted-foreground">{game.date}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {language === "en" ? "Completed" : "Terminé"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right pr-4 font-semibold text-foreground">
                          {game.teamAName}
                        </div>
                        <div className="bg-muted px-3 py-1 rounded text-lg font-bold border border-border">
                          {game.teamAScore} - {game.teamBScore}
                        </div>
                        <div className="flex-1 text-left pl-4 font-semibold text-foreground">
                          {game.teamBName}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {recentGames?.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    {language === "en" ? "No scores recorded yet." : "Aucun score enregistré pour l'instant."}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}