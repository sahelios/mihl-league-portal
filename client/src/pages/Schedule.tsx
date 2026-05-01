import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Game {
  id: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  homeScore?: number;
  awayScore?: number;
  status: "scheduled" | "completed";
}

export default function Schedule() {
  const games: Game[] = [
    { id: 1, homeTeam: "Iron Lions", awayTeam: "Golan Guards", date: "2026-06-23", time: "9:30 PM", venue: "Samuel Moscovitch Arena", status: "scheduled" },
    { id: 2, homeTeam: "H Hammers", awayTeam: "Schvitz Saints", date: "2026-06-25", time: "10:00 PM", venue: "Outremont Arena", status: "scheduled" },
    { id: 3, homeTeam: "Golan Guards", awayTeam: "H Hammers", date: "2026-06-30", time: "9:30 PM", venue: "Samuel Moscovitch Arena", status: "scheduled" },
    { id: 4, homeTeam: "Schvitz Saints", awayTeam: "Iron Lions", date: "2026-07-02", time: "10:00 PM", venue: "Outremont Arena", status: "scheduled" },
    { id: 5, homeTeam: "Iron Lions", awayTeam: "H Hammers", date: "2026-07-07", time: "9:30 PM", venue: "Samuel Moscovitch Arena", status: "scheduled" },
    { id: 6, homeTeam: "Golan Guards", awayTeam: "Schvitz Saints", date: "2026-07-09", time: "10:00 PM", venue: "Outremont Arena", status: "scheduled" },
  ];

  const tuesdayGames = games.filter(g => new Date(g.date).getDay() === 2);
  const thursdayGames = games.filter(g => new Date(g.date).getDay() === 4);

  const GameCard = ({ game }: { game: Game }) => (
    <Card className="hover:shadow-md transition">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-right pr-4">
              <p className="font-semibold text-foreground">{game.homeTeam}</p>
            </div>
            <div className="text-center">
              {game.status === "completed" ? (
                <p className="text-2xl font-bold text-accent">{game.homeScore} - {game.awayScore}</p>
              ) : (
                <p className="text-sm text-muted-foreground">vs</p>
              )}
            </div>
            <div className="flex-1 text-left pl-4">
              <p className="font-semibold text-foreground">{game.awayTeam}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 text-sm text-muted-foreground space-y-1">
            <p><strong>Date:</strong> {new Date(game.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {game.time}</p>
            <p><strong>Venue:</strong> {game.venue}</p>
          </div>

          {game.status === "scheduled" && (
            <Button variant="outline" size="sm" className="w-full">
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-12 text-foreground">Schedule & Results</h1>

        {/* Tuesday Games */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            Tuesdays - Samuel Moscovitch Arena (9:30 PM - 11:00 PM)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tuesdayGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

        {/* Thursday Games */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            Thursdays - Outremont Arena (10:00 PM - 11:20 PM)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {thursdayGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
