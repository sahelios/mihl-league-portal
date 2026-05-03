import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Team {
  id: number;
  name: string;
  logo: string;
  colors: string;
  roster: string[];
  wins: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export default function Teams() {
  const teams: Team[] = [
    {
      id: 1,
      name: "Iron Lions",
      logo: "/manus-storage/iron-lions-official_c20bc853.png",
      colors: "Navy Blue, Gold & Red",
      roster: ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6", "Player 7"],
      wins: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
    {
      id: 2,
      name: "Golan Guards",
      logo: "/manus-storage/golan-guards-official_9bc97773.png",
      colors: "Forest Green, White & Gray",
      roster: ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6", "Player 7"],
      wins: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
    {
      id: 3,
      name: "H Hammers",
      logo: "/manus-storage/h-hammers-official_618f607d.png",
      colors: "Navy Blue & Bright Blue",
      roster: ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6", "Player 7"],
      wins: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
    {
      id: 4,
      name: "Schvitz Saints",
      logo: "/manus-storage/schvitz-saints-official_6fb5526d.png",
      colors: "Royal Purple & Light Blue",
      roster: ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6", "Player 7"],
      wins: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-12 text-foreground">Teams</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition">
              <CardHeader>
                <div className="flex items-center gap-6">
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div>
                    <CardTitle className="text-2xl">{team.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{team.colors}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Team Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">Record</p>
                    <p className="text-lg font-bold">{team.wins}W - {team.losses}L</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">Goals</p>
                    <p className="text-lg font-bold">{team.goalsFor} - {team.goalsAgainst}</p>
                  </div>
                </div>

                {/* Roster */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Roster</h3>
                  <ul className="space-y-2">
                    {team.roster.map((player, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm text-foreground/80"
                      >
                        <span className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        {player}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
