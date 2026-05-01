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
      logo: "https://d2xsxph8kpxj0f.cloudfront.net/310519663601380927/Fde3d448vCxuYB8KePk65W/iron-lions-logo-fiEiAMaxLU9qYQBRDYwNns.webp",
      colors: "Maroon Red & White",
      roster: ["Alex Cohen", "David Stein", "Michael Elfassy", "Oren Elkaim", "Gad Cohen"],
      wins: 8,
      losses: 2,
      goalsFor: 45,
      goalsAgainst: 28,
    },
    {
      id: 2,
      name: "Golan Guards",
      logo: "https://d2xsxph8kpxj0f.cloudfront.net/310519663601380927/Fde3d448vCxuYB8KePk65W/golan-guards-logo-FbhtjKpEXATVoD9wpHyW2B.webp",
      colors: "Forest Green & Gold",
      roster: ["Nate Eljarrat", "Yaniv Cohen", "Steven Lugassi", "Eli Ede", "Dan Abikhzer"],
      wins: 7,
      losses: 3,
      goalsFor: 42,
      goalsAgainst: 32,
    },
    {
      id: 3,
      name: "H Hammers",
      logo: "https://d2xsxph8kpxj0f.cloudfront.net/310519663601380927/Fde3d448vCxuYB8KePk65W/h-hammers-logo-GXbHhx2YjSRs2NYyRT5gQn.webp",
      colors: "Silver & Charcoal Gray",
      roster: ["Theo X", "Ariel Orzech", "Elie Ede", "Shai Orzech", "Rafi Orzech"],
      wins: 6,
      losses: 4,
      goalsFor: 38,
      goalsAgainst: 35,
    },
    {
      id: 4,
      name: "Schvitz Saints",
      logo: "https://d2xsxph8kpxj0f.cloudfront.net/310519663601380927/Fde3d448vCxuYB8KePk65W/schvitz-saints-logo-goQfhvsxxvmaJf3eho6a3J.webp",
      colors: "Royal Purple & Cream",
      roster: ["Moshe Stein", "Yossi Cohen", "Benny Orzech", "Chaim Elfassy", "Zvi Stein"],
      wins: 5,
      losses: 5,
      goalsFor: 35,
      goalsAgainst: 38,
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
