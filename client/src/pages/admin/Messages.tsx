import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Send, 
  History, 
  Users, 
  Languages, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  Search 
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminMessages() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [form, setForm] = useState({
    recipientType: "all" as "all" | "team" | "player",
    targetId: "",
    content: "",
  });

  // tRPC Hooks
  const utils = trpc.useUtils();
  const { data: teams, isLoading: loadingTeams } = trpc.admin.getTeams.useQuery();
  const { data: players, isLoading: loadingPlayers } = trpc.admin.getPlayers.useQuery();
  const { data: history, isLoading: loadingHistory } = trpc.admin.getMessageHistory.useQuery();

  const sendMutation = trpc.admin.sendMessage.useMutation({
    onSuccess: (data: any) => {
      const count = data?.emailsSent ?? 0;
      toast.success(
        language === "en"
          ? `Message sent to ${count} player${count !== 1 ? 's' : ''}!`
          : `Message envoyé à ${count} joueur${count !== 1 ? 's' : ''} !`
      );
      setForm({ ...form, content: "" });
      utils.admin.getMessageHistory.invalidate();
      setIsSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setIsSubmitting(false);
    },
  });

  // Admin Access Check
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    if (form.recipientType !== "all" && !form.targetId) {
      toast.error(language === "en" ? "Please select a recipient" : "Veuillez sélectionner un destinataire");
      return;
    }

    setIsSubmitting(true);
    sendMutation.mutate({
      type: form.recipientType,
      targetId: form.targetId ? parseInt(form.targetId) : undefined,
      content: form.content,
    });
  };

  const filteredHistory = history?.filter(msg => 
    msg.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Send className="h-8 w-8 text-primary" />
              {language === "en" ? "Messaging Tool" : "Outil de Messagerie"}
            </h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="flex items-center gap-2"
          >
            <Languages className="h-4 w-4" />
            {language === "en" ? "Français" : "English"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section 1: Compose Message */}
          <Card className="bg-card border-border h-fit">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Send className="h-5 w-5" />
                {language === "en" ? "Compose Message" : "Rédiger un Message"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === "en" ? "Recipient Type" : "Type de Destinataire"}</Label>
                  <Select 
                    value={form.recipientType} 
                    onValueChange={(val: any) => setForm({ ...form, recipientType: val, targetId: "" })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "en" ? "All Players" : "Tous les Joueurs"}</SelectItem>
                      <SelectItem value="team">{language === "en" ? "Specific Team" : "Équipe Spécifique"}</SelectItem>
                      <SelectItem value="player">{language === "en" ? "Specific Player" : "Joueur Spécifique"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.recipientType === "team" && (
                  <div className="space-y-2">
                    <Label>{language === "en" ? "Select Team" : "Choisir l'Équipe"}</Label>
                    <Select value={form.targetId} onValueChange={(val) => setForm({ ...form, targetId: val })}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder={language === "en" ? "Choose team..." : "Choisir..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {teams?.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.recipientType === "player" && (
                  <div className="space-y-2">
                    <Label>{language === "en" ? "Select Player" : "Choisir le Joueur"}</Label>
                    <Select value={form.targetId} onValueChange={(val) => setForm({ ...form, targetId: val })}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder={language === "en" ? "Choose player..." : "Choisir..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {players?.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.firstName} {p.lastName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{language === "en" ? "Message" : "Message"}</Label>
                    <span className="text-[10px] text-muted-foreground">{form.content.length}</span>
                  </div>
                  <Textarea
                    required
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className="bg-background min-h-[150px]"
                    placeholder={language === "en" ? "Type your message here..." : "Écrivez votre message ici..."}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || !form.content.trim()}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {language === "en" ? "Send Message" : "Envoyer le Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Section 2: Message History */}
          <Card className="bg-card border-border lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <History className="h-5 w-5" />
                {language === "en" ? "Message History" : "Historique"}
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={language === "en" ? "Search history..." : "Rechercher..."} 
                  className="pl-8 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {loadingHistory ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : filteredHistory?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 italic text-sm">
                  {language === "en" ? "No messages found" : "Aucun message trouvé"}
                </p>
              ) : (
                filteredHistory?.map((msg) => (
                  <div key={msg.id} className="border border-border rounded-lg p-3 bg-background/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-[10px]">{msg.recipientName}</Badge>
                      {msg.status === "sent" ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">
                      {expandedMessage === msg.id ? msg.content : `${msg.content.substring(0, 50)}${msg.content.length > 50 ? "..." : ""}`}
                    </p>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                      {msg.content.length > 50 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-[10px]"
                          onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
                        >
                          {expandedMessage === msg.id 
                            ? (language === "en" ? "Less" : "Moins") 
                            : (language === "en" ? "More" : "Plus")}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Section 3: Recipients Info */}
          <Card className="bg-card border-border lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === "en" ? "Recipients Stats" : "Stats Destinataires"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {language === "en" ? "Teams" : "Équipes"}
                </h4>
                {teams?.map(team => (
                  <div key={team.id} className="flex justify-between items-center p-2 rounded bg-muted/50 border border-border">
                    <span className="text-sm font-medium">{team.name}</span>
                    <Badge variant="secondary">{team.messageCount || 0}</Badge>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {language === "en" ? "Players" : "Joueurs"}
                </h4>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {players?.slice(0, 10).map(player => (
                    <div key={player.id} className="flex justify-between items-center p-2 rounded bg-muted/20 border border-border/50">
                      <span className="text-xs">{player.firstName} {player.lastName}</span>
                      <span className="text-[10px] text-muted-foreground">{player.messageCount || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}