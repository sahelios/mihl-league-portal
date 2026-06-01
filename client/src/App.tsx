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
import NewsPage from "./pages/News";
import StarsOfWeek from "./pages/StarsOfWeek";
import Staff from "./pages/Staff";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPlayers from "./pages/admin/Players";
import Games from "./pages/admin/Games";
import AdminNews from "./pages/admin/News";
import Stars from "./pages/admin/Stars";
import AdminSuspensions from "./pages/admin/AdminSuspensions";
import Messages from "./pages/admin/Messages";
import Settings from "./pages/admin/Settings";
import EvaluationGames from "./pages/admin/EvaluationGames";
import StaffApplications from "./pages/admin/StaffApplications";
import StaffAvailability from "./pages/admin/StaffAvailability";
import GameAssignments from "./pages/admin/GameAssignments";
import GameScheduler from "./pages/admin/GameScheduler";
import ScheduleManagement from "./pages/admin/ScheduleManagement";
import SeasonManagement from "./pages/admin/SeasonManagement";
import AdminTeams from "./pages/admin/Teams";
import TeamManagement from "./pages/admin/TeamManagement";
import WaitingListAdmin from "./pages/admin/WaitingListAdmin";

// Referee Pages
import RefereeScorekeeperRouter from "./pages/RefereeScorekeeperRouter";
import RefereeScorekeeperLanding from "./pages/RefereeScorekeeperLanding";
import RefereeScorekeeperApplication from "./pages/RefereeScorekeeperApplication";
import RefereeGameSelection from "./pages/RefereeGameSelection";

// Player Portal
import PlayerPortal from "./pages/PlayerPortal";
import MagicLinkLogin from "./pages/MagicLinkLogin";
import Login from "./pages/Login";

// Staff Portal
import { StaffPortal } from "./pages/StaffPortal";

// Legal Pages
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

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
      <Route path="/news" component={NewsPage} />
      <Route path="/stars" component={StarsOfWeek} />
      <Route path="/staff" component={Staff} />
      <Route path="/register" component={Registration} />
      <Route path="/referee-scorekeeper" component={RefereeScorekeeperRouter} />
      <Route path="/referee-scorekeeper-apply" component={RefereeScorekeeperApplication} />
      <Route path="/referee-game-selection" component={RefereeGameSelection} />
      <Route path="/player-portal" component={PlayerPortal} />
      <Route path="/staff-portal" component={StaffPortal} />
      <Route path="/magic-login" component={MagicLinkLogin} />
      <Route path="/login" component={Login} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />

      {/* Admin Pages */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/players" component={AdminPlayers} />
      <Route path="/admin/games" component={Games} />
      <Route path="/admin/evaluation-games" component={EvaluationGames} />
      <Route path="/admin/news" component={AdminNews} />
      <Route path="/admin/stars" component={Stars} />
      <Route path="/admin/suspensions" component={AdminSuspensions} />
      <Route path="/admin/messages" component={Messages} />
      <Route path="/admin/settings" component={Settings} />
      {/* Redirect old route to new route */}
      <Route path="/admin/referee-applications" component={StaffApplications} />
      <Route path="/admin/staff-applications" component={StaffApplications} />
      <Route path="/admin/staff-availability" component={StaffAvailability} />
      <Route path="/admin/game-assignments" component={GameAssignments} />
      <Route path="/admin/game-scheduler" component={GameScheduler} />
      <Route path="/admin/schedule-management" component={ScheduleManagement} />
      <Route path="/admin/season-management" component={SeasonManagement} />
      <Route path="/admin/teams" component={AdminTeams} />
      <Route path="/admin/team-management" component={TeamManagement} />
      <Route path="/admin/waiting-list" component={WaitingListAdmin} />

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
