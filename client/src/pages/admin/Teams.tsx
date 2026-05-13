"use client";

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: number;
  name: string;
  seasonId: number;
  createdAt: Date;
}

export default function AdminTeams() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  const [teamName, setTeamName] = useState("");
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Redirect non-admins
  if (user && user.role !== "admin") {
    navigate("/");
    return null;
  }

  // Fetch teams and seasons
  const { data: teams = [], isLoading: teamsLoading, refetch: refetchTeams } = trpc.admin.getTeams.useQuery();
  const { data: seasons = [] } = trpc.admin.getSeasons.useQuery();
  
  // Create team mutation
  const createTeamMutation = trpc.admin.createTeam.useMutation({
    onSuccess: () => {
      toast.success(labels.teamAdded);
      setTeamName("");
      setSeasonId(null);
      setOpen(false);
      refetchTeams();
    },
    onError: (error) => {
      toast.error(labels.error);
      console.error("Error creating team:", error);
    },
  });

  // Delete team mutation
  const deleteTeamMutation = trpc.admin.deleteTeam.useMutation({
    onSuccess: () => {
      toast.success(labels.teamDeleted);
      refetchTeams();
    },
    onError: (error) => {
      toast.error(labels.error);
      console.error("Error deleting team:", error);
    },
  });

  const t = {
    en: {
      teams: "Team Management",
      addTeam: "Add New Team",
      teamName: "Team Name",
      season: "Season",
      add: "Add",
      cancel: "Cancel",
      teamAdded: "Team added successfully",
      error: "Error adding team",
      fillAllFields: "Please fill in all fields",
      delete: "Delete",
      teamDeleted: "Team deleted successfully",
      noTeams: "No teams created yet",
      selectSeason: "Select a season",
    },
    fr: {
      teams: "Gestion des Équipes",
      addTeam: "Ajouter une Nouvelle Équipe",
      teamName: "Nom de l'Équipe",
      season: "Saison",
      add: "Ajouter",
      cancel: "Annuler",
      teamAdded: "Équipe ajoutée avec succès",
      error: "Erreur lors de l'ajout de l'équipe",
      fillAllFields: "Veuillez remplir tous les champs",
      delete: "Supprimer",
      teamDeleted: "Équipe supprimée avec succès",
      noTeams: "Aucune équipe créée",
      selectSeason: "Sélectionner une saison",
    },
  };

  const labels = t[language];

  const handleAddTeam = async () => {
    if (!teamName || !seasonId) {
      toast.error(labels.fillAllFields);
      return;
    }

    setIsLoading(true);
    try {
      await createTeamMutation.mutateAsync({
        name: teamName,
        seasonId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = (id: number) => {
    if (confirm("Are you sure?")) {
      deleteTeamMutation.mutate({ teamId: id });
    }
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
                <label className="text-sm font-medium">{labels.season}</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={seasonId || ""}
                  onChange={(e) => setSeasonId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">{labels.selectSeason}</option>
                  {seasons.map((season: any) => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>

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
                  disabled={isLoading || createTeamMutation.isPending}
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
        <div className="grid gap-4">
          {teamsLoading ? (
            <div className="text-center py-8">Loading teams...</div>
          ) : teams && teams.length > 0 ? (
            teams.map((team: Team) => (
              <Card key={team.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTeam(team.id)}
                    disabled={deleteTeamMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <p>Season ID: {team.seasonId}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">{labels.noTeams}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
