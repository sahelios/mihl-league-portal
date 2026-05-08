import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Calendar, Languages, Printer, Info, Clock, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Playoffs() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [selectedMatchup, setSelectedMatchup] = useState<any | null>(null);

  const { data: bracketData } = trpc.league.getPlayoffBracket.useQuery();
  const { data: standingsData } = trpc.league.getPlayoffStandings.useQuery();

  const handlePrint = () => window.print();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20">{language === "en" ? "Final" : "Final"}</Badge>;
      case "in_progress":
        return <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/20">{language === "en" ? "In Progress" : "En cours"}</Badge>;
      case "scheduled":
      default:
        return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/20">{language === "en" ? "Scheduled" : "Prévu"}</Badge>;
    }
  };

  const MatchupCard = ({ matchup }: { matchup: any }) => {
    if (!matchup) return null;
    const t1Winner = matchup.winner === matchup.team1;
    const t2Winner = matchup.winner === matchup.team2;

    return (
      <Card 
        className="w-full sm:w-64 border-border bg-card hover:shadow-md transition-shadow cursor-pointer relative z-10 print:shadow-none print:border-gray-300"
        onClick={() => setSelectedMatchup(matchup)}
      >
        <CardHeader className="p-3 pb-0 bg-muted/30 border-b border-border flex flex-row justify-between items-center">
          <span className="text-xs font-semibold text-muted-foreground">{language === "en" ? "Game" : "Match"} {matchup.matchNumber}</span>
          {getStatusBadge(matchup.status)}
        </CardHeader>
        <CardContent className="p-0">
          <div className={`p-3 border-b border-border flex justify-between items-center ${t1Winner ? "bg-accent/10 font-bold" : ""}`}>
            <span className="truncate pr-2 flex items-center gap-2">{t1Winner && <CheckCircle2 className="h-4 w-4 text-accent" />} {matchup.team1}</span>
            <span className="font-mono text-lg">{matchup.team1Score}</span>
          </div>
          <div className={`p-3 flex justify-between items-center ${t2Winner ? "bg-accent/10 font-bold" : ""}`}>
            <span className="truncate pr-2 flex items-center gap-2">{t2Winner && <CheckCircle2 className="h-4 w-4 text-accent" />} {matchup.team2}</span>
            <span className="font-mono text-lg">{matchup.team2Score}</span>
          </div>
        </CardContent>
        {matchup.bestOf && (
          <div className="bg-muted text-center py-1 text-xs text-muted-foreground border-t border-border">
            {language === "en" ? `Best of ${matchup.bestOf} Series` : `Série 2 de ${matchup.bestOf}`}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Trophy className="h-8 w-8 text-accent" />
              {language === "en" ? "Playoff Bracket" : "Arbre des Séries"}
            </h1>
            <p className="text-muted-foreground mt-1">{language === "en" ? "Follow the road to the championship" : "Suivez la route vers le championnat"}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex">
              <Printer className="mr-2 h-4 w-4" />{language === "en" ? "Print Bracket" : "Imprimer"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
              <Languages className="mr-2 h-4 w-4" />{language === "en" ? "Français" : "English"}
            </Button>
          </div>
        </div>

        {/* Tournament Info */}
        <Card className="border-border bg-card print:border-none print:shadow-none">
          <CardContent className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">{language === "en" ? "Tournament" : "Tournoi"}</p>
              <p className="font-bold text-foreground">2026 MIHL Summer Cup</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">{language === "en" ? "Dates" : "Dates"}</p>
              <p className="font-bold text-foreground flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Aug 15 - Aug 25</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">{language === "en" ? "Format" : "Format"}</p>
              <p className="font-bold text-foreground">Single Elimination</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">{language === "en" ? "Current Round" : "Ronde Actuelle"}</p>
              <p className="font-bold text-accent">{language === "en" ? "Semi-Finals" : "Demi-finales"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Bracket Visualization */}
        <div className="overflow-x-auto pb-8 print:overflow-visible">
          <div className="min-w-[800px] flex justify-center items-center gap-12 py-8 relative">
            {/* Round 1 */}
            <div className="flex flex-col gap-16 relative">
              <div className="text-center mb-4 text-lg font-bold text-foreground absolute -top-12 w-full">{language === "en" ? "Semi-Finals" : "Demi-finales"}</div>
              <MatchupCard matchup={bracketData?.[0]} />
              <MatchupCard matchup={bracketData?.[1]} />
              <svg className="absolute top-1/2 left-full w-12 h-[calc(100%+4rem)] -translate-y-1/2 hidden md:block" style={{ pointerEvents: 'none' }}>
                <path d="M 0 20 L 24 20 L 24 calc(100% - 20px) L 0 calc(100% - 20px)" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
                <path d="M 24 50% L 48 50%" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
              </svg>
            </div>

            {/* Round 2 */}
            <div className="flex flex-col justify-center relative">
              <div className="text-center mb-4 text-lg font-bold text-accent absolute -top-12 w-full">{language === "en" ? "Championship" : "Championnat"}</div>
              <MatchupCard matchup={bracketData?.[2]} />
              <svg className="absolute top-1/2 left-full w-12 h-10 -translate-y-1/2 hidden md:block" style={{ pointerEvents: 'none' }}>
                <path d="M 0 50% L 48 50%" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
              </svg>
            </div>

            {/* Champion Placeholder */}
            <div className="flex flex-col justify-center">
              <div className="w-48 h-32 border-2 border-dashed border-accent/50 bg-accent/5 rounded-xl flex flex-col items-center justify-center text-accent">
                <Trophy className="h-10 w-10 mb-2 opacity-80" />
                <span className="font-bold uppercase tracking-wider">{language === "en" ? "Champion" : "Champion"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Playoff Standings Table */}
        <div className="print:hidden">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2"><Info className="h-6 w-6 text-accent" />{language === "en" ? "Playoff Standings" : "Classement des Séries"}</h2>
          <Card className="border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-16 text-center">{language === "en" ? "Seed" : "Rang"}</TableHead>
                    <TableHead>{language === "en" ? "Team" : "Équipe"}</TableHead>
                    <TableHead className="text-center">W</TableHead>
                    <TableHead className="text-center">L</TableHead>
                    <TableHead>{language === "en" ? "Status" : "Statut"}</TableHead>
                    <TableHead>{language === "en" ? "Next Opponent" : "Prochain Adversaire"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standingsData?.map((team: any) => (
                    <TableRow key={team.name} className="hover:bg-muted/30">
                      <TableCell className="text-center font-bold text-muted-foreground">{team.seed}</TableCell>
                      <TableCell className="font-bold text-foreground">{team.name}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-semibold">{team.wins}</TableCell>
                      <TableCell className="text-center text-red-600 font-semibold">{team.losses}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={team.status === "Active" ? "border-emerald-500 text-emerald-600" : "border-red-500 text-red-600"}>
                          {team.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{team.nextOpponent}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedMatchup} onOpenChange={(open) => !open && setSelectedMatchup(null)}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-accent" />{language === "en" ? "Series Details" : "Détails de la Série"}</DialogTitle></DialogHeader>
          {selectedMatchup && (
            <div className="space-y-6 pt-4">
              <div className="flex justify-between items-center text-center">
                <div className="flex-1"><h3 className="font-bold text-lg text-foreground">{selectedMatchup.team1}</h3><p className="text-3xl font-black text-accent mt-2">{selectedMatchup.team1Score}</p></div>
                <div className="px-4 text-muted-foreground font-bold">VS</div>
                <div className="flex-1"><h3 className="font-bold text-lg text-foreground">{selectedMatchup.team2}</h3><p className="text-3xl font-black text-accent mt-2">{selectedMatchup.team2Score}</p></div>
              </div>
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> {language === "en" ? "Next Game" : "Prochain Match"}</span><span className="font-medium text-foreground">{selectedMatchup.gameDate}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> {language === "en" ? "Time" : "Heure"}</span><span className="font-medium text-foreground">{selectedMatchup.time}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-2"><Trophy className="h-4 w-4" /> {language === "en" ? "Format" : "Format"}</span><span className="font-medium text-foreground">{language === "en" ? `Best of ${selectedMatchup.bestOf}` : `${selectedMatchup.bestOf} de 3`}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}