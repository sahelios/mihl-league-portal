import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Languages, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";

// Type definition based on requirements and likely schema
interface Suspension {
  id: number;
  playerName: string;
  teamName?: string;
  reason: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  isActive: boolean;
  gamesRemaining?: number | null;
  nextEligibleGame?: string | null;
}

export default function Suspensions() {
  const [language, setLanguage] = useState<"en" | "fr">("en");

  // Fetch suspensions from the database[cite: 1]
  const { data: suspensionsData, isLoading, error } = trpc.admin.getActiveSuspensions.useQuery();

  // Process, sort (newest first), and separate suspensions
  const { activeSuspensions, pastSuspensions } = useMemo(() => {
    if (!suspensionsData) return { activeSuspensions: [], pastSuspensions: [] };

    const sortedData = [...suspensionsData].sort((a, b) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    return {
      activeSuspensions: sortedData.filter((s) => s.isActive),
      pastSuspensions: sortedData.filter((s) => !s.isActive),
    };
  }, [suspensionsData]);

  // Date formatting helper
  const formatDate = (dateValue: string | Date) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    return date.toLocaleDateString(language === "en" ? "en-US" : "fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Reusable card component for rendering a single suspension[cite: 8]
  const SuspensionCard = ({ suspension }: { suspension: Suspension }) => (
    <Card className="hover:shadow-md transition border-border bg-card">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-lg text-foreground leading-tight">
                {suspension.playerName}
              </p>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                {suspension.teamName || (language === "en" ? "Unknown Team" : "Équipe Inconnue")}
              </p>
            </div>
            {/* Red badge for Active, Gray badge for Past */}
            <Badge variant={suspension.isActive ? "destructive" : "secondary"} className="shrink-0">
              {suspension.isActive
                ? language === "en" ? "Active" : "Active"
                : language === "en" ? "Expired" : "Expirée"}
            </Badge>
          </div>

          <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <div className="sm:col-span-2">
              <span className="font-semibold text-muted-foreground mr-2">
                {language === "en" ? "Reason:" : "Raison :"}
              </span>
              <span className="text-foreground">{suspension.reason}</span>
            </div>
            
            <div>
              <span className="font-semibold text-muted-foreground mr-2">
                {language === "en" ? "Start Date:" : "Date de Début :"}
              </span>
              <span className="text-foreground">{formatDate(suspension.startDate)}</span>
            </div>

            {suspension.endDate && (
              <div>
                <span className="font-semibold text-muted-foreground mr-2">
                  {language === "en" ? "End Date:" : "Date de Fin :"}
                </span>
                <span className="text-foreground">{formatDate(suspension.endDate)}</span>
              </div>
            )}

            {suspension.isActive && (
              <div className="sm:col-span-2 mt-2 p-3 bg-destructive/10 rounded border border-destructive/20">
                <p className="font-semibold text-destructive mb-2">
                  {language === "en" ? "Suspension Details:" : "Détails de la Suspension :"}
                </p>
                <p className="text-sm text-foreground">
                  {language === "en" 
                    ? `Player is suspended for ${suspension.gamesRemaining || "unknown"} game(s).` 
                    : `Le joueur est suspendu pour ${suspension.gamesRemaining || "inconnu"} match(s).`}
                </p>
                {suspension.nextEligibleGame && (
                  <p className="text-sm text-foreground mt-1">
                    {language === "en" 
                      ? `Next eligible game: ${suspension.nextEligibleGame}` 
                      : `Prochain match autorisé : ${suspension.nextEligibleGame}`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 md:py-12 px-4">
        
        {/* Header & Language Toggle[cite: 1] */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {language === "en" ? "Disciplinary Suspensions" : "Suspensions Disciplinaires"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === "en" 
                ? "Official league records of player suspensions" 
                : "Dossiers officiels de la ligue sur les suspensions de joueurs"}
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

        {/* State Management (Loading/Error) */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <p className="text-muted-foreground font-medium">
              {language === "en" ? "Loading records..." : "Chargement des dossiers..."}
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-foreground font-medium text-center">
              {language === "en" ? "Failed to load suspensions." : "Échec du chargement des suspensions."}
              <br />
              <span className="text-sm text-muted-foreground">{error.message}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Active Suspensions Section[cite: 8] */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <h2 className="text-2xl font-bold text-foreground">
                  {language === "en" ? "Active Suspensions" : "Suspensions Actives"}
                </h2>
              </div>
              
              {activeSuspensions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeSuspensions.map(suspension => (
                    <SuspensionCard key={suspension.id} suspension={suspension} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed bg-muted/20">
                  <CardContent className="py-12 text-center">
                    <p className="text-lg font-semibold text-foreground">
                      {language === "en" 
                        ? "Hooray! No Active Suspensions." 
                        : "Hourra ! Aucune suspension active."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Past Suspensions Section[cite: 8] */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-foreground border-b border-border pb-2">
                {language === "en" ? "Past Suspensions" : "Suspensions Passées"}
              </h2>
              
              {pastSuspensions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastSuspensions.map(suspension => (
                    <SuspensionCard key={suspension.id} suspension={suspension} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed bg-muted/20">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    {language === "en" 
                      ? "No past suspensions recorded." 
                      : "Aucune suspension passée enregistrée."}
                  </CardContent>
                </Card>
              )}
            </section>

          </div>
        )}
      </div>
    </div>
  );
}