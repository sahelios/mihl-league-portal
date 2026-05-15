import { useState, useEffect } from "react";
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
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Gavel, Languages, Trash2, AlertTriangle, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminSuspensions() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suspensionToRemove, setSuspensionToRemove] = useState<number | null>(null);

  // Form State
  const [form, setForm] = useState({
    playerId: "",
    reason: "",
    duration: 1,
  });

  // tRPC Hooks
  const utils = trpc.useUtils();
  const { data: players, isLoading: loadingPlayers } = trpc.admin.getApprovedPlayers.useQuery();
  const { data: suspensions, isLoading: loadingSuspensions } = trpc.admin.getActiveSuspensions.useQuery();

  const addMutation = trpc.admin.addSuspension.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Suspension added!" : "Suspension ajoutée !");
      setForm({ playerId: "", reason: "", duration: 1 });
      utils.admin.getActiveSuspensions.invalidate();
      setIsSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setIsSubmitting(false);
    },
  });

  const removeMutation = trpc.admin.removeSuspension.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Suspension lifted!" : "Suspension levée !");
      setSuspensionToRemove(null);
      utils.admin.getActiveSuspensions.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Admin Access Check[cite: 1, 2]
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") return null;

  const handleAddSuspension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.playerId || !form.reason) {
      toast.error(language === "en" ? "Please fill all fields" : "Veuillez remplir tous les champs");
      return;
    }

    // Prevent duplicate suspensions check logic
    const alreadySuspended = suspensions?.some(s => s.playerId.toString() === form.playerId);
    if (alreadySuspended) {
      toast.error(language === "en" ? "Player is already suspended" : "Le joueur est déjà suspendu");
      return;
    }

    setIsSubmitting(true);
    addMutation.mutate({
      playerId: parseInt(form.playerId),
      reason: form.reason,
      duration: form.duration,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Gavel className="h-8 w-8 text-destructive" />
              {language === "en" ? "Suspension Management" : "Gestion des Suspensions"}
            </h1>
            <p className="text-muted-foreground">
              {language === "en" ? "Issue and manage league disciplinary actions" : "Gérer les mesures disciplinaires de la ligue"}
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
          {/* Section 1: Add Suspension Form */}
          <Card className="bg-card border-border h-fit">
            <CardHeader>
              <CardTitle className="text-xl">
                {language === "en" ? "Add New Suspension" : "Ajouter une Suspension"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSuspension} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="player">{language === "en" ? "Select Player" : "Choisir le Joueur"}</Label>
                  <Select 
                    value={form.playerId} 
                    onValueChange={(val) => setForm({ ...form, playerId: val })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder={language === "en" ? "Choose player..." : "Choisir..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingPlayers ? (
                        <div className="p-2 flex justify-center"><Loader2 className="animate-spin h-4 w-4" /></div>
                      ) : (
                        players?.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.firstName} {p.lastName} ({p.playerRating || "?"})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">{language === "en" ? "Duration (Games)" : "Durée (Matchs)"}</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 1 })}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">{language === "en" ? "Reason" : "Raison"}</Label>
                  <Textarea
                    id="reason"
                    required
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="bg-background min-h-[100px]"
                    placeholder={language === "en" ? "Detailed explanation..." : "Explication détaillée..."}
                  />
                </div>

                <Button type="submit" className="w-full" variant="destructive" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === "en" ? "Issue Suspension" : "Émettre la Suspension"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Section 2: Active Suspensions List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {language === "en" ? "Active Suspensions" : "Suspensions Actives"}
            </h2>

            {loadingSuspensions ? (
              <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : suspensions && suspensions.length > 0 ? (
              <div className="grid gap-4">
                {suspensions.map((s) => (
                  <Card key={s.id} className="border-destructive/20 bg-destructive/5 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-foreground">{s.playerName}</h3>
                          <p className="text-xs text-muted-foreground">{s.startDate}</p>
                        </div>
                        <div className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm font-bold border border-destructive/20">
                          {s.gamesRemaining} {language === "en" ? "Games" : "Matchs"}
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80 mb-4 bg-background/50 p-2 rounded border border-border/50 italic">
                        "{s.reason}"
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-destructive/30 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={() => setSuspensionToRemove(s.id)}
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        {language === "en" ? "Lift Suspension" : "Lever la Suspension"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 bg-muted/30">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  {language === "en" ? "No active suspensions" : "Aucune suspension active"}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!suspensionToRemove} onOpenChange={(open) => !open && setSuspensionToRemove(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{language === "en" ? "Confirm Removal" : "Confirmer la suppression"}</DialogTitle>
            <DialogDescription>
              {language === "en" 
                ? "Are you sure you want to lift this suspension? The player will be eligible to play immediately."
                : "Êtes-vous sûr de vouloir lever cette suspension ? Le joueur pourra jouer immédiatement."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setSuspensionToRemove(null)}>
              {language === "en" ? "Cancel" : "Annuler"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => suspensionToRemove && removeMutation.mutate({ id: suspensionToRemove })}
            >
              {language === "en" ? "Confirm Lift" : "Confirmer la levée"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}