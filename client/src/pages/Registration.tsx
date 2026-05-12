import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

type RegistrationStep = "signup" | "league-registration";

export default function Registration() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<RegistrationStep>(user ? "league-registration" : "signup");
  
  // Signup form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  
  // League registration form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [evaluationDate, setEvaluationDate] = useState("");
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [registrationType, setRegistrationType] = useState("player");
  const [agreeToWaiver, setAgreeToWaiver] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "fr">("en");
  
  // tRPC mutations
  const signupMutation = trpc.auth.signup.useMutation();
  const registerMutation = trpc.registration.register.useMutation();
  const evaluationCapacityQuery = trpc.registration.getEvaluationCapacity.useQuery();
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error(language === "en" ? "Passwords do not match" : "Les mots de passe ne correspondent pas");
      return;
    }
    
    if (password.length < 6) {
      toast.error(language === "en" ? "Password must be at least 6 characters" : "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    setIsLoading(true);
    try {
      await signupMutation.mutateAsync({
        email,
        password,
        name: name || undefined,
      });
      
      toast.success(language === "en" ? "Account created! Proceeding to league registration..." : "Compte créé! Passage à l'inscription à la ligue...");
      setStep("league-registration");
      setFirstName(name);
    } catch (error: any) {
      toast.error(error.message || (language === "en" ? "Signup failed" : "L'inscription a échoué"));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLeagueRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !phone || !evaluationDate) {
      toast.error(language === "en" ? "Please fill in all required fields" : "Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    if (!agreeToWaiver) {
      toast.error(language === "en" ? "You must agree to the waiver" : "Vous devez accepter la décharge");
      return;
    }
    
    setIsLoading(true);
    try {
      await registerMutation.mutateAsync({
        firstName,
        lastName,
        email: user?.email || email,
        phone,
        evaluationDate: new Date(evaluationDate),
        isFirstTime,
        registrationType: registrationType as "player" | "referee" | "scorekeeper",
      });
      
      toast.success(language === "en" ? "Registration complete! You will receive a confirmation email shortly." : "Inscription complète! Vous recevrez un e-mail de confirmation bientôt.");
      
      // Reset form
      setFirstName("");
      setLastName("");
      setPhone("");
      setEvaluationDate("");
      setIsFirstTime(false);
      setRegistrationType("player");
      setAgreeToWaiver(false);
    } catch (error: any) {
      toast.error(error.message || (language === "en" ? "Registration failed" : "L'inscription a échoué"));
    } finally {
      setIsLoading(false);
    }
  };
  
  if (step === "signup" && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
            >
              {language === "en" ? "FR" : "EN"}
            </button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Create Your Account" : "Créer Votre Compte"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="name">{language === "en" ? "Full Name (Optional)" : "Nom Complet (Optionnel)"}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={language === "en" ? "John Doe" : "Jean Dupont"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">{language === "en" ? "Email" : "E-mail"}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">{language === "en" ? "Password" : "Mot de passe"}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={language === "en" ? "At least 6 characters" : "Au moins 6 caractères"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">{language === "en" ? "Confirm Password" : "Confirmer le Mot de passe"}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={language === "en" ? "Confirm your password" : "Confirmez votre mot de passe"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === "en" ? "Create Account" : "Créer un Compte"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{language === "en" ? "League Registration" : "Inscription à la Ligue"}</h1>
          <button
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
          >
            {language === "en" ? "FR" : "EN"}
          </button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{language === "en" ? "Complete Your Registration" : "Complétez Votre Inscription"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLeagueRegistration} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{language === "en" ? "First Name" : "Prénom"} *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{language === "en" ? "Last Name" : "Nom de Famille"} *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">{language === "en" ? "Email" : "E-mail"}</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || email}
                  disabled
                />
              </div>
              
              <div>
                <Label htmlFor="phone">{language === "en" ? "Phone Number" : "Numéro de Téléphone"} *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="registrationType">{language === "en" ? "Registration Type" : "Type d'Inscription"} *</Label>
                <Select value={registrationType} onValueChange={setRegistrationType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">{language === "en" ? "Player ($350)" : "Joueur ($350)"}</SelectItem>
                    <SelectItem value="referee">{language === "en" ? "Referee" : "Arbitre"}</SelectItem>
                    <SelectItem value="scorekeeper">{language === "en" ? "Scorekeeper" : "Gardien de Pointage"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-sm mb-2 text-amber-900">{language === "en" ? "Payment Agreement" : "Accord de Paiement"}</h3>
                <p className="text-sm text-amber-800 mb-3">
                  {language === "en" 
                    ? "I agree to make my payment via e-transfer to payments@mihl.ca in the next 48 hours or will forfeit my spot in the league. For payment arrangements call the league at 514-965-2842 or send an email to registration@mihl.ca"
                    : "J'accepte de faire mon paiement par virement electronique a payments@mihl.ca dans les 48 prochaines heures ou je perdrai ma place dans la ligue. Pour les arrangements de paiement, appelez la ligue au 514-965-2842 ou envoyez un e-mail a registration@mihl.ca"}
                </p>
              </div>
              
              {registrationType === "player" && (
                <>
                  <div>
                    <Label htmlFor="evaluationDate">{language === "en" ? "Evaluation Game Date" : "Date du Jeu d'Évaluation"} *</Label>
                    <Select value={evaluationDate} onValueChange={setEvaluationDate}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "en" ? "Select evaluation game" : "Sélectionner un jeu d'évaluation"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2026-06-23">JUN 23 @ 9:30 PM - Samuel Moscovitch Arena</SelectItem>
                        <SelectItem value="2026-06-25">JUN 25 @ 10:00 PM - Outremont Arena</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFirstTime"
                      checked={isFirstTime}
                      onCheckedChange={(checked) => setIsFirstTime(checked as boolean)}
                    />
                    <Label htmlFor="isFirstTime" className="font-normal cursor-pointer">
                      {language === "en" ? "This is my first time playing in the MIHL" : "C'est ma première fois à jouer dans la MIHL"}
                    </Label>
                  </div>
                </>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-sm mb-2">{language === "en" ? "Waiver Agreement" : "Accord de Décharge"}</h3>
                <p className="text-sm text-slate-600 mb-4">
                  {language === "en" 
                    ? "By registering, you agree to the MIHL waiver and release of liability. You acknowledge that ice hockey is a contact sport with inherent risks."
                    : "En vous inscrivant, vous acceptez la décharge et la libération de responsabilité de la MIHL. Vous reconnaissez que le hockey sur glace est un sport de contact avec des risques inhérents."}
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="waiver"
                    checked={agreeToWaiver}
                    onCheckedChange={(checked) => setAgreeToWaiver(checked as boolean)}
                  />
                  <Label htmlFor="waiver" className="font-normal cursor-pointer text-sm">
                    {language === "en" 
                      ? "I agree to the waiver and release of liability"
                      : "J'accepte la décharge et la libération de responsabilité"} *
                  </Label>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === "en" ? "Complete Registration" : "Complétez l'Inscription"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
