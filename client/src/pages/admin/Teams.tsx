import { useState } from "react";
import { useRouter } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: number;
  name: string;
  logoUrl: string;
}

const SAMPLE_TEAMS: Team[] = [
  { id: 1, name: "Iron Lions", logoUrl: "/team-logos/iron-lions.png" },
  { id: 2, name: "Golan Guards", logoUrl: "/team-logos/golan-guards.png" },
  { id: 3, name: "H Hammers", logoUrl: "/team-logos/h-hammers.png" },
  { id: 4, name: "Schvitz Saints", logoUrl: "/team-logos/schvitz-saints.png" },
];

export default function AdminTeams() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [, navigate] = useRouter();
  const { user } = useAuth();
  
  const [teams, setTeams] = useState<Team[]>(SAMPLE_TEAMS);
  const [teamName, setTeamName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Redirect non-admins
  if (user && user.role !== "admin") {
    navigate("/");
    return null;
  }

  const t = {
    en: {
      teams: "Team Management",
      addTeam: "Add New Team",
      teamName: "Team Name",
      add: "Add",
      cancel: "Cancel",
      teamAdded: "Team added successfully",
      error: "Error adding team",
      fillAllFields: "Please fill in all fields",
      edit: "Edit",
      delete: "Delete",
      teamDeleted: "Team deleted successfully",
    },
    fr: {
      teams: "Gestion des Équipes",
      addTeam: "Ajouter une Nouvelle Équipe",
      teamName: "Nom de l'Équipe",
      add: "Ajouter",
      cancel: "Annuler",
      teamAdded: "Équipe ajoutée avec succès",
      error: "Erreur lors de l'ajout de l'équipe",
      fillAllFields: "Veuillez remplir tous les champs",
      edit: "Modifier",
      delete: "Supprimer",
      teamDeleted: "Équipe supprimée avec succès",
    },
  };

  const labels = t[language];

  const handleAddTeam = async () => {
    if (!teamName) {
      toast.error(labels.fillAllFields);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTeam: Team = {
        id: Math.max(...teams.map(t => t.id), 0) + 1,
        name: teamName,
        logoUrl: "/team-logos/default.png",
      };
      setTeams([...teams, newTeam]);
      
      toast.success(labels.teamAdded);
      setTeamName("");
      setOpen(false);
    } catch (error) {
      toast.error(labels.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = (id: number) => {
    setTeams(teams.filter(t => t.id !== id));
    toast.success(labels.teamDeleted);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            {labels.teams}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
          >
            {language === "en" ? "FR" : "EN"}
          </Button>
        </div>

        {/* Add Team Button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {labels.addTeam}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{labels.addTeam}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{labels.teamName}</label>
                <Input
                  type="text"
                  placeholder="Team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddTeam}
                  disabled={isLoading}
                >
                  {labels.add}
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

        {/* Teams List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{team.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.info("Edit feature coming soon")}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">ID: {team.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              {language === "en"
                ? "Manage teams in the league. Add, edit, or remove teams as needed."
                : "Gérez les équipes de la ligue. Ajoutez, modifiez ou supprimez des équipes selon les besoins."}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
