import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, User } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

interface NewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
  image?: string;
}

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  image?: string;
}

interface Player {
  id: number;
  name: string;
  team: string;
  points: number;
  image?: string;
}

interface Team {
  id: number;
  name: string;
  wins: number;
  losses: number;
  points: number;
  logo?: string;
}

interface StarPlayer {
  id: number;
  name: string;
  team: string;
  rating: number;
  image?: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [newsIndex, setNewsIndex] = useState(0);
  const [blogIndex, setBlogIndex] = useState(0);
  const [starsIndex, setStarsIndex] = useState(0);
  const [playersIndex, setPlayersIndex] = useState(0);
  const [teamsIndex, setTeamsIndex] = useState(0);

  // Sample Data
  const news: NewsItem[] = [
    {
      id: 1,
      title: "Season Kicks Off June 23",
      content:
        "The Mensches Ice Hockey League is excited to announce the start of our 2026 summer season! Games will be held at Samuel Moscovitch Arena on Tuesdays and Outremont Arena on Thursdays.",
      date: "2026-06-15",
    },
    {
      id: 2,
      title: "Registration Now Open",
      content:
        "Players can now register for the upcoming season. Individual registration is $315, or join a full team for $3,000. Jersey and socks set coming soon!",
      date: "2026-06-10",
    },
    {
      id: 3,
      title: "Meet the Four Teams",
      content:
        "This season features four competitive teams: Iron Lions, Golan Guards, H Hammers, and Schvitz Saints. Check out their profiles and rosters on the Teams page.",
      date: "2026-06-05",
    },
  ];

  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: "Tips for New Players: Getting Ready for the Season",
      excerpt:
        "Whether this is your first time playing hockey or you're returning to the ice, here are some tips to prepare for an amazing season...",
      author: "Admin",
      date: "2026-06-12",
    },
    {
      id: 2,
      title: "The History of The Mensches Ice Hockey League",
      excerpt:
        "Learn about how our league was founded and the values that drive our community of passionate hockey players...",
      author: "Admin",
      date: "2026-06-08",
    },
    {
      id: 3,
      title: "Spotlight: Iron Lions Team Preview",
      excerpt:
        "Get to know the Iron Lions roster and what they're hoping to achieve this season. With strong leadership and talented players...",
      author: "Admin",
      date: "2026-06-01",
    },
  ];

  const starsOfWeek: StarPlayer[] = [
    { id: 1, name: "Player 1", team: "Iron Lions", rating: 5 },
    { id: 2, name: "Player 2", team: "Golan Guards", rating: 5 },
    { id: 3, name: "Player 3", team: "H Hammers", rating: 4 },
  ];

  const topPlayers: Player[] = [
    { id: 1, name: "Player 4", team: "H Hammers", points: 24 },
    { id: 2, name: "Player 5", team: "Golan Guards", points: 22 },
    { id: 3, name: "Player 6", team: "Iron Lions", points: 20 },
  ];

  const topTeams: Team[] = [
    { id: 1, name: "Iron Lions", wins: 8, losses: 2, points: 16 },
    { id: 2, name: "Golan Guards", wins: 7, losses: 3, points: 14 },
    { id: 3, name: "H Hammers", wins: 6, losses: 4, points: 12 },
  ];

  const Slider = ({
    items,
    index,
    setIndex,
    renderItem,
    title,
  }: {
    items: any[];
    index: number;
    setIndex: (i: number) => void;
    renderItem: (item: any) => React.ReactNode;
    title: string;
  }) => {
    const handlePrev = () => {
      setIndex(Math.max(0, index - 1));
    };
    const handleNext = () => {
      setIndex(Math.min(items.length - 1, index + 1));
    };

    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-foreground">{title}</h2>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={index === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
          >
            <ChevronLeft size={24} />
          </Button>

          <div className="overflow-hidden px-12">
            <div className="flex transition-transform duration-300">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex-shrink-0 w-full transition-opacity duration-300 ${
                    i === index ? "opacity-100" : "opacity-0 absolute"
                  }`}
                >
                  {renderItem(item)}
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={index === items.length - 1}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
          >
            <ChevronRight size={24} />
          </Button>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full transition ${
                i === index ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            The Mensches Ice Hockey League
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-3xl leading-relaxed">
            A thriving recreational ice hockey league in Montreal dedicated to community, competition, and camaraderie. Join us for competitive play, skill development, and lasting friendships on the ice.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Button 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base py-6 px-8"
              onClick={() => setLocation("/register")}
            >
              Players Register Now
            </Button>
            <Button 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base py-6 px-8"
              onClick={() => setLocation("/referee-scorekeeper-apply")}
            >
              Referee/Scorekeeper Register Now
            </Button>
            <Button 
              variant="outline" 
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 text-base py-6 px-8"
              onClick={() => setLocation("/league-rules")}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-muted/50 py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">About MIHL</h2>
              <p className="text-lg text-foreground/80 mb-4">
                The Mensches Ice Hockey League is a premier recreational ice hockey league based in Montreal. We bring together passionate hockey players of all skill levels to compete in a fun, supportive, and community-focused environment.
              </p>
              <p className="text-lg text-foreground/80 mb-4">
                Our league features competitive regular season play, evaluation games for skill development, and a strong emphasis on sportsmanship and camaraderie. Whether you're a seasoned player or returning to the ice after years away, MIHL offers the perfect opportunity to play the sport you love.
              </p>
              <p className="text-lg text-foreground/80">
                With four competitive teams, professional officiating, and well-maintained venues, we provide a world-class recreational hockey experience.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-accent mb-2">4</div>
                <p className="text-foreground font-semibold">Competitive Teams</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-accent mb-2">2</div>
                <p className="text-foreground font-semibold">Premium Venues</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-accent mb-2">100+</div>
                <p className="text-foreground font-semibold">Active Players</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-accent mb-2">20+</div>
                <p className="text-foreground font-semibold">Games/Season</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container py-16">
        {/* What We Offer Section */}
        <section className="mb-16 bg-gradient-to-r from-accent/10 to-secondary/10 -mx-4 md:-mx-8 px-4 md:px-8 py-12 rounded-lg">
          <div className="container">
            <h2 className="text-3xl font-bold mb-8 text-foreground">What We Offer</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="text-xl text-accent">🏆 Competitive Play</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">Exciting regular season games with professional officiating and fair competition across all skill levels.</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="text-xl text-accent">📊 Skill Development</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">Evaluation games and coaching opportunities to help players improve their skills and reach their potential.</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="text-xl text-accent">🤝 Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">Build lasting friendships and be part of a vibrant hockey community dedicated to camaraderie and fun.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Latest News */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                    <Calendar size={16} />
                    {formatDate(item.date)}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">{item.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Blog Section */}
        <section className="mb-16 bg-muted/30 -mx-4 md:-mx-8 px-4 md:px-8 py-12">
          <div className="container">
            <h2 className="text-3xl font-bold mb-8 text-foreground">Blog</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(post.date)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/80">{post.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stars of the Week Slider */}
        <Slider
          items={starsOfWeek}
          index={starsIndex}
          setIndex={setStarsIndex}
          title="⭐ Stars of the Week"
          renderItem={(star) => (
            <Card className="text-center">
              <CardHeader>
                <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl">🏒</span>
                </div>
                <CardTitle>{star.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{star.team}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < star.rating ? "text-accent" : "text-border"}>
                      ★
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        />

        {/* Top 3 Players Slider */}
        <Slider
          items={topPlayers}
          index={playersIndex}
          setIndex={setPlayersIndex}
          title="🏆 Top 3 Players"
          renderItem={(player) => (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <CardTitle>{player.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{player.team}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{player.points} Points</div>
              </CardContent>
            </Card>
          )}
        />

        {/* Top 3 Teams Slider */}
        <Slider
          items={topTeams}
          index={teamsIndex}
          setIndex={setTeamsIndex}
          title="🥇 Top 3 Teams"
          renderItem={(team) => (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{team.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wins</span>
                    <span className="font-bold text-lg">{team.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Losses</span>
                    <span className="font-bold text-lg">{team.losses}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="text-muted-foreground">Points</span>
                    <span className="font-bold text-xl text-accent">{team.points}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        />
      </div>
    </div>
  );
}
