import { ArrowLeft, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, Languages, Trash2, Trophy, User } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function StarsSelection() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selection, setSelection] = useState<{
    star1: string;
    star2: string;
    star3: string;
  }>({
    star1: "",
    star2: "",
    star3: "",
  });

  // tRPC Hooks
  const utils = trpc.useUtils();
  const { data: players, isLoading: loadingPlayers } = trpc.admin.getApprovedPlayers.useQuery();
  const { data: currentStars, isLoading: loadingStars } = trpc.admin.getCurrentStars.useQuery();

  const saveMutation = trpc.admin.selectStars.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Stars updated!" : "Étoiles mises à jour !");
      utils.admin.getCurrentStars.invalidate();
      setIsSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setIsSubmitting(false);
    },
  });

  // Admin Access Check[cite: 1, 2]
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") return null;

  const handleSave = async () => {
    if (!selection.star1 || !selection.star2 || !selection.star3) {
      toast.error(language === "en" ? "Please select all three stars" : "Veuillez sélectionner les trois étoiles");
      return;
    }

    // Prevent duplicate selection
    const ids = [selection.star1, selection.star2, selection.star3];
    if (new Set(ids).size !== ids.length) {
      toast.error(language === "en" ? "Each star must be a different player" : "Chaque étoile doit être un joueur différent");
      return;
    }

    setIsSubmitting(true);
    saveMutation.mutate({
      playerIds: ids.map(id => parseInt(id))
    });
  };

  const handleClear = () => {
    setSelection({ star1: "", star2: "", star3: "" });
  };

  const StarSelect = ({ label, value, onChange, disabledId1, disabledId2 }: any) => (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Star className="h-4 w-4 text-accent fill-accent" />
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-background">
          <SelectValue placeholder={language === "en" ? "Select player..." : "Choisir un joueur..."} />
        </SelectTrigger>
        <SelectContent>
          {players?.map((p) => (
            <SelectItem 
              key={p.id} 
              value={p.id.toString()}
              disabled={p.id.toString() === disabledId1 || p.id.toString() === disabledId2}
            >
              {p.firstName} {p.lastName} ({p.playerRating || "?"}) - {p.position || "N/A"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Trophy className="h-8 w-8 text-accent" />
              {language === "en" ? "Stars of the Week" : "Étoiles de la Semaine"}
            </h1>
            <p className="text-muted-foreground">
              {language === "en" ? "Select the top performers for the current week" : "Sélectionnez les meilleurs joueurs de la semaine"}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="flex items-center gap-2"
          >
            <Languages className="h-4 w-4" />
            {language === "en" ? "Français" : "English"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: Form */}
          <Card className="bg-card border-border h-fit">
            <CardHeader>
              <CardTitle>{language === "en" ? "Select Stars" : "Sélectionner les Étoiles"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingPlayers ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : (
                <>
                  <StarSelect 
                    label={language === "en" ? "First Star" : "Première Étoile"}
                    value={selection.star1}
                    onChange={(val: string) => setSelection({ ...selection, star1: val })}
                    disabledId1={selection.star2}
                    disabledId2={selection.star3}
                  />
                  <StarSelect 
                    label={language === "en" ? "Second Star" : "Deuxième Étoile"}
                    value={selection.star2}
                    onChange={(val: string) => setSelection({ ...selection, star2: val })}
                    disabledId1={selection.star1}
                    disabledId2={selection.star3}
                  />
                  <StarSelect 
                    label={language === "en" ? "Third Star" : "Troisième Étoile"}
                    value={selection.star3}
                    onChange={(val: string) => setSelection({ ...selection, star3: val })}
                    disabledId1={selection.star1}
                    disabledId2={selection.star2}
                  />
                </>
              )}
              
              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={handleSave} 
                  className="flex-1" 
                  disabled={isSubmitting || loadingPlayers}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === "en" ? "Save Selection" : "Enregistrer"}
                </Button>
                <Button variant="outline" onClick={handleClear} disabled={isSubmitting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {language === "en" ? "Clear" : "Effacer"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Current Stars Display */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">
              {language === "en" ? "Current Selection" : "Sélection Actuelle"}
            </h2>

            {loadingStars ? (
              <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : currentStars && currentStars.length > 0 ? (
              <div className="grid gap-4">
                {currentStars.map((star, index) => (
                  <Card key={star.id} className="bg-card border-accent/20 border-l-4 border-l-accent overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-accent/10 p-3 rounded-full">
                          <User className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-foreground">
                              {star.firstName} {star.lastName}
                            </h3>
                            <Star className="h-4 w-4 text-accent fill-accent" />
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px]">
                              {star.position || "N/A"}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              Rating: {star.playerRating || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          {index === 0 ? "1st Star" : index === 1 ? "2nd Star" : "3rd Star"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-muted/50 border-dashed border-2">
                <CardContent className="p-12 text-center text-muted-foreground">
                  {language === "en" ? "No stars selected yet" : "Aucune étoile sélectionnée pour le moment"}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}