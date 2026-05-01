import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Standing {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export default function Standings() {
  const standings: Standing[] = [
    { rank: 1, team: "Iron Lions", wins: 8, losses: 2, ties: 0, points: 16, goalsFor: 45, goalsAgainst: 28 },
    { rank: 2, team: "Golan Guards", wins: 7, losses: 3, ties: 0, points: 14, goalsFor: 42, goalsAgainst: 32 },
    { rank: 3, team: "H Hammers", wins: 6, losses: 4, ties: 0, points: 12, goalsFor: 38, goalsAgainst: 35 },
    { rank: 4, team: "Schvitz Saints", wins: 5, losses: 5, ties: 0, points: 10, goalsFor: 35, goalsAgainst: 38 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-12 text-foreground">Standings</h1>

        <Card>
          <CardHeader>
            <CardTitle>2026 Summer Season</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Team</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">W</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">L</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">T</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">PTS</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">GF</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">GA</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing) => (
                    <tr key={standing.rank} className="border-b border-border hover:bg-muted/50 transition">
                      <td className="py-3 px-4 font-bold text-accent">{standing.rank}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{standing.team}</td>
                      <td className="text-center py-3 px-4 text-foreground">{standing.wins}</td>
                      <td className="text-center py-3 px-4 text-foreground">{standing.losses}</td>
                      <td className="text-center py-3 px-4 text-foreground">{standing.ties}</td>
                      <td className="text-center py-3 px-4 font-bold text-accent">{standing.points}</td>
                      <td className="text-center py-3 px-4 text-foreground">{standing.goalsFor}</td>
                      <td className="text-center py-3 px-4 text-foreground">{standing.goalsAgainst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-sm">
            <p className="text-muted-foreground">W</p>
            <p className="font-semibold text-foreground">Wins</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">L</p>
            <p className="font-semibold text-foreground">Losses</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">T</p>
            <p className="font-semibold text-foreground">Ties</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">PTS</p>
            <p className="font-semibold text-foreground">Points</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">GF</p>
            <p className="font-semibold text-foreground">Goals For</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">GA</p>
            <p className="font-semibold text-foreground">Goals Against</p>
          </div>
        </div>
      </div>
    </div>
  );
}
