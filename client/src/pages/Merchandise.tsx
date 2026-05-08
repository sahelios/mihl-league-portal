import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Languages, CheckCircle, BellRing, Shirt } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// Mock data structure for the jersey designs
const JERSEY_DESIGNS = [
  {
    id: "classic",
    name: { en: "Classic Navy", fr: "Marine Classique" },
    description: { en: "Classic Navy with Silver trim", fr: "Marine classique avec bordure argentée" },
    imageUrl: "https://placehold.co/600x600/0a192f/c0c0c0?text=Classic+Navy",
  },
  {
    id: "modern",
    name: { en: "Modern Gold", fr: "Or Moderne" },
    description: { en: "Modern Navy with Gold accents", fr: "Marine moderne avec accents dorés" },
    imageUrl: "https://placehold.co/600x600/0a192f/ffd700?text=Modern+Gold",
  },
  {
    id: "retro",
    name: { en: "Retro Stripes", fr: "Rayures Rétro" },
    description: { en: "Retro Navy with White stripes", fr: "Marine rétro avec rayures blanches" },
    imageUrl: "https://placehold.co/600x600/0a192f/ffffff?text=Retro+Stripes",
  },
  {
    id: "contemporary",
    name: { en: "Contemporary Red", fr: "Rouge Contemporain" },
    description: { en: "Contemporary Navy with Red accents", fr: "Marine contemporain avec accents rouges" },
    imageUrl: "https://placehold.co/600x600/0a192f/ff0000?text=Contemporary+Red",
  },
];

