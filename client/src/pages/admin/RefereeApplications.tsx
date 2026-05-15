import { ArrowLeft, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

export default function RefereeApplications() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const utils = trpc.useUtils();
  const { data: applications, isLoading } = trpc.admin.getPendingRefereeApplications.useQuery();

  const approveMutation = trpc.admin.approveRefereeApplication.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Approved & Email Sent" : "Approuvé et courriel envoyé");
      utils.admin.getPendingRefereeApplications.invalidate();
      setApprovalModalOpen(false);
    }
  });

  const rejectMutation = trpc.admin.rejectRefereeApplication.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Application rejected" : "Candidature rejetée");
      utils.admin.getPendingRefereeApplications.invalidate();
    }
  });

  const openApproveModal = (app: any) => {
    setSelectedApp(app);
    setPaymentAmount(app.role === "referee" ? 45 : 25); // Defaults
    setApprovalModalOpen(true);
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">
            {language === "en" ? "Staff Applications" : "Candidatures du Personnel"}
          </h1>
          <Button variant="outline" onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
            {language === "en" ? "FR" : "EN"}
          </Button>
        </div>

        {applications?.length === 0 ? (
          <p className="text-muted-foreground">
            {language === "en" ? "No pending applications." : "Aucune candidature en attente."}
          </p>
        ) : (
          <div className="grid gap-4">
            {applications?.map((app) => (
              <Card key={app.id}>
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{app.firstName} {app.lastName}</h3>
                      <Badge variant={app.role === "referee" ? "default" : "secondary"}>
                        {app.role.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{app.email} | {app.phone}</p>
                      <p>Interac: {app.interacEmail}</p>
                      <p>{language === "en" ? "Experience:" : "Expérience:"} {app.yearsOfExperience} yrs | Levels: {app.hockeyLevels?.join(", ")}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="default" className="bg-green-600 hover:bg-green-700 w-full md:w-auto" onClick={() => openApproveModal(app)}>
                      <CheckCircle className="mr-2 h-4 w-4" /> {language === "en" ? "Approve" : "Approuver"}
                    </Button>
                    <Button variant="destructive" className="w-full md:w-auto" onClick={() => rejectMutation.mutate({ id: app.id })}>
                      <XCircle className="mr-2 h-4 w-4" /> {language === "en" ? "Reject" : "Rejeter"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === "en" ? "Approve & Set Payment" : "Approuver et définir le paiement"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{language === "en" ? "Payment Amount ($) per game" : "Montant du paiement ($) par match"}</Label>
                <Input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)} 
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {language === "en" 
                  ? "An email will be sent automatically with login instructions and this payment rate." 
                  : "Un courriel sera envoyé automatiquement avec les instructions de connexion et ce taux."}
              </p>
            </div>
            <DialogFooter>
              <Button disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: selectedApp.id, paymentAmount })}>
                {language === "en" ? "Confirm Approval" : "Confirmer l'approbation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}