import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function UpcomingGamesSlider() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [language] = useState<"en" | "fr">("en"); // Can be wired up to global state later if needed

  // Fetch games using tRPC with auto-refresh every 5 minutes
  const { data: games, isLoading } = trpc.league.getUpcomingGames.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000,
  });

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

  // Ensure we have a valid array of games
  const safeGames = Array.isArray(games) ? games : [];

  if (isLoading) {
    return (
      <div className="bg-muted/30 py-4 border-b border-border">
        <div className="container">
          <div className="h-32 flex items-center justify-center bg-card rounded-lg border border-border">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (safeGames.length === 0) {
    return (
      <div className="bg-muted/30 py-6 border-b border-border">
        <div className="container">
          <p className="text-center text-muted-foreground font-medium">
            {language === "en" 
              ? "No active season or games scheduled." 
              : "Aucune saison active ou match prévu."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 py-4 border-b border-border">
      <div className="container">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            {language === "en" ? "Upcoming Games" : "Matchs à Venir"}
          </h3>
        </div>
        
        <div className="relative">
          {/* Left Scroll Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background border border-border shadow-sm"
            onClick={() => scroll("left")}
          >
            <ChevronLeft size={20} />
          </Button>

          {/* Games Slider */}
          <div
            id="games-slider"
            className="flex gap-4 overflow-x-auto scroll-smooth pb-4 pt-1 px-8 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {safeGames.map((game: any) => (
              <div
                key={game.id}
                className="flex-shrink-0 w-80 bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded uppercase">
                    {game.status === "completed" 
                      ? (language === "en" ? "FINAL" : "TERMINÉ") 
                      : (language === "en" ? "SCHEDULED" : "PRÉVU")}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {game.gameDate ? new Date(game.gameDate).toLocaleDateString(language === "en" ? "en-CA" : "fr-CA", { month: "short", day: "numeric" }) : "TBD"}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 text-right pr-3">
                    <p className="font-bold text-sm leading-tight text-foreground">
                      {game.teamAName || game.homeTeam}
                    </p>
                  </div>
                  <div className="text-center min-w-[3rem]">
                    {game.status === "completed" ? (
                      <p className="font-bold text-lg bg-muted border border-border px-2 py-1 rounded">
                        {game.teamAScore ?? game.homeScore} - {game.teamBScore ?? game.awayScore}
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-muted-foreground px-2 py-1 bg-muted/50 rounded">VS</p>
                    )}
                  </div>
                  <div className="flex-1 text-left pl-3">
                    <p className="font-bold text-sm leading-tight text-foreground">
                      {game.teamBName || game.awayTeam}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground flex justify-between items-center bg-muted/50 px-3 py-2 rounded-md border border-border/50">
                  <span className="font-medium flex items-center gap-1">
                    {game.gameTime || "TBD"}
                  </span>
                  <span className="truncate max-w-[140px] text-right">
                    {game.venueName || game.venue || "TBA"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Scroll Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background border border-border shadow-sm"
            onClick={() => scroll("right")}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}