import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Trophy, AlertCircle, Settings, MessageSquare } from "lucide-react";

export default function AdminDashboard() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Redirect non-admins
  if (user && user.role !== "admin") {
    navigate("/");
    return null;
  }

  // Stats removed - now displayed in Player Management page

  const t = {
    en: {
      dashboard: "Admin Dashboard",
      registrations: "Registrations",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      total: "Total",
      management: "Management",
      players: "Player Management",
      games: "Game Management",
      news: "News & Blog",
      stars: "Stars of the Week",
      suspensions: "Suspensions",
      messaging: "Messaging",
      settings: "Settings",
      venues: "Venues",
      teams: "Teams",
      seasons: "Seasons",
      staffApplications: "Staff Applications",
    },
    fr: {
      dashboard: "Tableau de Bord Admin",
      registrations: "Inscriptions",
      pending: "En attente",
      approved: "Approuvées",
      rejected: "Rejetées",
      total: "Total",
      management: "Gestion",
      players: "Gestion des Joueurs",
      games: "Gestion des Matchs",
      news: "Nouvelles et Blog",
      stars: "Étoiles de la Semaine",
      suspensions: "Suspensions",
      messaging: "Messagerie",
      settings: "Paramètres",
      venues: "Arénas",
      teams: "Équipes",
      seasons: "Saisons",
      staffApplications: "Candidatures du Personnel",
    },
  };

  const labels = t[language];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{labels.dashboard}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
          >
            {language === "en" ? "FR" : "EN"}
          </Button>
        </div>



        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {labels.players}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/players")}
              >
                {labels.players}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/staff-applications")}
              >
                {labels.staffApplications}
              </Button>
            </CardContent>
          </Card>

          {/* Game Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {labels.games}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/games")}
              >
                {labels.games}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/evaluation-games")}
              >
                Evaluation Games
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/game-scheduler")}
              >
                {language === "en" ? "Game Scheduler" : "Planificateur de Matchs"}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/schedule-management")}
              >
                {language === "en" ? "Schedule Management" : "Gestion de l'Horaire"}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/season-management")}
              >
                {language === "en" ? "Season Management" : "Gestion des Saisons"}
              </Button>
            </CardContent>
          </Card>

          {/* News & Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {labels.news}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/news")}
              >
                News
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/blog")}
              >
                Blog
              </Button>
            </CardContent>
          </Card>

          {/* Recognition & Discipline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {labels.suspensions}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/stars")}
              >
                {labels.stars}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/suspensions")}
              >
                {labels.suspensions}
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {labels.settings}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/settings")}
              >
                {labels.venues}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/teams")}
              >
                {labels.teams}
              </Button>
            </CardContent>
          </Card>

          {/* Messaging */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {labels.messaging}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/admin/messages")}
              >
                {labels.messaging}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
