import { ArrowLeft, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Languages, Edit, Trash2, Calendar, Users, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// Type definitions based on requirements
type Season = { id: number; name: string; startDate: string; endDate: string };
type Team = { id: number; name: string; logoUrl?: string; primaryColor?: string; secondaryColor?: string; wins?: number; losses?: number; points?: number };
type Venue = { id: number; name: string; address: string; city: string; capacity: number; scheduledGamesCount?: number };

export default function AdminSettings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'season' | 'team' | 'venue' | null; id: number | null }>({ type: null, id: null });

  // ---------------------------------------------------------------------------
  // Season State & tRPC
  // ---------------------------------------------------------------------------
  const [seasonForm, setSeasonForm] = useState({ name: "", startDate: "", endDate: "" });
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);

  const { data: seasons, isLoading: loadingSeasons } = trpc.admin.getSeasons.useQuery();
  const seasonUtils = trpc.useUtils().admin.getSeasons;

  const createSeason = trpc.admin.createSeason.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Season created!" : "Saison créée !");
      setSeasonForm({ name: "", startDate: "", endDate: "" });
      seasonUtils.invalidate();
      setIsSubmitting(false);
    },
    onError: (err) => { toast.error(err.message); setIsSubmitting(false); },
  });

  const updateSeason = trpc.admin.updateSeason.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Season updated!" : "Saison mise à jour !");
      setEditingSeason(null);
      setSeasonForm({ name: "", startDate: "", endDate: "" });
      seasonUtils.invalidate();
      setIsSubmitting(false);
    },
    onError: (err) => { toast.error(err.message); setIsSubmitting(false); },
  });

  const deleteSeason = trpc.admin.deleteSeason.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Season deleted!" : "Saison supprimée !");
      setDeleteDialog({ type: null, id: null });
      seasonUtils.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // ---------------------------------------------------------------------------
  // Team State & tRPC
  // ---------------------------------------------------------------------------
  const [teamForm, setTeamForm] = useState({ name: "", logoUrl: "", primaryColor: "#000000", secondaryColor: "#ffffff" });
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const { data: teams, isLoading: loadingTeams } = trpc.admin.getTeams.useQuery();
  const teamUtils = trpc.useUtils().admin.getTeams;

  const createTeam = trpc.admin.createTeam.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Team created!" : "Équipe créée !");
      setTeamForm({ name: "", logoUrl: "", primaryColor: "#000000", secondaryColor: "#ffffff" });
      teamUtils.invalidate();
      setIsSubmitting(false);
    },
    onError: (err) => { toast.error(err.message); setIsSubmitting(false); },
  });

  const updateTeam = trpc.admin.updateTeam.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Team updated!" : "Équipe mise à jour !");
      setEditingTeam(null);
      setTeamForm({ name: "", logoUrl: "", primaryColor: "#000000", secondaryColor: "#ffffff" });
      teamUtils.invalidate();
      setIsSubmitting(false);
    },
    onError: (err) => { toast.error(err.message); setIsSubmitting(false); },
  });

  const deleteTeam = trpc.admin.deleteTeam.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Team deleted!" : "Équipe supprimée !");
      setDeleteDialog({ type: null, id: null });
      teamUtils.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // ---------------------------------------------------------------------------
  // Venue State & tRPC
  // ---------------------------------------------------------------------------
  const [venueForm, setVenueForm] = useState({ name: "", address: "", city: "", capacity: 0 });
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);

  const { data: venues, isLoading: loadingVenues } = trpc.admin.getVenues.useQuery();
  const venueUtils = trpc.useUtils().admin.getVenues;

  const createVenue = trpc.admin.createVenue.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Venue created!" : "Lieu créé !");
      setVenueForm({ name: "", address: "", city: "", capacity: 0 });
      venueUtils.invalidate();
      setIsSubmitting(false);
    },
    onError: (err) => { toast.error(err.message); setIsSubmitting(false); },
  });

  const updateVenue = trpc.admin.updateVenue.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Venue updated!" : "Lieu mis à jour !");
      setEditingVenue(null);
      setVenueForm({ name: "", address: "", city: "", capacity: 0 });
      venueUtils.invalidate();
      setIsSubmitting(false);
    },
    onError: (err) => { toast.error(err.message); setIsSubmitting(false); },
  });

  const deleteVenue = trpc.admin.deleteVenue.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Venue deleted!" : "Lieu supprimé !");
      setDeleteDialog({ type: null, id: null });
      venueUtils.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  // Admin Check
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") return null;

  const handleSeasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonForm.name || !seasonForm.startDate || !seasonForm.endDate) return;
    setIsSubmitting(true);
    if (editingSeason) {
      await updateSeason.mutateAsync({ id: editingSeason.id, ...seasonForm });
    } else {
      await createSeason.mutateAsync(seasonForm);
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name) return;
    setIsSubmitting(true);
    if (editingTeam) {
      await updateTeam.mutateAsync({ id: editingTeam.id, ...teamForm });
    } else {
      await createTeam.mutateAsync(teamForm);
    }
  };

  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueForm.name || !venueForm.address) return;
    setIsSubmitting(true);
    if (editingVenue) {
      await updateVenue.mutateAsync({ id: editingVenue.id, ...venueForm });
    } else {
      await createVenue.mutateAsync(venueForm);
    }
  };

  const confirmDelete = () => {
    if (!deleteDialog.id || !deleteDialog.type) return;
    if (deleteDialog.type === 'season') deleteSeason.mutate({ id: deleteDialog.id });
    if (deleteDialog.type === 'team') deleteTeam.mutate({ id: deleteDialog.id });
    if (deleteDialog.type === 'venue') deleteVenue.mutate({ id: deleteDialog.id });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {language === "en" ? "League Settings" : "Paramètres de la Ligue"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "en" ? "Manage seasons, teams, and venues" : "Gérer les saisons, équipes et lieux"}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="flex items-center gap-2 shrink-0"
          >
            <Languages className="h-4 w-4" />
            {language === "en" ? "Français" : "English"}
          </Button>
        </div>

        <Tabs defaultValue="seasons" className="space-y-6">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="seasons" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "en" ? "Seasons" : "Saisons"}</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "en" ? "Teams" : "Équipes"}</span>
            </TabsTrigger>
            <TabsTrigger value="venues" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "en" ? "Venues" : "Lieux"}</span>
            </TabsTrigger>
          </TabsList>

          {/* ================================================================= */}
          {/* SEASON TAB */}
          {/* ================================================================= */}
          <TabsContent value="seasons" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 bg-card border-border h-fit">
              <CardHeader>
                <CardTitle>{editingSeason ? (language === "en" ? "Edit Season" : "Modifier la Saison") : (language === "en" ? "New Season" : "Nouvelle Saison")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSeasonSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{language === "en" ? "Season Name" : "Nom de la Saison"}</Label>
                    <Input required value={seasonForm.name} onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "en" ? "Start Date" : "Date de Début"}</Label>
                    <Input type="date" required value={seasonForm.startDate} onChange={(e) => setSeasonForm({ ...seasonForm, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "en" ? "End Date" : "Date de Fin"}</Label>
                    <Input type="date" required value={seasonForm.endDate} onChange={(e) => setSeasonForm({ ...seasonForm, endDate: e.target.value })} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingSeason ? (language === "en" ? "Update" : "Mettre à jour") : (language === "en" ? "Create" : "Créer")}
                    </Button>
                    {editingSeason && (
                      <Button type="button" variant="outline" onClick={() => { setEditingSeason(null); setSeasonForm({ name: "", startDate: "", endDate: "" }); }}>
                        {language === "en" ? "Cancel" : "Annuler"}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              {loadingSeasons ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div> : (
                seasons?.map((season) => (
                  <Card key={season.id} className="bg-card border-border">
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{season.name}</h3>
                        <p className="text-sm text-muted-foreground">{season.startDate} - {season.endDate}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => { setEditingSeason(season); setSeasonForm({ name: season.name, startDate: season.startDate, endDate: season.endDate }); }}>
                          <Edit className="h-4 w-4 mr-2" /> {language === "en" ? "Edit" : "Modifier"}
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={() => setDeleteDialog({ type: 'season', id: season.id })}>
                          <Trash2 className="h-4 w-4 mr-2" /> {language === "en" ? "Delete" : "Supprimer"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* ================================================================= */}
          {/* TEAM TAB */}
          {/* ================================================================= */}
          <TabsContent value="teams" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 bg-card border-border h-fit">
              <CardHeader>
                <CardTitle>{editingTeam ? (language === "en" ? "Edit Team" : "Modifier l'Équipe") : (language === "en" ? "New Team" : "Nouvelle Équipe")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTeamSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{language === "en" ? "Team Name" : "Nom de l'Équipe"}</Label>
                    <Input required value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "en" ? "Logo URL" : "URL du Logo"}</Label>
                    <Input value={teamForm.logoUrl} onChange={(e) => setTeamForm({ ...teamForm, logoUrl: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === "en" ? "Primary Color" : "Couleur Primaire"}</Label>
                      <Input type="color" value={teamForm.primaryColor} onChange={(e) => setTeamForm({ ...teamForm, primaryColor: e.target.value })} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "en" ? "Secondary Color" : "Couleur Secondaire"}</Label>
                      <Input type="color" value={teamForm.secondaryColor} onChange={(e) => setTeamForm({ ...teamForm, secondaryColor: e.target.value })} className="h-10 p-1" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingTeam ? (language === "en" ? "Update" : "Mettre à jour") : (language === "en" ? "Create" : "Créer")}
                    </Button>
                    {editingTeam && (
                      <Button type="button" variant="outline" onClick={() => { setEditingTeam(null); setTeamForm({ name: "", logoUrl: "", primaryColor: "#000000", secondaryColor: "#ffffff" }); }}>
                        {language === "en" ? "Cancel" : "Annuler"}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              {loadingTeams ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div> : (
                teams?.map((team) => (
                  <Card key={team.id} className="bg-card border-border overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-2 h-full min-h-[8px] sm:min-h-full" style={{ backgroundColor: team.primaryColor || '#ccc' }} />
                      <CardContent className="p-4 flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="w-12 h-12 rounded-full object-cover border" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border">
                              <Users className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-lg text-foreground">{team.name}</h3>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{team.wins || 0} W</Badge>
                              <Badge variant="secondary" className="text-xs">{team.losses || 0} L</Badge>
                              <Badge variant="outline" className="text-xs">{team.points || 0} PTS</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => { setEditingTeam(team); setTeamForm({ name: team.name, logoUrl: team.logoUrl || "", primaryColor: team.primaryColor || "#000000", secondaryColor: team.secondaryColor || "#ffffff" }); }}>
                            <Edit className="h-4 w-4 mr-2" /> {language === "en" ? "Edit" : "Modifier"}
                          </Button>
                          <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={() => setDeleteDialog({ type: 'team', id: team.id })}>
                            <Trash2 className="h-4 w-4 mr-2" /> {language === "en" ? "Delete" : "Supprimer"}
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* ================================================================= */}
          {/* VENUE TAB */}
          {/* ================================================================= */}
          <TabsContent value="venues" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 bg-card border-border h-fit">
              <CardHeader>
                <CardTitle>{editingVenue ? (language === "en" ? "Edit Venue" : "Modifier le Lieu") : (language === "en" ? "New Venue" : "Nouveau Lieu")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVenueSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{language === "en" ? "Venue Name" : "Nom du Lieu"}</Label>
                    <Input required value={venueForm.name} onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "en" ? "Address" : "Adresse"}</Label>
                    <Input required value={venueForm.address} onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === "en" ? "City" : "Ville"}</Label>
                      <Input required value={venueForm.city} onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "en" ? "Capacity" : "Capacité"}</Label>
                      <Input type="number" min="0" value={venueForm.capacity} onChange={(e) => setVenueForm({ ...venueForm, capacity: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingVenue ? (language === "en" ? "Update" : "Mettre à jour") : (language === "en" ? "Create" : "Créer")}
                    </Button>
                    {editingVenue && (
                      <Button type="button" variant="outline" onClick={() => { setEditingVenue(null); setVenueForm({ name: "", address: "", city: "", capacity: 0 }); }}>
                        {language === "en" ? "Cancel" : "Annuler"}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              {loadingVenues ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div> : (
                venues?.map((venue) => (
                  <Card key={venue.id} className="bg-card border-border">
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {venue.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{venue.address}, {venue.city}</p>
                        <div className="flex gap-3 mt-2">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {language === "en" ? "Capacity:" : "Capacité :"} <strong className="text-foreground">{venue.capacity}</strong>
                          </span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {language === "en" ? "Scheduled Games:" : "Matchs prévus :"} <strong className="text-foreground">{venue.scheduledGamesCount || 0}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => { setEditingVenue(venue); setVenueForm({ name: venue.name, address: venue.address, city: venue.city, capacity: venue.capacity }); }}>
                          <Edit className="h-4 w-4 mr-2" /> {language === "en" ? "Edit" : "Modifier"}
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={() => setDeleteDialog({ type: 'venue', id: venue.id })}>
                          <Trash2 className="h-4 w-4 mr-2" /> {language === "en" ? "Delete" : "Supprimer"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog.id} onOpenChange={(open) => !open && setDeleteDialog({ type: null, id: null })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {language === "en" ? "Confirm Deletion" : "Confirmer la suppression"}
            </DialogTitle>
            <DialogDescription>
              {language === "en" 
                ? "Are you sure you want to delete this item? This action cannot be undone and may affect related records." 
                : "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible et peut affecter les données liées."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialog({ type: null, id: null })}>
              {language === "en" ? "Cancel" : "Annuler"}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {language === "en" ? "Delete Item" : "Supprimer l'élément"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}