export default function Merchandise() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [hasVoted, setHasVoted] = useState(false);
  const [votedDesignId, setVotedDesignId] = useState<string | null>(null);
  
  // Notification form state
  const [email, setEmail] = useState("");
  const [notifyConsent, setNotifyConsent] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const utils = trpc.useUtils();

  // Initialize vote status from local storage
  useEffect(() => {
    const storedVote = localStorage.getItem("mihl_jersey_vote");
    if (storedVote) {
      setHasVoted(true);
      setVotedDesignId(storedVote);
    }
  }, []);

  // tRPC Queries
  const { data: votesData, isLoading: isLoadingVotes } = trpc.merchandise.getVotes.useQuery();
  const { data: notificationData } = trpc.merchandise.getNotificationCount.useQuery();

  // tRPC Mutations
  const submitVoteMutation = trpc.merchandise.submitVote.useMutation({
    onSuccess: (_, variables) => {
      toast.success(language === "en" ? "Thank you for voting!" : "Merci d'avoir voté !");
      setHasVoted(true);
      setVotedDesignId(variables.designId);
      localStorage.setItem("mihl_jersey_vote", variables.designId);
      utils.merchandise.getVotes.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const signupMutation = trpc.merchandise.signupNotification.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "You've been added to the waitlist!" : "Vous avez été ajouté à la liste d'attente !");
      setEmail("");
      setNotifyConsent(false);
      utils.merchandise.getNotificationCount.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Calculate vote totals and percentages
  const { totalVotes, votesMap } = useMemo(() => {
    if (!votesData) return { totalVotes: 0, votesMap: {} as Record<string, number> };
    
    let total = 0;
    const map: Record<string, number> = {};
    
    // Assuming votesData is an array like [{ id: "classic", count: 10 }, ...]
    votesData.forEach((v: { id: string, count: number }) => {
      map[v.id] = v.count;
      total += v.count;
    });
    
    return { totalVotes: total, votesMap: map };
  }, [votesData]);

  // Handlers
  const handleVote = (designId: string) => {
    if (hasVoted) return;
    submitVoteMutation.mutate({ designId });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !notifyConsent) {
      toast.error(language === "en" ? "Please provide your email and consent." : "Veuillez fournir votre courriel et votre consentement.");
      return;
    }
    
    setIsSubmittingEmail(true);
    await signupMutation.mutateAsync({ email });
    setIsSubmittingEmail(false);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Hero Section */}
      <div className="bg-muted/30 border-b border-border py-12 mb-12">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 flex items-center gap-3">
              <Shirt className="h-10 w-10 text-accent" />
              {language === "en" ? "Jersey & Merchandise" : "Chandails & Marchandise"}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              {language === "en" 
                ? "Help shape the identity of the MIHL! Vote on our inaugural season jersey design and sign up for merch drops." 
                : "Aidez à façonner l'identité de la MIHL ! Votez pour le design de notre chandail inaugural et inscrivez-vous pour les nouveautés."}
            </p>
          </div>
          <Button variant="outline" onClick={() => setLanguage(language === "en" ? "fr" : "en")} className="shrink-0">
            <Languages className="mr-2 h-4 w-4" />
            {language === "en" ? "Français" : "English"}
          </Button>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 space-y-16">
        
        {/* Jersey Poll Section */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {language === "en" ? "Help us choose the perfect jersey!" : "Aidez-nous à choisir le chandail parfait !"}
            </h2>
            <p className="text-muted-foreground">
              {language === "en" 
                ? "Select your favorite design below. The winning design will be worn during the 2026 season." 
                : "Sélectionnez votre design préféré ci-dessous. Le design gagnant sera porté lors de la saison 2026."}
            </p>
          </div>

          {isLoadingVotes ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {JERSEY_DESIGNS.map((design) => {
                const votes = votesMap[design.id] || 0;
                // Add an optimistic vote count if the user just voted for this one
                const displayVotes = (votedDesignId === design.id && !votesData?.some((v: any) => v.id === design.id)) ? votes + 1 : votes;
                const effectiveTotal = (votedDesignId && !votesData?.some((v: any) => v.id === votedDesignId)) ? totalVotes + 1 : totalVotes;
                const percentage = effectiveTotal > 0 ? Math.round((displayVotes / effectiveTotal) * 100) : 0;
                
                const isSelected = votedDesignId === design.id;

                return (
                  <Card key={design.id} className={`overflow-hidden transition-all duration-300 ${isSelected ? "ring-2 ring-accent shadow-lg" : "hover:shadow-md"}`}>
                    <div className="aspect-square bg-muted relative">
                      <img 
                        src={design.imageUrl} 
                        alt={design.name[language]} 
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-accent text-accent-foreground p-1 rounded-full shadow-sm">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">{design.name[language]}</CardTitle>
                      <CardDescription>{design.description[language]}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      {hasVoted ? (
                        <div className="space-y-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{displayVotes} {language === "en" ? "votes" : "votes"}</span>
                            <span className="font-bold text-accent">{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      ) : (
                        <div className="h-12" /> // Spacer to maintain consistent card height
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant={isSelected ? "secondary" : "default"}
                        disabled={hasVoted || submitVoteMutation.isPending}
                        onClick={() => handleVote(design.id)}
                      >
                        {submitVoteMutation.isPending && submitVoteMutation.variables?.designId === design.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        
                        {hasVoted 
                          ? isSelected 
                            ? (language === "en" ? "Voted!" : "Voté !") 
                            : (language === "en" ? "Thank you for voting" : "Merci d'avoir voté")
                          : (language === "en" ? "Vote for this design" : "Voter pour ce design")}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
          
          {hasVoted && (
            <div className="mt-8 text-center bg-accent/10 border border-accent/20 p-4 rounded-lg max-w-2xl mx-auto">
              <p className="text-foreground font-medium">
                {language === "en" 
                  ? "🎉 Your vote has been recorded! Thanks for participating." 
                  : "🎉 Votre vote a été enregistré ! Merci de votre participation."}
              </p>
            </div>
          )}
        </section>

        {/* Merchandise Coming Soon Section */}
        <section className="max-w-3xl mx-auto pt-8">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-muted p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <BellRing className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">
                {language === "en" ? "Merchandise Coming Soon!" : "Marchandise à venir bientôt !"}
              </CardTitle>
              <CardDescription className="text-base pt-2">
                {language === "en" 
                  ? "We're working on a line of high-quality MIHL apparel including hats, hoodies, and replica jerseys. Sign up to be the first to know when our shop goes live." 
                  : "Nous travaillons sur une ligne de vêtements MIHL de haute qualité comprenant des casquettes, des sweats à capuche et des répliques de chandails. Inscrivez-vous pour être le premier informé de l'ouverture de notre boutique."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-6 max-w-md mx-auto mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{language === "en" ? "Email Address" : "Adresse Courriel"}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    placeholder="fan@mihl.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="notifyConsent" 
                    checked={notifyConsent}
                    onCheckedChange={(checked) => setNotifyConsent(!!checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="notifyConsent" className="font-normal text-sm leading-snug cursor-pointer">
                    {language === "en" 
                      ? "Notify me when merchandise becomes available. I agree to receive marketing emails from MIHL." 
                      : "Avertissez-moi lorsque la marchandise sera disponible. J'accepte de recevoir des courriels promotionnels de la MIHL."}
                  </Label>
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmittingEmail || !notifyConsent || !email}>
                  {isSubmittingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {language === "en" ? "Get Notified" : "Être Notifié"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center border-t border-border pt-6 pb-6">
              <Badge variant="secondary" className="px-4 py-1 text-sm font-medium">
                🔥 {notificationData?.count || 0} {language === "en" ? "fans are waiting for merch!" : "fans attendent la marchandise !"}
              </Badge>
            </CardFooter>
          </Card>
        </section>

      </div>
    </div>
  );
}