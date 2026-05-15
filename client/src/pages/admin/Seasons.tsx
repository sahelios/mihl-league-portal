import { ArrowLeft, useState } from "react";
import { useRouter } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminSeasons() {
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [, navigate] = useRouter();
  const { user } = useAuth();
  
  const [seasonName, setSeasonName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Redirect non-admins
  if (user && user.role !== "admin") {
    navigate("/");
    return null;
  }

  const t = {
    en: {
      seasons: "Season Management",
      createSeason: "Create New Season",
      seasonName: "Season Name",
      startDate: "Start Date",
      endDate: "End Date",
      create: "Create",
      cancel: "Cancel",
      seasonCreated: "Season created successfully",
      error: "Error creating season",
      fillAllFields: "Please fill in all fields",
      example2026: "e.g., Summer 2026",
    },
    fr: {
      seasons: "Gestion des Saisons",
      createSeason: "Créer une Nouvelle Saison",
      seasonName: "Nom de la Saison",
      startDate: "Date de Début",
      endDate: "Date de Fin",
      create: "Créer",
      cancel: "Annuler",
      seasonCreated: "Saison créée avec succès",
      error: "Erreur lors de la création de la saison",
      fillAllFields: "Veuillez remplir tous les champs",
      example2026: "ex. Été 2026",
    },
  };

  const labels = t[language];

  const handleCreateSeason = async () => {
    if (!seasonName || !startDate || !endDate) {
      toast.error(labels.fillAllFields);
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would call a tRPC procedure
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success(labels.seasonCreated);
      setSeasonName("");
      setStartDate("");
      setEndDate("");
      setOpen(false);
    } catch (error) {
      toast.error(labels.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            {labels.seasons}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
          >
            {language === "en" ? "FR" : "EN"}
          </Button>
        </div>

        {/* Create Season Button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {labels.createSeason}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{labels.createSeason}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{labels.seasonName}</label>
                <Input
                  type="text"
                  placeholder={labels.example2026}
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{labels.startDate}</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{labels.endDate}</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateSeason}
                  disabled={isLoading}
                >
                  {labels.create}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  {labels.cancel}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Current Season Info */}
        <Card>
          <CardHeader>
            <CardTitle>Summer 2026</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>{language === "en" ? "Start Date:" : "Date de Début:"}</strong> June 23, 2026</p>
              <p><strong>{language === "en" ? "End Date:" : "Date de Fin:"}</strong> August 25, 2026</p>
              <p><strong>{language === "en" ? "Status:" : "Statut:"}</strong> {language === "en" ? "Active" : "Actif"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              {language === "en"
                ? "Create new seasons to organize league activities by time period."
                : "Créez de nouvelles saisons pour organiser les activités de la ligue par période."}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
