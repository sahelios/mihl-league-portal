import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2 } from "lucide-react";

export default function Registration() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [registrationType, setRegistrationType] = useState<"individual" | "team" | "spare" | "referee" | "scorekeeper">("individual");
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = getLoginUrl("/register");
    }
  }, [isAuthenticated, isLoading]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Individual/Spare/Referee/Scorekeeper Form
  const [playerForm, setPlayerForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    rating: 5,
    position: "forward" as "forward" | "defenseman" | "goalie",
    preferredTeam: "",
    friendRequests: "",
    wantsCaptain: false,
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelationship: "",
    waiverSigned: false,
    waiverSignature: "",
    evaluationDate: "",
  });

  // Fetch evaluation game capacity
  const { data: evaluationCapacity } = trpc.registration.getEvaluationCapacity.useQuery();

  // Team Form
  const [teamForm, setTeamForm] = useState({
    teamName: "",
    captainFirstName: "",
    captainLastName: "",
    captainEmail: "",
    captainPhone: "",
    players: [
      { firstName: "", lastName: "", email: "", phone: "", position: "forward" as const, rating: 5 },
    ],
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelationship: "",
    waiverSigned: false,
    waiverSignature: "",
  });

  const submitRegistration = trpc.registration.submit.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      resetForms();
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error(error.message || "Registration failed");
      setIsSubmitting(false);
    },
  });

  const resetForms = () => {
    setPlayerForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      rating: 5,
      position: "forward",
      preferredTeam: "",
      friendRequests: "",
      wantsCaptain: false,
      emergencyName: "",
      emergencyPhone: "",
      emergencyRelationship: "",
      waiverSigned: false,
      waiverSignature: "",
      evaluationDate: "",
    });
    setTeamForm({
      teamName: "",
      captainFirstName: "",
      captainLastName: "",
      captainEmail: "",
      captainPhone: "",
      players: [
        { firstName: "", lastName: "", email: "", phone: "", position: "forward", rating: 5 },
      ],
      emergencyName: "",
      emergencyPhone: "",
      emergencyRelationship: "",
      waiverSigned: false,
      waiverSignature: "",
    });
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.waiverSigned) {
      toast.error(language === "en" ? "Please sign the waiver" : "Veuillez signer la décharge");
      return;
    }

    setIsSubmitting(true);
    const friendList = playerForm.friendRequests
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    try {
      await submitRegistration.mutateAsync({
        registrationType,
        firstName: playerForm.firstName,
        lastName: playerForm.lastName,
        email: playerForm.email,
        phone: playerForm.phone,
        rating: playerForm.rating,
        position: playerForm.position,
        preferredTeam: playerForm.preferredTeam || undefined,
        evaluationDate: playerForm.evaluationDate || undefined,
        friendRequests: friendList,
        wantsCaptain: playerForm.wantsCaptain,
        emergencyName: playerForm.emergencyName,
        emergencyPhone: playerForm.emergencyPhone,
        emergencyRelationship: playerForm.emergencyRelationship,
        waiverSigned: playerForm.waiverSigned,
        waiverSignature: playerForm.waiverSignature,
        language,
      });
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.waiverSigned) {
      toast.error(language === "en" ? "Please sign the waiver" : "Veuillez signer la décharge");
      return;
    }

    if (teamForm.players.length < 10 || teamForm.players.length > 15) {
      toast.error(language === "en" ? "Team must have 10-15 players" : "L'équipe doit avoir 10-15 joueurs");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitRegistration.mutateAsync({
        registrationType: "team",
        firstName: teamForm.captainFirstName,
        lastName: teamForm.captainLastName,
        email: teamForm.captainEmail,
        phone: teamForm.captainPhone,
        teamName: teamForm.teamName,
        teamPlayers: teamForm.players.map((p) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          position: p.position,
          rating: p.rating,
        })),
        emergencyName: teamForm.emergencyName,
        emergencyPhone: teamForm.emergencyPhone,
        emergencyRelationship: teamForm.emergencyRelationship,
        waiverSigned: teamForm.waiverSigned,
        waiverSignature: teamForm.waiverSignature,
        language,
      });
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  const addTeamPlayer = () => {
    setTeamForm({
      ...teamForm,
      players: [...teamForm.players, { firstName: "", lastName: "", email: "", phone: "", position: "forward", rating: 5 }],
    });
  };

  const removeTeamPlayer = (index: number) => {
    setTeamForm({
      ...teamForm,
      players: teamForm.players.filter((_, i) => i !== index),
    });
  };

  const updateTeamPlayer = (index: number, field: string, value: any) => {
    const newPlayers = [...teamForm.players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setTeamForm({ ...teamForm, players: newPlayers });
  };

  const getRegistrationTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; fr: string; price: string }> = {
      individual: { en: "Individual Player", fr: "Joueur Individuel", price: "$350" },
      team: { en: "Full Team", fr: "Équipe Complète", price: "$6,500" },
      spare: { en: "Spare Player", fr: "Joueur Suppléant", price: "$40" },
      referee: { en: "Referee", fr: "Arbitre", price: "TBD" },
      scorekeeper: { en: "Scorekeeper", fr: "Gardien de Pointage", price: "TBD" },
    };
    return labels[type] || { en: type, fr: type, price: "N/A" };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-foreground">
            {language === "en" ? "Player Registration" : "Inscription des Joueurs"}
          </h1>
          <button
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
          >
            {language === "en" ? "FR" : "EN"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{language === "en" ? "Register for the 2026 Summer Season" : "Inscrivez-vous pour la Saison d'Été 2026"}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Registration Type Selector */}
                <div className="mb-8 space-y-4">
                  <Label>{language === "en" ? "Registration Type" : "Type d'Inscription"} *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {["individual", "team", "spare", "referee", "scorekeeper"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setRegistrationType(type as any)}
                        className={`p-3 rounded border-2 text-sm font-medium transition ${
                          registrationType === type
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-foreground hover:border-accent"
                        }`}
                      >
                        <div>{getRegistrationTypeLabel(type).en}</div>
                        <div className="text-xs opacity-75">{getRegistrationTypeLabel(type).price}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual/Spare/Referee/Scorekeeper Form */}
                {registrationType !== "team" && (
                  <form onSubmit={handlePlayerSubmit} className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">{language === "en" ? "First Name" : "Prénom"} *</Label>
                        <Input
                          id="firstName"
                          required
                          value={playerForm.firstName}
                          onChange={(e) => setPlayerForm({ ...playerForm, firstName: e.target.value })}
                          placeholder={language === "en" ? "John" : "Jean"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">{language === "en" ? "Last Name" : "Nom de Famille"} *</Label>
                        <Input
                          id="lastName"
                          required
                          value={playerForm.lastName}
                          onChange={(e) => setPlayerForm({ ...playerForm, lastName: e.target.value })}
                          placeholder={language === "en" ? "Doe" : "Dupont"}
                        />
                      </div>
                    </div>

                    {/* Contact Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">{language === "en" ? "Email" : "Courriel"} *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={playerForm.email}
                          onChange={(e) => setPlayerForm({ ...playerForm, email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">{language === "en" ? "Phone" : "Téléphone"} *</Label>
                        <Input
                          id="phone"
                          required
                          value={playerForm.phone}
                          onChange={(e) => setPlayerForm({ ...playerForm, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>

                    {/* Player Details */}
                    {registrationType === "individual" && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="rating">{language === "en" ? "Skill Rating (1-10)" : "Niveau de Compétence (1-10)"} *</Label>
                            <Input
                              id="rating"
                              type="number"
                              min="1"
                              max="10"
                              required
                              value={playerForm.rating}
                              onChange={(e) => setPlayerForm({ ...playerForm, rating: parseInt(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="position">{language === "en" ? "Preferred Position" : "Position Préférée"} *</Label>
                            <Select value={playerForm.position} onValueChange={(value: any) => setPlayerForm({ ...playerForm, position: value })}>
                              <SelectTrigger id="position">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="forward">{language === "en" ? "Forward" : "Attaquant"}</SelectItem>
                                <SelectItem value="defenseman">{language === "en" ? "Defenseman" : "Défenseur"}</SelectItem>
                                <SelectItem value="goalie">{language === "en" ? "Goalie" : "Gardien"}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="preferredTeam">{language === "en" ? "Preferred Team (Optional)" : "Équipe Préférée (Optionnel)"}</Label>
                          <Select value={playerForm.preferredTeam} onValueChange={(value) => setPlayerForm({ ...playerForm, preferredTeam: value })}>
                            <SelectTrigger id="preferredTeam">
                              <SelectValue placeholder={language === "en" ? "No preference" : "Aucune préférence"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                {language === "en" ? "No preference" : "Aucune préférence"}
                              </SelectItem>
                              <SelectItem value="Iron Lions">Iron Lions</SelectItem>
                              <SelectItem value="Golan Guards">Golan Guards</SelectItem>
                              <SelectItem value="H Hammers">H Hammers</SelectItem>
                              <SelectItem value="Schvitz Saints">Schvitz Saints</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Evaluation Date Selection */}
                        <div>
                          <Label htmlFor="evaluationDate">{language === "en" ? "Evaluation Game Date *" : "Date du Match d'Évaluation *"}</Label>
                          <Select value={playerForm.evaluationDate} onValueChange={(value) => setPlayerForm({ ...playerForm, evaluationDate: value })}>
                            <SelectTrigger id="evaluationDate">
                              <SelectValue placeholder={language === "en" ? "Select a date" : "Sélectionnez une date"} />
                            </SelectTrigger>
                            <SelectContent>
                              {evaluationCapacity?.map((game) => {
                                const isGoalie = playerForm.position === 'goalie';
                                const spotsLeft = isGoalie ? game.goalieSpotsLeft : game.playerSpotsLeft;
                                const isFull = spotsLeft === 0;
                                return (
                                  <SelectItem key={game.date} value={game.date} disabled={isFull}>
                                    <span>{game.label} - {spotsLeft} {isGoalie ? (language === 'en' ? 'goalie spots' : 'places de gardien') : (language === 'en' ? 'player spots' : 'places de joueur')}</span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          {evaluationCapacity && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm text-muted-foreground">
                              {evaluationCapacity.map((game) => (
                                <div key={game.date} className="mb-2 pb-2 border-b last:border-b-0">
                                  <div className="font-semibold">{game.label}</div>
                                  <div className="text-xs">{game.venue} • {game.time}</div>
                                  <div className="text-xs mt-1">
                                    {language === 'en' ? 'Available: ' : 'Disponible: '}
                                    {game.playerSpotsLeft}/{game.maxPlayers} {language === 'en' ? 'players' : 'joueurs'}, 
                                    {game.goalieSpotsLeft}/{game.maxGoalies} {language === 'en' ? 'goalies' : 'gardiens'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="friendRequests">{language === "en" ? "Friend Requests (comma-separated names)" : "Demandes d'Amis (noms séparés par des virgules)"}</Label>
                          <Textarea
                            id="friendRequests"
                            value={playerForm.friendRequests}
                            onChange={(e) => setPlayerForm({ ...playerForm, friendRequests: e.target.value })}
                            placeholder={language === "en" ? "John Smith, Jane Doe" : "Jean Dupont, Jane Dupont"}
                            rows={2}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="wantsCaptain"
                            checked={playerForm.wantsCaptain}
                            onCheckedChange={(checked) => setPlayerForm({ ...playerForm, wantsCaptain: checked as boolean })}
                          />
                          <Label htmlFor="wantsCaptain" className="cursor-pointer">
                            {language === "en" ? "Interested in being a team captain" : "Intéressé à être capitaine d'équipe"}
                          </Label>
                        </div>
                      </>
                    )}

                    {/* Emergency Contact */}
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4">{language === "en" ? "Emergency Contact" : "Contact d'Urgence"}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="emergencyName">{language === "en" ? "Name" : "Nom"} *</Label>
                          <Input
                            id="emergencyName"
                            required
                            value={playerForm.emergencyName}
                            onChange={(e) => setPlayerForm({ ...playerForm, emergencyName: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="emergencyPhone">{language === "en" ? "Phone" : "Téléphone"} *</Label>
                          <Input
                            id="emergencyPhone"
                            required
                            value={playerForm.emergencyPhone}
                            onChange={(e) => setPlayerForm({ ...playerForm, emergencyPhone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="emergencyRelationship">{language === "en" ? "Relationship" : "Relation"} *</Label>
                        <Input
                          id="emergencyRelationship"
                          required
                          value={playerForm.emergencyRelationship}
                          onChange={(e) => setPlayerForm({ ...playerForm, emergencyRelationship: e.target.value })}
                          placeholder={language === "en" ? "e.g., Spouse, Parent, Friend" : "p. ex., Conjoint, Parent, Ami"}
                        />
                      </div>
                    </div>

                    {/* Waiver */}
                    <div className="border-t pt-6 space-y-4">
                      <div className="bg-accent/10 border border-accent/30 rounded p-4">
                        <p className="text-sm text-foreground font-semibold mb-2">
                          {language === "en" ? "Liability Waiver" : "Décharge de Responsabilité"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === "en"
                            ? "I acknowledge that ice hockey is a contact sport with inherent risks. I assume all risks and waive any claims against MIHL."
                            : "Je reconnais que le hockey sur glace est un sport de contact comportant des risques inhérents. J'assume tous les risques et renonce à toute réclamation contre la MIHL."}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="waiverSignature">{language === "en" ? "Digital Signature" : "Signature Numérique"} *</Label>
                        <Input
                          id="waiverSignature"
                          required
                          value={playerForm.waiverSignature}
                          onChange={(e) => setPlayerForm({ ...playerForm, waiverSignature: e.target.value })}
                          placeholder={language === "en" ? "Type your full name" : "Tapez votre nom complet"}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="waiverSigned"
                          checked={playerForm.waiverSigned}
                          onCheckedChange={(checked) => setPlayerForm({ ...playerForm, waiverSigned: checked as boolean })}
                        />
                        <Label htmlFor="waiverSigned" className="cursor-pointer text-sm">
                          {language === "en"
                            ? "I agree to the liability waiver above"
                            : "J'accepte la décharge de responsabilité ci-dessus"}
                        </Label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {language === "en" ? "Submit Registration" : "Soumettre l'Inscription"}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      {language === "en"
                        ? "* Required fields. Your registration will be reviewed and you'll receive an email confirmation."
                        : "* Champs obligatoires. Votre inscription sera examinée et vous recevrez une confirmation par courriel."}
                    </p>
                  </form>
                )}

                {/* Team Form */}
                {registrationType === "team" && (
                  <form onSubmit={handleTeamSubmit} className="space-y-6">
                    {/* Team Info */}
                    <div>
                      <Label htmlFor="teamName">{language === "en" ? "Team Name" : "Nom de l'Équipe"} *</Label>
                      <Input
                        id="teamName"
                        required
                        value={teamForm.teamName}
                        onChange={(e) => setTeamForm({ ...teamForm, teamName: e.target.value })}
                        placeholder={language === "en" ? "Your Team Name" : "Nom de Votre Équipe"}
                      />
                    </div>

                    {/* Captain Info */}
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4">{language === "en" ? "Team Captain" : "Capitaine de l'Équipe"}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="captainFirstName">{language === "en" ? "First Name" : "Prénom"} *</Label>
                          <Input
                            id="captainFirstName"
                            required
                            value={teamForm.captainFirstName}
                            onChange={(e) => setTeamForm({ ...teamForm, captainFirstName: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="captainLastName">{language === "en" ? "Last Name" : "Nom de Famille"} *</Label>
                          <Input
                            id="captainLastName"
                            required
                            value={teamForm.captainLastName}
                            onChange={(e) => setTeamForm({ ...teamForm, captainLastName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label htmlFor="captainEmail">{language === "en" ? "Email" : "Courriel"} *</Label>
                          <Input
                            id="captainEmail"
                            type="email"
                            required
                            value={teamForm.captainEmail}
                            onChange={(e) => setTeamForm({ ...teamForm, captainEmail: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="captainPhone">{language === "en" ? "Phone" : "Téléphone"} *</Label>
                          <Input
                            id="captainPhone"
                            required
                            value={teamForm.captainPhone}
                            onChange={(e) => setTeamForm({ ...teamForm, captainPhone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Team Players */}
                    <div className="border-t pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">
                          {language === "en" ? "Team Players" : "Joueurs de l'Équipe"} ({teamForm.players.length}/15)
                        </h3>
                        {teamForm.players.length < 15 && (
                          <Button type="button" onClick={addTeamPlayer} variant="outline" size="sm">
                            {language === "en" ? "+ Add Player" : "+ Ajouter un Joueur"}
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {teamForm.players.map((player, idx) => (
                          <div key={idx} className="border rounded p-4 space-y-3">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-medium">{language === "en" ? "Player" : "Joueur"} {idx + 1}</span>
                              {teamForm.players.length > 10 && (
                                <Button
                                  type="button"
                                  onClick={() => removeTeamPlayer(idx)}
                                  variant="destructive"
                                  size="sm"
                                >
                                  {language === "en" ? "Remove" : "Supprimer"}
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                placeholder={language === "en" ? "First Name" : "Prénom"}
                                value={player.firstName}
                                onChange={(e) => updateTeamPlayer(idx, "firstName", e.target.value)}
                                required
                              />
                              <Input
                                placeholder={language === "en" ? "Last Name" : "Nom de Famille"}
                                value={player.lastName}
                                onChange={(e) => updateTeamPlayer(idx, "lastName", e.target.value)}
                                required
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                type="email"
                                placeholder={language === "en" ? "Email" : "Courriel"}
                                value={player.email}
                                onChange={(e) => updateTeamPlayer(idx, "email", e.target.value)}
                                required
                              />
                              <Input
                                placeholder={language === "en" ? "Phone" : "Téléphone"}
                                value={player.phone}
                                onChange={(e) => updateTeamPlayer(idx, "phone", e.target.value)}
                                required
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Select value={player.position} onValueChange={(value: any) => updateTeamPlayer(idx, "position", value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="forward">{language === "en" ? "Forward" : "Attaquant"}</SelectItem>
                                  <SelectItem value="defenseman">{language === "en" ? "Defenseman" : "Défenseur"}</SelectItem>
                                  <SelectItem value="goalie">{language === "en" ? "Goalie" : "Gardien"}</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                placeholder={language === "en" ? "Rating (1-10)" : "Niveau (1-10)"}
                                value={player.rating}
                                onChange={(e) => updateTeamPlayer(idx, "rating", parseInt(e.target.value))}
                                required
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {teamForm.players.length < 10 && (
                        <p className="text-sm text-red-500 mt-2">
                          {language === "en"
                            ? `Need at least ${10 - teamForm.players.length} more players`
                            : `Besoin d'au moins ${10 - teamForm.players.length} joueurs supplémentaires`}
                        </p>
                      )}
                    </div>

                    {/* Emergency Contact */}
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4">{language === "en" ? "Emergency Contact" : "Contact d'Urgence"}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="teamEmergencyName">{language === "en" ? "Name" : "Nom"} *</Label>
                          <Input
                            id="teamEmergencyName"
                            required
                            value={teamForm.emergencyName}
                            onChange={(e) => setTeamForm({ ...teamForm, emergencyName: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="teamEmergencyPhone">{language === "en" ? "Phone" : "Téléphone"} *</Label>
                          <Input
                            id="teamEmergencyPhone"
                            required
                            value={teamForm.emergencyPhone}
                            onChange={(e) => setTeamForm({ ...teamForm, emergencyPhone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="teamEmergencyRelationship">{language === "en" ? "Relationship" : "Relation"} *</Label>
                        <Input
                          id="teamEmergencyRelationship"
                          required
                          value={teamForm.emergencyRelationship}
                          onChange={(e) => setTeamForm({ ...teamForm, emergencyRelationship: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Waiver */}
                    <div className="border-t pt-6 space-y-4">
                      <div className="bg-accent/10 border border-accent/30 rounded p-4">
                        <p className="text-sm text-foreground font-semibold mb-2">
                          {language === "en" ? "Liability Waiver" : "Décharge de Responsabilité"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === "en"
                            ? "I acknowledge that ice hockey is a contact sport with inherent risks. I assume all risks and waive any claims against MIHL on behalf of all team members."
                            : "Je reconnais que le hockey sur glace est un sport de contact comportant des risques inhérents. J'assume tous les risques et renonce à toute réclamation contre la MIHL au nom de tous les membres de l'équipe."}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="teamWaiverSignature">{language === "en" ? "Digital Signature" : "Signature Numérique"} *</Label>
                        <Input
                          id="teamWaiverSignature"
                          required
                          value={teamForm.waiverSignature}
                          onChange={(e) => setTeamForm({ ...teamForm, waiverSignature: e.target.value })}
                          placeholder={language === "en" ? "Type your full name" : "Tapez votre nom complet"}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="teamWaiverSigned"
                          checked={teamForm.waiverSigned}
                          onCheckedChange={(checked) => setTeamForm({ ...teamForm, waiverSigned: checked as boolean })}
                        />
                        <Label htmlFor="teamWaiverSigned" className="cursor-pointer text-sm">
                          {language === "en"
                            ? "I agree to the liability waiver above"
                            : "J'accepte la décharge de responsabilité ci-dessus"}
                        </Label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting || teamForm.players.length < 10}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {language === "en" ? "Submit Team Registration" : "Soumettre l'Inscription d'Équipe"}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      {language === "en"
                        ? "* Required fields. Your registration will be reviewed and you'll receive an email confirmation."
                        : "* Champs obligatoires. Votre inscription sera examinée et vous recevrez une confirmation par courriel."}
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pricing Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{language === "en" ? "Pricing" : "Tarification"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-b border-border pb-4">
                  <p className="text-sm text-muted-foreground mb-1">{language === "en" ? "Individual Registration" : "Inscription Individuelle"}</p>
                  <p className="text-2xl font-bold text-accent">$350</p>
                </div>

                <div className="border-b border-border pb-4">
                  <p className="text-sm text-muted-foreground mb-1">{language === "en" ? "Full Team Registration" : "Inscription d'Équipe Complète"}</p>
                  <p className="text-2xl font-bold text-accent">$6,500</p>
                  <p className="text-xs text-muted-foreground mt-1">{language === "en" ? "Up to 18 players" : "Jusqu'à 18 joueurs"}</p>
                </div>

                <div className="border-b border-border pb-4">
                  <p className="text-sm text-muted-foreground mb-1">{language === "en" ? "Spare Player" : "Joueur Suppléant"}</p>
                  <p className="text-2xl font-bold text-accent">$40</p>
                  <p className="text-xs text-muted-foreground mt-1">{language === "en" ? "Per game" : "Par match"}</p>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded p-3">
                  <p className="text-sm text-muted-foreground mb-2">{language === "en" ? "Jersey & Socks Set" : "Ensemble Jersey & Bas"}</p>
                  <p className="text-sm font-semibold text-accent mb-2">{language === "en" ? "Coming Soon!" : "À Venir!"}</p>
                  <p className="text-xs text-muted-foreground">{language === "en" ? "We're polling players on their preferences. This will be available to add to your registration costs soon." : "Nous sondons les joueurs sur leurs préférences. Ceci sera bientôt disponible à ajouter à vos frais d'inscription."}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === "en" ? "Evaluation Games" : "Matchs d'Évaluation"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="bg-accent/10 border border-accent/20 rounded p-3">
                  <p className="text-foreground font-semibold mb-2">
                    {language === "en" ? "Two Pickup Games Scheduled" : "Deux Matchs Amicaux Prévus"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "en"
                      ? "All registered players will participate in two evaluation games to assess skill levels and form team captains. Attendance is mandatory."
                      : "Tous les joueurs inscrits participeront à deux matchs d'évaluation pour évaluer les niveaux de compétence et former les capitaines d'équipe. La participation est obligatoire."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === "en" ? "Season Details" : "Détails de la Saison"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{language === "en" ? "Start Date" : "Date de Début"}</p>
                  <p className="font-semibold text-foreground">June 23, 2026</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === "en" ? "End Date" : "Date de Fin"}</p>
                  <p className="font-semibold text-foreground">August 25, 2026</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === "en" ? "Duration" : "Durée"}</p>
                  <p className="font-semibold text-foreground">10 weeks</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === "en" ? "Venues" : "Lieux"}</p>
                  <p className="font-semibold text-foreground">
                    Samuel Moscovitch Arena
                    <br />
                    Outremont Arena
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
