import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import UpcomingGamesSlider from "./components/UpcomingGamesSlider";

// Public Pages
import Home from "./pages/Home";
import LeagueRules from "./pages/LeagueRules";
import Teams from "./pages/Teams";
import Schedule from "./pages/Schedule";
import Stats from "./pages/Stats";
import Suspensions from "./pages/Suspensions";
import Standings from "./pages/Standings";
import Registration from "./pages/Registration";
import RefereeScorekeeper from "./pages/RefereeScorekeeper";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPlayers from "./pages/admin/Players";
import Games from "./pages/admin/Games";
import News from "./pages/admin/News";
import Stars from "./pages/admin/Stars";
import AdminSuspensions from "./pages/admin/AdminSuspensions";
import Messages from "./pages/admin/Messages";
import Settings from "./pages/admin/Settings";
import EvaluationGames from "./pages/admin/EvaluationGames"

import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      {/* Public Pages */}
      <Route path="/" component={Home} />
      <Route path="/league-rules" component={LeagueRules} />
      <Route path="/teams" component={Teams} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/stats" component={Stats} />
      <Route path="/suspensions" component={Suspensions} />
      <Route path="/standings" component={Standings} />
      <Route path="/register" component={Registration} />
      <Route path="/referee-scorekeeper" component={RefereeScorekeeper} />

      {/* Admin Pages */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/players" component={AdminPlayers} />
      <Route path="/admin/games" component={Games} />
      <Route path="/admin/evaluation-games" component={EvaluationGames} />
      <Route path="/admin/news" component={News} />
      <Route path="/admin/stars" component={Stars} />
      <Route path="/admin/suspensions" component={AdminSuspensions} />
      <Route path="/admin/messages" component={Messages} />
      <Route path="/admin/settings" component={Settings} />

      {/* 404 Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <UpcomingGamesSlider />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header isAdmin />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <PublicLayout>
            <Router />
          </PublicLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
