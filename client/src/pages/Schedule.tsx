import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, MapPin, Clock, Languages, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Schedule() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [statusTab, setStatusTab] = useState<"upcoming" | "completed" | "all">("all");
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

  // Fetch active season and all seasons
  const { data: activeSeason } = trpc.league.getActiveSeason.useQuery();
  const { data: allSeasons = [] } = trpc.admin.getSeasons.useQuery();

  // Set selected season to active season when it loads
  const effectiveSeasonId = selectedSeasonId || activeSeason?.id;

  const { data: games, isLoading: loadingGames } = trpc.league.getSchedule.useQuery(
    { status: statusTab, seasonId: effectiveSeasonId },
    { enabled: !!effectiveSeasonId }
  );
  // Assuming getTeams is available in your full router
  const { data: teams, isLoading: loadingTeams } = trpc.league.getTeams?.useQuery() || { data: [], isLoading: false };

  const filteredGames = useMemo(() => {
    if (!games) return [];
    let filtered = games;
    if (teamFilter !== "all") {
      filtered = filtered.filter((g) => g.teamAName === teamFilter || g.teamBName === teamFilter);
    }
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
      return statusTab === 'completed' ? dateB - dateA : dateA - dateB; 
    });
  }, [games, teamFilter, statusTab]);

  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(language === "en" ? "en-CA" : "fr-CA", options);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20">{language === "en" ? "Completed" : "Terminé"}</Badge>;
      case "in progress":
        return <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/20"><Activity className="h-3 w-3 mr-1 animate-pulse" />{language === "en" ? "In Progress" : "En Cours"}</Badge>;
      default:
        return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/20">{language === "en" ? "Upcoming" : "À venir"}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">{language === "en" ? "League Schedule" : "Calendrier de la Ligue"}</h1>
            <p className="text-muted-foreground mt-1">{language === "en" ? "View upcoming games and past results" : "Voir les matchs à venir et les résultats passés"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "fr" : "en")} className="flex items-center gap-2 shrink-0">
            <Languages className="h-4 w-4" />{language === "en" ? "Français" : "English"}
          </Button>
        </div>

        {/* Filters and Tabs */}
        <Card className="mb-8 border-border bg-card">
          <CardContent className="p-4 flex flex-col md:flex-row gap-6 justify-between items-center">
            {/* Season Selection */}
            <div className="w-full md:w-64 space-y-1">
              <Select value={String(selectedSeasonId || activeSeason?.id || "")} onValueChange={(val) => setSelectedSeasonId(Number(val))}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={language === "en" ? "Select Season" : "Sélectionner la saison"} />
                </SelectTrigger>
                <SelectContent>
                  {allSeasons?.map((season: any) => (
                    <SelectItem key={season.id} value={String(season.id)}>
                      {season.name} {season.isActive ? `(${language === "en" ? "Active" : "Actif"})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-muted p-1 rounded-lg w-full md:w-auto">
              {(["upcoming", "completed", "all"] as const).map((tab) => (
                <Button 
                  key={tab} 
                  variant={statusTab === tab ? "default" : "ghost"} 
                  className="flex-1 capitalize" 
                  onClick={() => setStatusTab(tab)}
                >
                  {language === "en" ? tab : (tab === "upcoming" ? "À venir" : tab === "completed" ? "Terminés" : "Tous")}
                </Button>
              ))}
            </div>

            <div className="w-full md:w-64 space-y-1">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={language === "en" ? "Filter by Team" : "Filtrer par équipe"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "en" ? "All Teams" : "Toutes les équipes"}</SelectItem>
                  {teams?.map((team: any) => (
                    <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                  ))}
                  {/* Fallbacks if db empty */}
                  <SelectItem value="Iron Lions">Iron Lions</SelectItem>
                  <SelectItem value="Golan Guards">Golan Guards</SelectItem>
                  <SelectItem value="H Hammers">H Hammers</SelectItem>
                  <SelectItem value="Schvitz Saints">Schvitz Saints</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Games List */}
        <div className="space-y-4">
          {loadingGames ? (
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
                    <div className="flex items-center gap-1 font-medium text-foreground">
                      <Calendar className="h-4 w-4 text-accent" /> {formatDate(game.date)}
                    </div>
                    {game.time && (
                      <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {game.time}</div>
                    )}
                    {game.venue && (
                      <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {game.venue}</div>
                    )}
                  </div>
                  {getStatusBadge(game.status)}
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1 text-center md:text-right">
                      <h3 className="text-xl font-bold text-foreground">{game.teamAName}</h3>
                    </div>
                    <div className="flex-shrink-0 px-6 py-3 bg-muted rounded-lg border border-border min-w-[120px] text-center">
                      {game.status === "upcoming" ? (
                        <span className="text-xl font-bold text-muted-foreground tracking-widest">VS</span>
                      ) : (
                        <div className="text-3xl font-black text-foreground">
                          {game.teamAScore ?? 0} <span className="text-muted-foreground opacity-50 mx-1">-</span> {game.teamBScore ?? 0}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold text-foreground">{game.teamBName}</h3>
                    </div>
                  </div>

                  {(game.scorers || game.assists) && (
                    <div className="border-t border-border">
                      <Button variant="ghost" className="w-full rounded-none h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50" onClick={() => setExpandedGameId(expandedGameId === game.id ? null : game.id)}>
                        {expandedGameId === game.id ? (
                          <>{language === "en" ? "Hide Details" : "Masquer les détails"} <ChevronUp className="ml-2 h-4 w-4" /></>
                        ) : (
                          <>{language === "en" ? "View Game Details" : "Voir les détails du match"} <ChevronDown className="ml-2 h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  )}

                  {expandedGameId === game.id && (
                    <div className="bg-muted/20 p-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      {game.scorers && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><span className="bg-accent/10 text-accent p-1 rounded">🏒</span> {language === "en" ? "Goals" : "Buts"}</h4>
                          <p className="text-muted-foreground leading-relaxed">{game.scorers}</p>
                        </div>
                      )}
                      {game.assists && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><span className="bg-accent/10 text-accent p-1 rounded">🤝</span> {language === "en" ? "Assists" : "Aides"}</h4>
                          <p className="text-muted-foreground leading-relaxed">{game.assists}</p>
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