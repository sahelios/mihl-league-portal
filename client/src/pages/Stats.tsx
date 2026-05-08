import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trophy, Languages, Filter, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function Stats() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [activeTab, setActiveTab] = useState<"points" | "goals" | "assists">("points");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [posFilter, setPosFilter] = useState("all");

  const { data: stats, isLoading } = trpc.league.getLeaderboard.useQuery({
    stat: activeTab,
    limit: 20,
    search,
    team: teamFilter,
    position: posFilter
  });

  const getRankStyle = (idx: number) => {
    if (idx === 0) return "bg-yellow-500/10 border-yellow-500 text-yellow-600";
    if (idx === 1) return "bg-slate-400/10 border-slate-400 text-slate-500";
    if (idx === 2) return "bg-amber-700/10 border-amber-700 text-amber-700";
    return "bg-muted border-transparent text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Trophy className="h-8 w-8 text-accent" />
              {language === "en" ? "League Leaders" : "Meneurs de la Ligue"}
            </h1>
            <p className="text-muted-foreground mt-1">{language === "en" ? "2026 Summer Season Statistics" : "Statistiques de la Saison d'Été 2026"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
            <Languages className="mr-2 h-4 w-4" />{language === "en" ? "Français" : "English"}
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>{language === "en" ? "Search Player" : "Rechercher un joueur"}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === "en" ? "Team" : "Équipe"}</Label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "en" ? "All Teams" : "Toutes les équipes"}</SelectItem>
                  <SelectItem value="Iron Lions">Iron Lions</SelectItem>
                  <SelectItem value="Golan Guards">Golan Guards</SelectItem>
                  <SelectItem value="H Hammers">H Hammers</SelectItem>
                  <SelectItem value="Schvitz Saints">Schvitz Saints</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === "en" ? "Position" : "Position"}</Label>
              <Select value={posFilter} onValueChange={setPosFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "en" ? "All" : "Toutes"}</SelectItem>
                  <SelectItem value="forward">{language === "en" ? "Forwards" : "Attaquants"}</SelectItem>
                  <SelectItem value="defenseman">{language === "en" ? "Defensemen" : "Défenseurs"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 bg-muted p-1 rounded-lg">
              {["points", "goals", "assists"].map((tab) => (
                <Button 
                  key={tab} 
                  variant={activeTab === tab ? "default" : "ghost"} 
                  className="flex-1 capitalize" 
                  onClick={() => setActiveTab(tab as any)}
                >
                  {language === "en" ? tab : (tab === "points" ? "Points" : tab === "goals" ? "Buts" : "Passes")}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="py-4 px-6 font-semibold w-16">#</th>
                    <th className="py-4 px-6 font-semibold">{language === "en" ? "Player" : "Joueur"}</th>
                    <th className="py-4 px-6 font-semibold">{language === "en" ? "Team" : "Équipe"}</th>
                    <th className="py-4 px-6 font-semibold text-center">GP</th>
                    <th className={`py-4 px-6 font-semibold text-center ${activeTab === "goals" ? "text-accent bg-accent/5" : ""}`}>G</th>
                    <th className={`py-4 px-6 font-semibold text-center ${activeTab === "assists" ? "text-accent bg-accent/5" : ""}`}>A</th>
                    <th className={`py-4 px-6 font-semibold text-center ${activeTab === "points" ? "text-accent bg-accent/5" : ""}`}>PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats?.map((stat, idx) => (
                    <tr key={stat.id} className="hover:bg-muted/30 transition">
                      <td className="py-3 px-6">
                        <Badge variant="outline" className={`font-bold w-8 flex justify-center ${getRankStyle(idx)}`}>{idx + 1}</Badge>
                      </td>
                      <td className="py-3 px-6 font-semibold">
                        <Link href={`/player/${stat.id}`} className="hover:text-accent hover:underline">{stat.name}</Link>
                      </td>
                      <td className="py-3 px-6 text-muted-foreground">{stat.team}</td>
                      <td className="py-3 px-6 text-center">{stat.gamesPlayed}</td>
                      <td className={`py-3 px-6 text-center ${activeTab === "goals" ? "font-bold text-accent bg-accent/5" : ""}`}>{stat.goals}</td>
                      <td className={`py-3 px-6 text-center ${activeTab === "assists" ? "font-bold text-accent bg-accent/5" : ""}`}>{stat.assists}</td>
                      <td className={`py-3 px-6 text-center ${activeTab === "points" ? "font-bold text-accent bg-accent/5" : ""}`}>{stat.points}</td>
                    </tr>
                  ))}
                  {stats?.length === 0 && (
                    <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">{language === "en" ? "No players found." : "Aucun joueur trouvé."}</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}