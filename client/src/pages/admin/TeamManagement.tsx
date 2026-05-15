"use client";

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Trash2, UserPlus, UserMinus, Copy } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: number;
  name: string;
  seasonId: number;
  createdAt: Date;
}

interface PlayerWithTeam {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  playerRating: number | null;
  teamId: number | null;
  teamName?: string;
}

export default function TeamManagement() {
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const { user } = useAuth();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState("");
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [unassignedPlayers, setUnassignedPlayers] = useState<PlayerWithTeam[]>([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAssignPlayer, setShowAssignPlayer] = useState(false);
  const [showCopyTeam, setShowCopyTeam] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithTeam | null>(null);
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState<number | null>(null);
  const [copyTargetSeasonId, setCopyTargetSeasonId] = useState<number | null>(null);

  // Fetch teams and seasons
  const { data: fetchedTeams = [], isLoading: teamsLoading, refetch: refetchTeams } = trpc.admin.getTeams.useQuery(
    selectedSeasonId ? { seasonId: selectedSeasonId } : undefined,
    {
      onError: (error) => {
        console.error("Error loading teams:", error);
        toast.error("Failed to load teams");
      },
    }
  );

  const { data: seasons = [] } = trpc.admin.getSeasons.useQuery(undefined, {
    onError: (error) => {
      console.error("Error loading seasons:", error);
    },
  });

  // Fetch player registrations
  const { data: registrations = [] } = trpc.registration.getAll.useQuery(undefined, {
    onError: (error) => {
      console.error("Error loading registrations:", error);
    },
  });

  // Create team mutation
  const createTeamMutation = trpc.admin.createTeam.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Team created successfully" : "Équipe créée avec succès");
      setTeamName("");
      setShowCreateTeam(false);
      refetchTeams();
    },
    onError: (error) => {
      toast.error(language === "en" ? "Failed to create team" : "Erreur lors de la création de l'équipe");
    },
  });

  // Delete team mutation
  const deleteTeamMutation = trpc.admin.deleteTeam.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Team deleted successfully" : "Équipe supprimée avec succès");
      setSelectedTeamId(null);
      refetchTeams();
    },
    onError: (error) => {
      toast.error(language === "en" ? "Failed to delete team" : "Erreur lors de la suppression de l'équipe");
    },
  });

  // Copy team mutation
  const copyTeamMutation = trpc.admin.copyTeam.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Team copied successfully" : "Équipe copiée avec succès");
      setShowCopyTeam(false);
      setCopyTargetSeasonId(null);
      refetchTeams();
    },
    onError: (error) => {
      toast.error(language === "en" ? "Failed to copy team" : "Erreur lors de la copie de l'équipe");
    },
  });

  // Assign player to team mutation
  const assignPlayerMutation = trpc.registration.assignTeam.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Player assigned successfully" : "Joueur assigné avec succès");
      setShowAssignPlayer(false);
      setSelectedPlayer(null);
      setSelectedPlayerTeam(null);
      // Refresh players
      const updated = registrations.map((reg: any) => ({
        id: reg.id,
        firstName: reg.firstName,
        lastName: reg.lastName,
        email: reg.email,
        playerRating: reg.playerRating,
        teamId: reg.teamId,
      }));
      setPlayers(updated);
    },
    onError: (error) => {
      toast.error(language === "en" ? "Failed to assign player" : "Erreur lors de l'assignation du joueur");
    },
  });

  // Deassign player from team mutation
  const deassignPlayerMutation = trpc.registration.assignTeam.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Player removed from team" : "Joueur retiré de l'équipe");
      const updated = registrations.map((reg: any) => ({
        id: reg.id,
        firstName: reg.firstName,
        lastName: reg.lastName,
        email: reg.email,
        playerRating: reg.playerRating,
        teamId: reg.teamId,
      }));
      setPlayers(updated);
    },
    onError: (error) => {
      toast.error(language === "en" ? "Failed to remove player" : "Erreur lors du retrait du joueur");
    },
  });

  // Redirect non-admins
  if (user && user.role !== "admin") {
    return null;
  }

  // Update teams when fetched
  useEffect(() => {
    if (fetchedTeams && Array.isArray(fetchedTeams)) {
      setTeams(fetchedTeams as Team[]);
      if (fetchedTeams.length > 0 && !selectedTeamId) {
        setSelectedTeamId((fetchedTeams[0] as Team).id);
      }
    }
  }, [fetchedTeams]);

  // Update players when registrations fetched
  useEffect(() => {
    if (registrations && Array.isArray(registrations)) {
      const playerList = registrations.map((reg: any) => ({
        id: reg.id,
        firstName: reg.firstName,
        lastName: reg.lastName,
        email: reg.email,
        playerRating: reg.playerRating,
        teamId: reg.teamId,
      }));
      setPlayers(playerList);
      setUnassignedPlayers(playerList.filter((p) => !p.teamId));
    }
  }, [registrations]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const teamPlayers = selectedTeam ? players.filter((p) => p.teamId === selectedTeam.id) : [];

  const labels = {
    en: {
      teamManagement: "Team Management",
      teams: "Teams",
      players: "Players",
      rating: "Rating",
      createTeam: "Create Team",
      teamName: "Team Name",
      season: "Season",
      delete: "Delete",
      assignPlayer: "Assign Player",
      removePlayer: "Remove Player",
      unassignedPlayers: "Unassigned Players",
      selectTeam: "Select Team",
      selectPlayer: "Select Player",
      assign: "Assign",
      noTeams: "No teams created yet",
      noPlayers: "No players on this team",
      copyTeam: "Copy Team",
      selectSeason: "Select Season",
      copy: "Copy",
      season: "Season",
    },
    fr: {
      teamManagement: "Gestion des équipes",
      teams: "Équipes",
      players: "Joueurs",
      rating: "Évaluation",
      createTeam: "Créer une équipe",
      teamName: "Nom de l'équipe",
      season: "Saison",      delete: "Supprimer",
      assignPlayer: "Assigner un joueur",
      removePlayer: "Retirer le joueur",
      unassignedPlayers: "Joueurs non assignés",
      selectTeam: "Sélectionner une équipe",
      selectPlayer: "Sélectionner un joueur",
      assign: "Assigner",
      noTeams: "Aucune équipe créée",
      noPlayers: "Aucun joueur dans cette équipe",
      copyTeam: "Copier l'équipe",
      selectSeason: "Sélectionner une saison",
      copy: "Copier",
      season: "Saison",
    },
  };

  const l = labels[language];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{l.teamManagement}</h1>
          <div className="flex gap-2">
            <Select value={selectedSeasonId?.toString() || ""} onValueChange={(val) => setSelectedSeasonId(parseInt(val))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={l.selectSeason} />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season: any) => (
                  <SelectItem key={season.id} value={season.id.toString()}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              className="px-3 py-1 text-sm border rounded"
            >
              {language === "en" ? "FR" : "EN"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Teams List */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{l.teams}</CardTitle>
                  <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{l.createTeam}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder={l.teamName}
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                        />
                        <Button
                          onClick={() => {
                            if (teamName && seasonId) {
                              createTeamMutation.mutate({
                                name: teamName,
                                seasonId,
                              });
                            } else {
                              toast.error("Please fill in all fields");
                            }
                          }}
                          disabled={createTeamMutation.isPending}
                        >
                          {l.create}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {teams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{l.noTeams}</p>
                ) : (
                  teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`w-full p-2 text-left rounded border transition ${
                        selectedTeamId === team.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {team.name}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team Players */}
          <div className="md:col-span-2">
            {selectedTeam ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{selectedTeam.name} - {l.players}</CardTitle>
                    <div className="flex gap-2">
                      <Dialog open={showAssignPlayer} onOpenChange={setShowAssignPlayer}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{l.assignPlayer}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Select
                              value={selectedPlayer?.id.toString() || ""}
                              onValueChange={(val) => {
                                const player = unassignedPlayers.find((p) => p.id === parseInt(val));
                                setSelectedPlayer(player || null);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={l.selectPlayer} />
                              </SelectTrigger>
                              <SelectContent>
                                {unassignedPlayers.map((player) => (
                                  <SelectItem key={player.id} value={player.id.toString()}>
                                    {player.firstName} {player.lastName} ({player.playerRating || "N/A"})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() => {
                                if (selectedPlayer && selectedTeamId) {
                                  assignPlayerMutation.mutate({
                                    registrationId: selectedPlayer.id,
                                    teamId: selectedTeamId,
                                  });
                                }
                              }}
                              disabled={assignPlayerMutation.isPending || !selectedPlayer}
                            >
                              {l.assign}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={showCopyTeam} onOpenChange={setShowCopyTeam}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{l.copyTeam}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Select value={copyTargetSeasonId?.toString() || ""} onValueChange={(val) => setCopyTargetSeasonId(parseInt(val))}>
                              <SelectTrigger>
                                <SelectValue placeholder={l.selectSeason} />
                              </SelectTrigger>
                              <SelectContent>
                                {seasons.map((season: any) => (
                                  <SelectItem key={season.id} value={season.id.toString()}>
                                    {season.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() => {
                                if (selectedTeamId && copyTargetSeasonId) {
                                  copyTeamMutation.mutate({
                                    teamId: selectedTeamId,
                                    newSeasonId: copyTargetSeasonId,
                                  });
                                }
                              }}
                              disabled={copyTeamMutation.isPending || !copyTargetSeasonId}
                            >
                              {l.copy}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (selectedTeamId) {
                            deleteTeamMutation.mutate({ teamId: selectedTeamId });
                          }
                        }}
                        disabled={deleteTeamMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {teamPlayers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{l.noPlayers}</p>
                  ) : (
                    <div className="space-y-2">
                      {teamPlayers.map((player) => (
                        <div
                          key={player.id}
                          className="flex justify-between items-center p-2 border rounded hover:bg-muted"
                        >
                          <div>
                            <p className="font-medium">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{l.rating}: {player.playerRating || "N/A"}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              deassignPlayerMutation.mutate({
                                registrationId: player.id,
                                teamId: null,
                              });
                            }}
                            disabled={deassignPlayerMutation.isPending}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">{l.selectTeam}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Unassigned Players */}
        <Card>
          <CardHeader>
            <CardTitle>{l.unassignedPlayers}</CardTitle>
          </CardHeader>
          <CardContent>
            {unassignedPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground">All players are assigned</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unassignedPlayers.map((player) => (
                  <Card key={player.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {player.firstName} {player.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{l.rating}: {player.playerRating || "N/A"}</p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{l.assignPlayer}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Select
                              value={selectedPlayerTeam?.toString() || ""}
                              onValueChange={(val) => setSelectedPlayerTeam(parseInt(val))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={l.selectTeam} />
                              </SelectTrigger>
                              <SelectContent>
                                {teams.map((team) => (
                                  <SelectItem key={team.id} value={team.id.toString()}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() => {
                                if (selectedPlayerTeam) {
                                  assignPlayerMutation.mutate({
                                    registrationId: player.id,
                                    teamId: selectedPlayerTeam,
                                  });
                                  setSelectedPlayerTeam(null);
                                }
                              }}
                              disabled={assignPlayerMutation.isPending || !selectedPlayerTeam}
                            >
                              {l.assign}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
