import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Languages, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function Stats() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [activeTab, setActiveTab] = useState<"points" | "goals" | "assists">("points");

  const { data: stats, isLoading } = trpc.league.getLeaderboard.useQuery({ stat: activeTab });

  const getRankStyle = (idx: number) => {
    if (idx === 0) return "bg-yellow-500/10 border-yellow-500 text-yellow-600";
    if (idx === 1) return "bg-slate-400/10 border-slate-400 text-slate-500";
    if (idx === 2) return "bg-amber-600/10 border-amber-600 text-amber-700";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {language === "en" ? "League Leaders" : "Meneurs de la Ligue"}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
            <Languages className="mr-2 h-4 w-4" />{language === "en" ? "Français" : "English"}
          </Button>
        </div>

        <div className="flex gap-4 mb-6 border-b border-border pb-4">
          <Button variant={activeTab === "points" ? "default" : "outline"} onClick={() => setActiveTab("points")}>
            {language === "en" ? "Points" : "Points"}
          </Button>
          <Button variant={activeTab === "goals" ? "default" : "outline"} onClick={() => setActiveTab("goals")}>
            {language === "en" ? "Goals" : "Buts"}
          </Button>
          <Button variant={activeTab === "assists" ? "default" : "outline"} onClick={() => setActiveTab("assists")}>
            {language === "en" ? "Assists" : "Aides"}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="py-3 px-6">#</th>
                    <th className="py-3 px-6">{language === "en" ? "Player" : "Joueur"}</th>
                    <th className="py-3 px-6">{language === "en" ? "Team" : "Équipe"}</th>
                    <th className="py-3 px-6 text-center">GP</th>
                    <th className="py-3 px-6 text-center">G</th>
                    <th className="py-3 px-6 text-center">A</th>
                    <th className="py-3 px-6 text-center">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats?.map((stat, idx) => (
                    <tr key={stat.id} className="hover:bg-muted/30 transition">
                      <td className="py-3 px-6">
                        <Badge variant="outline" className={`font-bold w-8 flex justify-center ${getRankStyle(idx)}`}>{idx + 1}</Badge>
                      </td>
                      <td className="py-3 px-6 font-semibold">{stat.name}</td>
                      <td className="py-3 px-6 text-muted-foreground">{stat.team}</td>
                      <td className="py-3 px-6 text-center">{stat.gamesPlayed}</td>
                      <td className="py-3 px-6 text-center">{stat.goals}</td>
                      <td className="py-3 px-6 text-center">{stat.assists}</td>
                      <td className="py-3 px-6 text-center font-bold text-accent bg-accent/5">{stat.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}