import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function RefereeScorekeeperApplication() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", interacEmail: "",
    role: "referee" as "referee" | "scorekeeper",
    isCertified: false, certifications: [] as string[],
    yearsOfExperience: 0, hockeyLevels: [] as string[],
    desiredPayPerGame: "" as string
  });

  const mutation = trpc.referee.submitApplication.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Application submitted!" : "Candidature soumise!");
      setForm({
        firstName: "", lastName: "", email: "", phone: "", interacEmail: "",
        role: "referee", isCertified: false, certifications: [],
        yearsOfExperience: 0, hockeyLevels: [],
        desiredPayPerGame: ""
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCheckboxArray = (field: "certifications" | "hockeyLevels", value: string) => {
    setForm(prev => {
      const current = prev[field];
      const updated = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.interacEmail || !form.desiredPayPerGame) {
      toast.error(language === "en" ? "Please fill all required fields" : "Veuillez remplir tous les champs");
      return;
    }
    await mutation.mutateAsync(form);
  };

  const certificationOptions = ["IIHF", "Hockey Canada", "USA Hockey", "Other"];
  const levelOptions = ["U15", "U18", "Junior", "Beer League", "Other"];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
            {language === "en" ? "FR" : "EN"}
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">
              {language === "en" ? "Join Our Staff" : "Rejoignez Notre Équipe"}
            </CardTitle>
            <p className="text-muted-foreground">
              {language === "en" ? "Apply as a Referee or Scorekeeper" : "Postulez comme arbitre ou marqueur"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "en" ? "First Name*" : "Prénom*"}</Label>
                  <Input required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{language === "en" ? "Last Name*" : "Nom de famille*"}</Label>
                  <Input required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{language === "en" ? "Email*" : "Courriel*"}</Label>
                  <Input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{language === "en" ? "Phone*" : "Téléphone*"}</Label>
                  <Input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === "en" ? "Interac E-Transfer Email*" : "Courriel pour virement Interac*"}</Label>
                <Input type="email" required value={form.interacEmail} onChange={e => setForm({...form, interacEmail: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "en" ? "Role" : "Rôle"}</Label>
                  <Select value={form.role} onValueChange={(v: "referee" | "scorekeeper") => setForm({...form, role: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="referee">{language === "en" ? "Referee" : "Arbitre"}</SelectItem>
                      <SelectItem value="scorekeeper">{language === "en" ? "Scorekeeper" : "Marqueur"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "en" ? "Years of Experience" : "Années d'expérience"}</Label>
                  <Input type="number" min="0" value={form.yearsOfExperience} onChange={e => setForm({...form, yearsOfExperience: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              {form.role === "referee" && (
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="certified" checked={form.isCertified} onCheckedChange={(c) => setForm({...form, isCertified: c === true})} />
                    <Label htmlFor="certified">{language === "en" ? "I am certified" : "Je suis certifié(e)"}</Label>
                  </div>
                  
                  {form.isCertified && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">{language === "en" ? "Select Certifications:" : "Sélectionnez les certifications :"}</Label>
                      <div className="flex flex-wrap gap-4">
                        {certificationOptions.map(cert => (
                          <div key={cert} className="flex items-center space-x-2">
                            <Checkbox id={`cert-${cert}`} checked={form.certifications.includes(cert)} onCheckedChange={() => handleCheckboxArray("certifications", cert)} />
                            <Label htmlFor={`cert-${cert}`}>{cert}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>{language === "en" ? "Desired Payment Per Game" : "Rémunération souhaitée par match"} *</Label>
                <Input 
                  type="text" 
                  placeholder={language === "en" ? "e.g., $40-50" : "ex. 40-50 $"}
                  value={form.desiredPayPerGame} 
                  onChange={e => setForm({...form, desiredPayPerGame: e.target.value})} 
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{language === "en" ? "Experience Levels" : "Niveaux d'expérience"}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {levelOptions.map(level => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox id={`level-${level}`} checked={form.hockeyLevels.includes(level)} onCheckedChange={() => handleCheckboxArray("hockeyLevels", level)} />
                      <Label htmlFor={`level-${level}`}>{level}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === "en" ? "Submit Application" : "Soumettre la candidature"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}