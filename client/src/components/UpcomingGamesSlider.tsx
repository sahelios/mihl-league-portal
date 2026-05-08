import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function UpcomingGamesSlider() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const sliderRef = useRef<HTMLDivElement>(null);

  // Fetch upcoming games from API[cite: 1]
  // Note: Assuming `trpc.league.getUpcomingGames` handles the 14-day filter backend-side 
  // as defined in the requirements.
  const { data: games, isLoading, isError, refetch } = trpc.league.getUpcomingGames.useQuery(undefined, {
    // Auto-refresh every 5 minutes (300,000 ms)
    refetchInterval: 300000,
  });

  // Smooth scrolling implementation[cite: 11]
  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 330; // Card width + gap
      const currentScroll = sliderRef.current.scrollLeft;
      const newPosition = direction === "left" 
        ? Math.max(0, currentScroll - scrollAmount) 
        : currentScroll + scrollAmount;
      
      sliderRef.current.scrollTo({ left: newPosition, behavior: "smooth" });
    }
  };

  // Date formatting helper for bilingual display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "en" ? "en-US" : "fr-FR", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  // Time formatting helper (12-hour AM/PM format)
  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // 1. Loading State Skeleton[cite: 1, 11]
  if (isLoading) {
    return (
      <div className="bg-muted/10 py-6 border-b border-border">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="h-4 w-48 bg-muted rounded animate-pulse mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-80 h-32 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State[cite: 1]
  if (isError) {
    return (
      <div className="bg-destructive/5 py-6 border-b border-destructive/20">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-6 w-6 text-destructive mb-2" />
          <p className="text-sm text-foreground font-medium mb-3">
            {language === "en" ? "Failed to load upcoming games." : "Impossible de charger les matchs à venir."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {language === "en" ? "Retry" : "Réessayer"}
          </Button>
        </div>
      </div>
    );
  }

  // 3. Empty State[cite: 11]
  if (!games || games.length === 0) {
    return (
      <div className="bg-muted/10 py-8 border-b border-border">
        <div className="container max-w-7xl mx-auto px-4">
          <p className="text-center text-muted-foreground font-medium">
            {language === "en" 
              ? "No games scheduled in the next 2 weeks." 
              : "Aucun match prévu dans les 2 prochaines semaines."}
          </p>
        </div>
      </div>
    );
  }

  // 4. Main Component Render[cite: 11]
  return (
    <div className="bg-muted/10 py-6 border-b border-border relative group">
      <div className="container max-w-7xl mx-auto px-4">
        
        {/* Header & Language Toggle */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold tracking-wider text-foreground uppercase">
            {language === "en" ? "Upcoming Games (14-Day Forecast)" : "Matchs à Venir (Prévisions 14 Jours)"}
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {language === "en" ? "FR" : "EN"}
          </Button>
        </div>

        <div className="relative">
          {/* Left Navigation Arrow */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex disabled:opacity-0"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Scrollable Container */}
          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {games.map((game: any) => (
              <div
                key={game.id}
                className="snap-start flex-shrink-0 w-[300px] sm:w-[320px] bg-card border border-border rounded-xl p-5 hover:border-accent/50 hover:shadow-lg transition-all duration-200"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-sm uppercase">
                    {language === "en" ? "Scheduled" : "Prévu"}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground capitalize">
                    {formatDate(game.date)}
                  </span>
                </div>

                {/* Matchup Layout */}
                <div className="flex items-center justify-between mb-4 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="flex-1 text-right pr-3 truncate">
                    <p className="font-bold text-sm text-foreground truncate">{game.teamAName}</p>
                  </div>
                  <div className="text-center shrink-0 w-8">
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      {language === "en" ? "vs" : "c."}
                    </p>
                  </div>
                  <div className="flex-1 text-left pl-3 truncate">
                    <p className="font-bold text-sm text-foreground truncate">{game.teamBName}</p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                  <span className="font-medium">{formatTime(game.date)}</span>
                  <span className="truncate pl-2">{game.venueName || "TBD"}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Navigation Arrow */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}