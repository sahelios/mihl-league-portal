import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlayerStat {
  name: string;
  team: string;
  goals: number;
  assists: number;
  points: number;
  gamesPlayed: number;
}

export default function Stats() {
  const playerStats: PlayerStat[] = [
    { name: "Michael Elfassy", team: "H Hammers", goals: 12, assists: 12, points: 24, gamesPlayed: 10 },
    { name: "Gad Cohen", team: "Golan Guards", goals: 10, assists: 12, points: 22, gamesPlayed: 10 },
    { name: "Oren Elkaim", team: "Iron Lions", goals: 9, assists: 11, points: 20, gamesPlayed: 10 },
    { name: "Alex Cohen", team: "Iron Lions", goals: 8, assists: 10, points: 18, gamesPlayed: 10 },
    { name: "Nate Eljarrat", team: "Golan Guards", goals: 7, assists: 9, points: 16, gamesPlayed: 10 },
    { name: "David Stein", team: "Iron Lions", goals: 7, assists: 8, points: 15, gamesPlayed: 10 },
    { name: "Yaniv Cohen", team: "Golan Guards", goals: 6, assists: 8, points: 14, gamesPlayed: 10 },
    { name: "Theo X", team: "H Hammers", goals: 6, assists: 7, points: 13, gamesPlayed: 10 },
    { name: "Moshe Stein", team: "Schvitz Saints", goals: 5, assists: 6, points: 11, gamesPlayed: 10 },
    { name: "Yossi Cohen", team: "Schvitz Saints", goals: 4, assists: 5, points: 9, gamesPlayed: 10 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-12 text-foreground">Player Statistics</h1>

        <Card>
          <CardHeader>
            <CardTitle>2026 Summer Season - Individual Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Player</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Team</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">G</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">A</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">PTS</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">GP</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.map((stat, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted/50 transition">
                      <td className="py-3 px-4 font-semibold text-foreground">{stat.name}</td>
                      <td className="py-3 px-4 text-foreground">{stat.team}</td>
                      <td className="text-center py-3 px-4 text-foreground">{stat.goals}</td>
                      <td className="text-center py-3 px-4 text-foreground">{stat.assists}</td>
                      <td className="text-center py-3 px-4 font-bold text-accent">{stat.points}</td>
                      <td className="text-center py-3 px-4 text-foreground">{stat.gamesPlayed}</td>
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
            <p className="text-muted-foreground">G</p>
            <p className="font-semibold text-foreground">Goals</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">A</p>
            <p className="font-semibold text-foreground">Assists</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">PTS</p>
            <p className="font-semibold text-foreground">Points</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">GP</p>
            <p className="font-semibold text-foreground">Games Played</p>
          </div>
        </div>
      </div>
    </div>
  );
}
