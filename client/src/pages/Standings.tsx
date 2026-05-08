import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages, Shield, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Standings() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const { data: standings, isLoading } = trpc.league.getTeamStandings.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Shield className="h-8 w-8 text-accent" />
              {language === "en" ? "League Standings" : "Classement de la Ligue"}
            </h1>
            <p className="text-muted-foreground mt-1">{language === "en" ? "2026 Summer Season" : "Saison d'Été 2026"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
            <Languages className="mr-2 h-4 w-4" />{language === "en" ? "Français" : "English"}
          </Button>
        </div>

        <Card className="border-border overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="py-4 px-6 font-semibold w-16 text-center">#</th>
                    <th className="py-4 px-6 font-semibold">{language === "en" ? "Team" : "Équipe"}</th>
                    <th className="py-4 px-4 font-semibold text-center">GP</th>
                    <th className="py-4 px-4 font-semibold text-center">W</th>
                    <th className="py-4 px-4 font-semibold text-center">L</th>
                    <th className="py-4 px-4 font-semibold text-center">T</th>
                    <th className="py-4 px-4 font-semibold text-center text-accent bg-accent/5">PTS</th>
                    <th className="py-4 px-4 font-semibold text-center">GF</th>
                    <th className="py-4 px-4 font-semibold text-center">GA</th>
                    <th className="py-4 px-4 font-semibold text-center">DIFF</th>
                    <th className="py-4 px-6 font-semibold text-center">WIN%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {standings?.map((team, idx) => (
                    <tr key={team.id} className={`hover:bg-muted/50 transition-colors ${idx % 2 === 0 ? "bg-card" : "bg-muted/20"}`}>
                      <td className="py-4 px-6 text-center font-bold text-muted-foreground">{idx + 1}</td>
                      <td className="py-4 px-6 font-semibold flex items-center gap-3">
                        <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain rounded-full bg-muted/50 p-1" />
                        <span className="text-foreground">{team.name}</span>
                      </td>
                      <td className="py-4 px-4 text-center">{team.gp}</td>
                      <td className="py-4 px-4 text-center">{team.w}</td>
                      <td className="py-4 px-4 text-center">{team.l}</td>
                      <td className="py-4 px-4 text-center">{team.t}</td>
                      <td className="py-4 px-4 text-center font-bold text-accent bg-accent/5 text-lg">{team.pts}</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{team.gf}</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{team.ga}</td>
                      <td className={`py-4 px-4 text-center font-semibold ${team.gd > 0 ? "text-green-500" : team.gd < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                        {team.gd > 0 ? `+${team.gd}` : team.gd}
                      </td>
                      <td className="py-4 px-6 text-center text-muted-foreground">{team.winPct}</td>
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