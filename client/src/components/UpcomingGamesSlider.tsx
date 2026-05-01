import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  status: "scheduled" | "in_progress" | "completed";
}

export default function UpcomingGamesSlider() {
  const [games, setGames] = useState<Game[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch upcoming games from API
    // For now, use sample data
    const sampleGames: Game[] = [
      {
        id: 1,
        homeTeam: "Iron Lions",
        awayTeam: "Golan Guards",
        date: "2026-06-24",
        time: "9:30 PM",
        venue: "Samuel Moscovitch Arena",
        status: "scheduled",
      },
      {
        id: 2,
        homeTeam: "H Hammers",
        awayTeam: "Schvitz Saints",
        date: "2026-06-26",
        time: "10:00 PM",
        venue: "Outremont Arena",
        status: "scheduled",
      },
      {
        id: 3,
        homeTeam: "Golan Guards",
        awayTeam: "H Hammers",
        date: "2026-07-01",
        time: "9:30 PM",
        venue: "Samuel Moscovitch Arena",
        status: "scheduled",
      },
      {
        id: 4,
        homeTeam: "Schvitz Saints",
        awayTeam: "Iron Lions",
        date: "2026-07-03",
        time: "10:00 PM",
        venue: "Outremont Arena",
        status: "scheduled",
      },
    ];
    setGames(sampleGames);
    setLoading(false);
  }, []);

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("games-slider");
    if (container) {
      const scrollAmount = 400;
      const newPosition =
        direction === "left"
          ? Math.max(0, scrollPosition - scrollAmount)
          : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    }
  };

  if (loading) {
    return (
      <div className="bg-muted/30 py-4">
        <div className="container">
          <div className="h-24 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-muted/30 py-6">
        <div className="container">
          <p className="text-center text-muted-foreground">
            No games scheduled in the next 2 weeks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 py-4 border-b border-border">
      <div className="container">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Upcoming Games (2-Week Forecast)
        </h3>
        <div className="relative">
          {/* Scroll Buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
            onClick={() => scroll("left")}
          >
            <ChevronLeft size={20} />
          </Button>

          {/* Games Slider */}
          <div
            id="games-slider"
            className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
            style={{ scrollBehavior: "smooth" }}
          >
            {games.map((game) => (
              <div
                key={game.id}
                className="flex-shrink-0 w-80 bg-card border border-border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-accent">
                    {game.status === "completed" ? "FINAL" : "SCHEDULED"}
                  </span>
                  <span className="text-xs text-muted-foreground">{game.date}</span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 text-right pr-3">
                    <p className="font-semibold text-sm">{game.homeTeam}</p>
                  </div>
                  <div className="text-center">
                    {game.status === "completed" ? (
                      <p className="font-bold text-lg">
                        {game.homeScore} - {game.awayScore}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">vs</p>
                    )}
                  </div>
                  <div className="flex-1 text-left pl-3">
                    <p className="font-semibold text-sm">{game.awayTeam}</p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{game.time}</p>
                  <p>{game.venue}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Scroll Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
            onClick={() => scroll("right")}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
