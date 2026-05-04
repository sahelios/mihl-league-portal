import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, MapPin, Clock, Languages, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Schedule() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);

  // tRPC Queries
  const { data: games, isLoading: loadingGames } = trpc.league.getGames.useQuery();
  const { data: teams, isLoading: loadingTeams } = trpc.league.getTeams.useQuery();

  // Filtering and Sorting
  const filteredGames = useMemo(() => {
    if (!games) return [];

    let filtered = games;

    // Filter by team
    if (teamFilter !== "all") {
      filtered = filtered.filter(
        (g) => g.teamAName === teamFilter || g.teamBName === teamFilter
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((g) => g.status === statusFilter);
    }

    // Sort by date (assuming ISO string format YYYY-MM-DD, newest/upcoming first)
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
      return dateA - dateB; 
    });
  }, [games, teamFilter, statusFilter]);

  // Helper to format date to user locale
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(language === "en" ? "en-CA" : "fr-CA", options);
  };

  // Helper for status badge styling
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/25">
            {language === "en" ? "Completed" : "Terminé"}
          </Badge>
        );
      case "in progress":
        return (
          <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/20 hover:bg-orange-500/25">
            <Activity className="h-3 w-3 mr-1 animate-pulse" />
            {language === "en" ? "In Progress" : "En Cours"}
          </Badge>
        );
      case "scheduled":
      default:
        return (
          <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/20 hover:bg-blue-500/25">
            {language === "en" ? "Scheduled" : "Prévu"}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {language === "en" ? "League Schedule" : "Calendrier de la Ligue"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "en" 
                ? "View upcoming games and past results" 
                : "Voir les matchs à venir et les résultats passés"}
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

        {/* Filters */}
        <Card className="mb-8 border-border bg-card">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {language === "en" ? "Filter by Team" : "Filtrer par Équipe"}
              </label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={language === "en" ? "All Teams" : "Toutes les équipes"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === "en" ? "All Teams" : "Toutes les équipes"}
                  </SelectItem>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {language === "en" ? "Filter by Status" : "Filtrer par Statut"}
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={language === "en" ? "All Statuses" : "Tous les statuts"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "en" ? "All" : "Tous"}</SelectItem>
                  <SelectItem value="scheduled">{language === "en" ? "Scheduled" : "Prévu"}</SelectItem>
                  <SelectItem value="in progress">{language === "en" ? "In Progress" : "En Cours"}</SelectItem>
                  <SelectItem value="completed">{language === "en" ? "Completed" : "Terminé"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Games List */}
        <div className="space-y-4">
          {loadingGames || loadingTeams ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>{language === "en" ? "Loading schedule..." : "Chargement du calendrier..."}</p>
            </div>
          ) : filteredGames.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                {language === "en" ? "No games found matching your filters." : "Aucun match trouvé pour ces filtres."}
              </CardContent>
            </Card>
          ) : (
            filteredGames.map((game) => (
              <Card key={game.id} className="border-border bg-card overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30 p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{formatDate(game.date)}</span>
                    </div>
                    {game.time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{game.time}</span>
                      </div>
                    )}
                    {game.venue && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{game.venue}</span>
                      </div>
                    )}
                  </div>
                  {getStatusBadge(game.status)}
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Team A */}
                    <div className="flex-1 text-center md:text-right">
                      <h3 className="text-xl font-bold text-foreground">{game.teamAName}</h3>
                    </div>

                    {/* Score / Divider */}
                    <div className="flex-shrink-0 px-6 py-3 bg-muted rounded-lg border border-border min-w-[120px] text-center">
                      {game.status === "scheduled" ? (
                        <span className="text-xl font-bold text-muted-foreground tracking-widest">VS</span>
                      ) : (
                        <div className="text-3xl font-black text-foreground">
                          {game.teamAScore ?? 0} <span className="text-muted-foreground opacity-50 mx-1">-</span> {game.teamBScore ?? 0}
                        </div>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold text-foreground">{game.teamBName}</h3>
                    </div>
                  </div>

                  {/* Expandable Details Button */}
                  {(game.scorers || game.assists || game.attendance) && (
                    <div className="border-t border-border">
                      <Button
                        variant="ghost"
                        className="w-full rounded-none h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        onClick={() => setExpandedGameId(expandedGameId === game.id ? null : game.id)}
                      >
                        {expandedGameId === game.id ? (
                          <>
                            {language === "en" ? "Hide Details" : "Masquer les détails"}
                            <ChevronUp className="ml-2 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            {language === "en" ? "View Game Details" : "Voir les détails du match"}
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Expanded Content */}
                  {expandedGameId === game.id && (
                    <div className="bg-muted/20 p-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      {game.scorers && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary p-1 rounded">🏒</span>
                            {language === "en" ? "Goals" : "Buts"}
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">
                            {game.scorers}
                          </p>
                        </div>
                      )}
                      
                      {game.assists && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary p-1 rounded">🤝</span>
                            {language === "en" ? "Assists" : "Aides"}
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">
                            {game.assists}
                          </p>
                        </div>
                      )}

                      {game.attendance && (
                        <div className="md:col-span-2 mt-2 pt-4 border-t border-border/50">
                          <p className="text-muted-foreground text-xs">
                            <span className="font-medium text-foreground">
                              {language === "en" ? "Attendance/Notes: " : "Présences/Notes : "}
                            </span>
                            {game.attendance}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}