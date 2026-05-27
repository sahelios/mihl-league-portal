import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Users, BarChart3, DollarSign, Calendar } from "lucide-react";
import { useState } from "react";

export default function RefereeScorekeeper() {
  const [registrationType, setRegistrationType] = useState<"referee" | "scorekeeper">("referee");
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    experience: "beginner" as "beginner" | "intermediate" | "advanced",
    availableDays: [] as string[],
    notes: "",
    desiredSalary: "",
    waiverSigned: false,
    waiverSignature: "",
  });

  const submitStaffApplication = trpc.registration.submitStaffApplication.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      resetForm();
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error(error.message || "Registration failed");
      setIsSubmitting(false);
    },
  });

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      experience: "beginner",
      availableDays: [],
      notes: "",
      desiredSalary: "",
      waiverSigned: false,
      waiverSignature: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.waiverSigned) {
      toast.error(language === "en" ? "Please sign the waiver" : "Veuillez signer la décharge");
      return;
    }

    if (form.availableDays.length === 0) {
      toast.error(language === "en" ? "Please select at least one available day" : "Veuillez sélectionner au moins un jour disponible");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitStaffApplication.mutateAsync({
        registrationType,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        experience: form.experience,
        availableDays: form.availableDays,
        notes: form.notes,
        desiredSalary: form.desiredSalary ? parseInt(form.desiredSalary) : undefined,
        waiverSigned: form.waiverSigned,
        waiverSignature: form.waiverSignature,
        language,
      });
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  const toggleDay = (day: string) => {
    setForm({
      ...form,
      availableDays: form.availableDays.includes(day)
        ? form.availableDays.filter((d) => d !== day)
        : [...form.availableDays, day],
    });
  };

  const days = [
    { en: "Tuesday", fr: "Mardi" },
    { en: "Thursday", fr: "Jeudi" },
  ];

  const getPaymentInfo = () => {
    if (registrationType === "referee") {
      return {
        title: language === "en" ? "Referee Payment" : "Paiement de l'Arbitre",
        amount: "$40-50",
        description: language === "en" ? "Per game (depending on location & experience)" : "Par match (selon le lieu et l'expérience)",
      };
    }
    return {
      title: language === "en" ? "Scorekeeper Payment" : "Paiement du Gardien de Pointage",
      amount: "$25",
      description: language === "en" ? "Per game" : "Par match",
    };
  };

  const paymentInfo = getPaymentInfo();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-foreground">
            {language === "en" ? "Referee & Scorekeeper Recruitment" : "Recrutement des Arbitres et Gardiens de Pointage"}
          </h1>
          <button
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
          >
            {language === "en" ? "FR" : "EN"}
          </button>
        </div>

        {/* Hero Section */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Users className="text-accent mt-1" size={32} />
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {language === "en" ? "Become a Referee" : "Devenez Arbitre"}
                  </h2>
                  <p className="text-foreground/80 text-sm mb-4">
                    {language === "en"
                      ? "Help manage our games and ensure fair play. We welcome referees of all experience levels."
                      : "Aidez à gérer nos matchs et assurez un jeu équitable. Nous accueillons les arbitres de tous les niveaux d'expérience."}
                  </p>
                  <Button
                    onClick={() => setRegistrationType("referee")}
                    className={`${registrationType === "referee" ? "bg-accent" : "bg-muted text-foreground"}`}
                  >
                    {language === "en" ? "Register as Referee" : "S'inscrire comme Arbitre"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <BarChart3 className="text-blue-600 mt-1" size={32} />
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {language === "en" ? "Become a Scorekeeper" : "Devenez Gardien de Pointage"}
                  </h2>
                  <p className="text-foreground/80 text-sm mb-4">
                    {language === "en"
                      ? "Keep track of scores and stats. Perfect for those who want to be involved without playing."
                      : "Suivez les scores et les statistiques. Parfait pour ceux qui veulent participer sans jouer."}
                  </p>
                  <Button
                    onClick={() => setRegistrationType("scorekeeper")}
                    className={`${registrationType === "scorekeeper" ? "bg-blue-600" : "bg-muted text-foreground"}`}
                  >
                    {language === "en" ? "Register as Scorekeeper" : "S'inscrire comme Gardien de Pointage"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {registrationType === "referee"
                    ? language === "en"
                      ? "Referee Registration"
                      : "Inscription de l'Arbitre"
                    : language === "en"
                    ? "Scorekeeper Registration"
                    : "Inscription du Gardien de Pointage"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">{language === "en" ? "First Name" : "Prénom"} *</Label>
                      <Input
                        id="firstName"
                        required
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        placeholder={language === "en" ? "John" : "Jean"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{language === "en" ? "Last Name" : "Nom de Famille"} *</Label>
                      <Input
                        id="lastName"
                        required
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        placeholder={language === "en" ? "Doe" : "Dupont"}
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">{language === "en" ? "Email" : "Courriel"} *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">{language === "en" ? "Phone" : "Téléphone"} *</Label>
                      <Input
                        id="phone"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <Label htmlFor="experience">
                      {language === "en" ? "Experience Level" : "Niveau d'Expérience"} *
                    </Label>
                    <Select value={form.experience} onValueChange={(value: any) => setForm({ ...form, experience: value })}>
                      <SelectTrigger id="experience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">{language === "en" ? "Beginner" : "Débutant"}</SelectItem>
                        <SelectItem value="intermediate">{language === "en" ? "Intermediate" : "Intermédiaire"}</SelectItem>
                        <SelectItem value="advanced">{language === "en" ? "Advanced" : "Avancé"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Available Days */}
                  <div>
                    <Label>{language === "en" ? "Available Days" : "Jours Disponibles"} *</Label>
                    <div className="space-y-2 mt-2">
                      {days.map((day) => (
                        <div key={day.en} className="flex items-center gap-2">
                          <Checkbox
                            id={day.en}
                            checked={form.availableDays.includes(day.en)}
                            onCheckedChange={() => toggleDay(day.en)}
                          />
                          <Label htmlFor={day.en} className="cursor-pointer">
                            {language === "en" ? day.en : day.fr}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desired Salary */}
                  <div>
                    <Label htmlFor="desiredSalary">{language === "en" ? "Desired Payment Per Game (Optional)" : "Paiement Désiré par Match (Optionnel)"}</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-semibold">$</span>
                      <Input
                        id="desiredSalary"
                        type="number"
                        min="0"
                        step="5"
                        value={form.desiredSalary}
                        onChange={(e) => setForm({ ...form, desiredSalary: e.target.value })}
                        placeholder={language === "en" ? "e.g., 45" : "ex. 45"}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === "en" ? "Referees: $40-50, Scorekeepers: $25" : "Arbitres: 40-50 $, Gardiens de pointage: 25 $"}
                    </p>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <Label htmlFor="notes">{language === "en" ? "Additional Notes (Optional)" : "Notes Supplémentaires (Optionnel)"}</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder={language === "en" ? "Tell us about your experience..." : "Parlez-nous de votre expérience..."}
                      rows={3}
                    />
                  </div>

                  {/* Waiver */}
                  <div className="border-t pt-6 space-y-4">
                    <div className="bg-accent/10 border border-accent/30 rounded p-4">
                      <p className="text-sm text-foreground font-semibold mb-2">
                        {language === "en" ? "Liability Waiver" : "Décharge de Responsabilité"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === "en"
                          ? "I acknowledge that officiating ice hockey involves inherent risks. I assume all risks and waive any claims against MIHL."
                          : "Je reconnais que l'arbitrage du hockey sur glace comporte des risques inhérents. J'assume tous les risques et renonce à toute réclamation contre la MIHL."}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="waiverSignature">{language === "en" ? "Digital Signature" : "Signature Numérique"} *</Label>
                      <Input
                        id="waiverSignature"
                        required
                        value={form.waiverSignature}
                        onChange={(e) => setForm({ ...form, waiverSignature: e.target.value })}
                        placeholder={language === "en" ? "Type your full name" : "Tapez votre nom complet"}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="waiverSigned"
                        checked={form.waiverSigned}
                        onCheckedChange={(checked) => setForm({ ...form, waiverSigned: checked as boolean })}
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
              </CardContent>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            {/* Payment Info */}
            <Card className="border-accent/30 bg-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign size={20} className="text-accent" />
                  {paymentInfo.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{language === "en" ? "Payment Amount" : "Montant du Paiement"}</p>
                  <p className="text-3xl font-bold text-accent">{paymentInfo.amount}</p>
                </div>
                <div className="border-t border-accent/20 pt-3">
                  <p className="text-sm text-muted-foreground">{paymentInfo.description}</p>
                </div>
                <div className="bg-background rounded p-3 border border-accent/20">
                  <p className="text-xs text-foreground">
                    <strong>{language === "en" ? "Payment Method:" : "Méthode de Paiement:"}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === "en"
                      ? "E-transfer to your account after each game"
                      : "Virement électronique à votre compte après chaque match"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={20} />
                  {language === "en" ? "Game Schedule" : "Horaire des Matchs"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{language === "en" ? "Tuesday Games" : "Matchs du Mardi"}</p>
                  <p className="font-semibold text-foreground">9:30 PM - 11:00 PM</p>
                  <p className="text-xs text-muted-foreground">Samuel Moscovitch Arena</p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground">{language === "en" ? "Thursday Games" : "Matchs du Jeudi"}</p>
                  <p className="font-semibold text-foreground">10:00 PM - 11:20 PM</p>
                  <p className="text-xs text-muted-foreground">Outremont Arena</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>{language === "en" ? "Questions?" : "Des Questions?"}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  {language === "en" ? "Contact us at:" : "Contactez-nous à:"}
                </p>
                <p className="font-semibold text-foreground">registration@mihl.ca</p>
                <p className="font-semibold text-foreground">514-965-2842</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
