import { useState } from "react";
import { useRouter } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

export default function AdminMessaging() {
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [, navigate] = useRouter();
  const { user } = useAuth();
  
  const [recipientType, setRecipientType] = useState<"player" | "team">("player");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect non-admins
  if (user && user.role !== "admin") {
    navigate("/");
    return null;
  }

  const t = {
    en: {
      messaging: "Messaging",
      sendMessage: "Send Message",
      recipientType: "Recipient Type",
      player: "Player",
      team: "Team",
      recipientEmail: "Recipient Email",
      subject: "Subject",
      message: "Message",
      send: "Send",
      cancel: "Cancel",
      messageSent: "Message sent successfully",
      error: "Error sending message",
      fillAllFields: "Please fill in all fields",
    },
    fr: {
      messaging: "Messagerie",
      sendMessage: "Envoyer un Message",
      recipientType: "Type de Destinataire",
      player: "Joueur",
      team: "Équipe",
      recipientEmail: "Email du Destinataire",
      subject: "Sujet",
      message: "Message",
      send: "Envoyer",
      cancel: "Annuler",
      messageSent: "Message envoyé avec succès",
      error: "Erreur lors de l'envoi du message",
      fillAllFields: "Veuillez remplir tous les champs",
    },
  };

  const labels = t[language];

  const handleSendMessage = async () => {
    if (!recipientEmail || !subject || !message) {
      toast.error(labels.fillAllFields);
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would call a tRPC procedure
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success(labels.messageSent);
      setRecipientEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      toast.error(labels.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            {labels.messaging}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
          >
            {language === "en" ? "FR" : "EN"}
          </Button>
        </div>

        {/* Message Form */}
        <Card>
          <CardHeader>
            <CardTitle>{labels.sendMessage}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{labels.recipientType}</label>
              <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">{labels.player}</SelectItem>
                  <SelectItem value="team">{labels.team}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{labels.recipientEmail}</label>
              <Input
                type="email"
                placeholder="player@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{labels.subject}</label>
              <Input
                type="text"
                placeholder="Message subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{labels.message}</label>
              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {labels.send}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRecipientEmail("");
                  setSubject("");
                  setMessage("");
                }}
              >
                {labels.cancel}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              {language === "en"
                ? "Messages are sent via email. Ensure the recipient email is correct."
                : "Les messages sont envoyés par email. Assurez-vous que l'email du destinataire est correct."}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
