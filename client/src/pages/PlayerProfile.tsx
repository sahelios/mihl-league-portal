import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, Star, MapPin, Ruler, Weight, Languages, Shield, 
  Calendar, Activity, ArrowLeft, Users
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const getTeamColors = (teamName?: string) => {
  switch (teamName) {
    case "Iron Lions": return "from-blue-900 to-red-900";
    case "Golan Guards": return "from-green-900 to-slate-700";
    case "H Hammers": return "from-blue-900 to-blue-600";
    case "Schvitz Saints": return "from-purple-900 to-blue-800";
    default: return "from-slate-900 to-slate-800";
  }
};

export default function PlayerProfile() {
  const [match, params] = useRoute("/player/:id");
  const [language, setLanguage] = useState<"en" | "fr">("en");
  
  const playerId = params?.id ? parseInt(params.id, 10) : 0;

  const { data: profile, isLoading: isProfileLoading } = trpc.league.getPlayerProfile.useQuery({ id: playerId }, { enabled: !!playerId });
  const { data: stats, isLoading: isStatsLoading } = trpc.league.getPlayerStats.useQuery({ id: playerId }, { enabled: !!playerId });
  const { data: gameHistory, isLoading: isHistoryLoading } = trpc.league.getPlayerGameHistory.useQuery({ id: playerId, limit: 10 }, { enabled: !!playerId });
  const { data: teammates } = trpc.league.getPlayerTeammates.useQuery({ id: playerId }, { enabled: !!playerId });

  const isLoading = isProfileLoading || isStatsLoading || isHistoryLoading;

  const translatePosition = (pos?: string) => {
    if (!pos) return "--";
    const positions: Record<string, { en: string, fr: string }> = {
      forward: { en: "Forward", fr: "Attaquant" },
      defenseman: { en: "Defenseman", fr: "Défenseur" },
      goalie: { en: "Goalie", fr: "Gardien" },
    };
    return positions[pos.toLowerCase()] ? positions[pos.toLowerCase()][language] : pos;
  };

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="container max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-48 md:col-span-2 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <User className="h-24 w-24 text-muted-foreground mb-4 opacity-50" />
        <h1 className="text-3xl font-bold text-foreground mb-2">{language === "en" ? "Player Not Found" : "Joueur Introuvable"}</h1>
        <Link href="/teams"><Button><ArrowLeft className="mr-2 h-4 w-4" />{language === "en" ? "Back to Teams" : "Retour aux équipes"}</Button></Link>
      </div>
    );
  }

  const teamGradient = getTeamColors(profile.teamName);

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        
        <div className="flex justify-between items-center mb-6">
          <Link href="/teams">
            <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-accent">
              <ArrowLeft className="mr-2 h-4 w-4" />{language === "en" ? "Back to Teams" : "Retour aux équipes"}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
            <Languages className="mr-2 h-4 w-4" />{language === "en" ? "Français" : "English"}
          </Button>
        </div>

        {/* Hero Section */}
        <div className={`bg-gradient-to-r ${teamGradient} rounded-2xl p-6 md:p-10 text-white shadow-xl mb-8 relative overflow-hidden`}>
          <Shield className="absolute -right-10 -bottom-10 h-64 w-64 text-white opacity-5" />
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white/10 backdrop-blur-sm border-4 border-white/20 rounded-full flex items-center justify-center text-4xl font-bold shadow-inner shrink-0">
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </div>
            <div className="text-center md:text-left flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">{profile.firstName} {profile.lastName}</h1>
                <span className="text-2xl md:text-3xl text-white/70 font-bold mb-1">#{profile.jerseyNumber || "00"}</span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                <Badge variant="secondary" className="bg-white/20 text-white border-0">{translatePosition(profile.position)}</Badge>
                {profile.teamName && <Badge variant="secondary" className="bg-white/20 text-white border-0">{profile.teamName}</Badge>}
                {profile.isCaptain && <Badge className="bg-accent text-accent-foreground border-0">{language === "en" ? "Captain" : "Capitaine"}</Badge>}
              </div>
              <div className="mb-4">
                <p className="text-sm text-white/60 mb-1 font-semibold uppercase tracking-wider">{language === "en" ? "Skill Rating" : "Niveau de Compétence"}</p>
                <div className="flex items-center">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 md:w-5 md:h-5 ${i < Math.round(profile.rating || 0) ? "fill-yellow-400 text-yellow-400" : "fill-slate-600 text-slate-600"}`} />
                  ))}
                  <span className="ml-2 font-bold text-white">{profile.rating}/10</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Stats Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2"><Activity className="h-6 w-6 text-accent" />{language === "en" ? "Season Statistics" : "Statistiques de la Saison"}</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: language === "en" ? "GP" : "MJ", value: stats?.gamesPlayed || 0 },
                { label: "G", value: stats?.goals || 0 },
                { label: "A", value: stats?.assists || 0 },
                { label: "PTS", value: stats?.points || 0, highlight: true },
                { label: "+/-", value: stats?.plusMinus || 0 },
                { label: "PIM", value: stats?.pim || 0 },
              ].map((stat, idx) => (
                <Card key={idx} className={stat.highlight ? "border-accent shadow-sm" : ""}>
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">{stat.label}</p>
                    <p className={`text-2xl md:text-3xl font-black ${stat.highlight ? "text-accent" : "text-foreground"}`}>
                      {stat.value > 0 && stat.label === "+/-" ? "+" : ""}{stat.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Team Info Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2"><Shield className="h-6 w-6 text-accent" />{language === "en" ? "Team Information" : "Informations sur l'Équipe"}</h2>
            {profile.teamId ? (
              <Card className="h-[calc(100%-2.5rem)] hover:shadow-md transition">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <h3 className="text-xl font-bold text-foreground mb-1">{profile.teamName}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{language === "en" ? "Record" : "Fiche"}: <span className="font-semibold text-foreground">{profile.teamRecord}</span></p>
                    <Link href={`/teams`} className="w-full mb-4"><Button variant="outline" className="w-full">{language === "en" ? "View Team" : "Voir l'équipe"}</Button></Link>
                    <div className="w-full text-left">
                      <p className="text-sm font-semibold flex items-center gap-2 mb-2"><Users className="h-4 w-4" />{language === "en" ? "Teammates" : "Coéquipiers"}</p>
                      <ul className="text-sm space-y-1">
                        {teammates?.slice(0, 4).map(tm => (
                          <li key={tm.id} className="text-muted-foreground flex justify-between">
                            <Link href={`/player/${tm.id}`} className="hover:text-accent hover:underline">{tm.name}</Link>
                            <span>#{tm.number}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground"><p>{language === "en" ? "Free Agent" : "Agent Libre"}</p></Card>
            )}
          </div>
        </div>

        {/* Game History */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2"><Calendar className="h-6 w-6 text-accent" />{language === "en" ? "Recent Game History" : "Historique Récent"}</h2>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b text-muted-foreground">
                  <tr>
                    <th className="py-4 px-6 font-semibold uppercase">{language === "en" ? "Date" : "Date"}</th>
                    <th className="py-4 px-6 font-semibold uppercase">{language === "en" ? "Opponent" : "Adversaire"}</th>
                    <th className="py-4 px-6 font-semibold uppercase text-center">{language === "en" ? "Result" : "Résultat"}</th>
                    <th className="py-4 px-6 font-semibold uppercase text-center">G</th>
                    <th className="py-4 px-6 font-semibold uppercase text-center">A</th>
                    <th className="py-4 px-6 font-semibold uppercase text-center text-accent">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {gameHistory?.map((game, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-6 font-medium">{game.date}</td>
                      <td className="py-3 px-6">{game.opponent}</td>
                      <td className="py-3 px-6 text-center">
                        <Badge variant="outline" className={game.result === 'W' ? 'text-green-600 border-green-200 bg-green-500/10' : 'text-red-600 border-red-200 bg-red-500/10'}>
                          {game.result} {game.score}
                        </Badge>
                      </td>
                      <td className="py-3 px-6 text-center">{game.goals}</td>
                      <td className="py-3 px-6 text-center">{game.assists}</td>
                      <td className="py-3 px-6 text-center font-bold text-accent">{game.goals + game.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}