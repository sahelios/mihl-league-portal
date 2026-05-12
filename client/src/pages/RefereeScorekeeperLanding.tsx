import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Users, Award, BarChart3, DollarSign, Calendar, ArrowRight } from "lucide-react";

export default function RefereeScorekeeperLanding() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [, navigate] = useLocation();

  const handleRefereeClick = () => {
    navigate("/referee-scorekeeper-apply?role=referee");
  };

  const handleScorekeeperClick = () => {
    navigate("/referee-scorekeeper-apply?role=scorekeeper");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {language === "en" ? "Referee & Scorekeeper Recruitment" : "Recrutement des Arbitres et Gardiens de Pointage"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === "en" 
                ? "Join the MIHL and help manage our games" 
                : "Rejoignez la MIHL et aidez à gérer nos matchs"}
            </p>
          </div>
          <button
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
          >
            {language === "en" ? "FR" : "EN"}
          </button>
        </div>

        {/* Hero Section */}
        <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Referee Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-5 border-blue-200 hover:shadow-lg transition">
            <CardContent className="pt-8">
              <div className="flex items-start gap-4 mb-6">
                <Award className="text-blue-600 mt-1" size={40} />
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    {language === "en" ? "Become a Referee" : "Devenez Arbitre"}
                  </h2>
                  <p className="text-foreground/80">
                    {language === "en"
                      ? "Help manage our games and ensure fair play. We welcome referees of all experience levels."
                      : "Aidez à gérer nos matchs et assurez un jeu équitable. Nous accueillons les arbitres de tous les niveaux d'expérience."}
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <DollarSign className="text-blue-600" size={20} />
                  <span className="text-foreground">
                    {language === "en" ? "Get paid per game" : "Être payé par match"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-blue-600" size={20} />
                  <span className="text-foreground">
                    {language === "en" ? "Flexible scheduling" : "Horaire flexible"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="text-blue-600" size={20} />
                  <span className="text-foreground">
                    {language === "en" ? "Join a vibrant community" : "Rejoignez une communauté dynamique"}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleRefereeClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {language === "en" ? "Apply as Referee" : "Postuler comme Arbitre"}
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </CardContent>
          </Card>

          {/* Scorekeeper Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-5 border-green-200 hover:shadow-lg transition">
            <CardContent className="pt-8">
              <div className="flex items-start gap-4 mb-6">
                <BarChart3 className="text-green-600 mt-1" size={40} />
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    {language === "en" ? "Become a Scorekeeper" : "Devenez Gardien de Pointage"}
                  </h2>
                  <p className="text-foreground/80">
                    {language === "en"
                      ? "Track game statistics and keep our records accurate. Perfect for those who love hockey and attention to detail."
                      : "Suivez les statistiques du match et maintenez nos dossiers à jour. Parfait pour ceux qui aiment le hockey et l'attention aux détails."}
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <DollarSign className="text-green-600" size={20} />
                  <span className="text-foreground">
                    {language === "en" ? "Get paid per game" : "Être payé par match"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-green-600" size={20} />
                  <span className="text-foreground">
                    {language === "en" ? "Choose your games" : "Choisissez vos matchs"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="text-green-600" size={20} />
                  <span className="text-foreground">
                    {language === "en" ? "Be part of the action" : "Faites partie de l'action"}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleScorekeeperClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {language === "en" ? "Apply as Scorekeeper" : "Postuler comme Gardien de Pointage"}
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="bg-muted/50 border-border">
          <CardContent className="pt-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {language === "en" ? "Why Join the MIHL?" : "Pourquoi Rejoindre la MIHL?"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {language === "en" ? "Professional Environment" : "Environnement Professionnel"}
                </h4>
                <p className="text-foreground/80 text-sm">
                  {language === "en"
                    ? "Work with experienced teams and well-organized leagues."
                    : "Travaillez avec des équipes expérimentées et des ligues bien organisées."}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {language === "en" ? "Community" : "Communauté"}
                </h4>
                <p className="text-foreground/80 text-sm">
                  {language === "en"
                    ? "Be part of a passionate hockey community dedicated to fair play."
                    : "Faites partie d'une communauté de hockey passionnée dédiée au jeu équitable."}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {language === "en" ? "Growth" : "Croissance"}
                </h4>
                <p className="text-foreground/80 text-sm">
                  {language === "en"
                    ? "Develop your skills and advance in the hockey officiating world."
                    : "Développez vos compétences et progressez dans le monde de l'arbitrage du hockey."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="mt-12 text-center">
          <p className="text-foreground/80 mb-4">
            {language === "en" 
              ? "Have questions? Contact us:" 
              : "Avez-vous des questions? Contactez-nous:"}
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-6">
            <a href="mailto:registration@mihl.ca" className="text-accent hover:underline font-semibold">
              registration@mihl.ca
            </a>
            <span className="text-foreground/60">•</span>
            <a href="tel:514-965-2842" className="text-accent hover:underline font-semibold">
              514-965-2842
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
