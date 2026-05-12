import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function AdminPlayers() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [rejectionReason, setRejectionReason] = useState<Record<number, string>>({});
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const utils = trpc.useUtils();

  // Fetch all registrations (not just pending)
  const { data: allRegistrations = [], isLoading: allLoading } = trpc.registration.getAll.useQuery();
  const { data: statsData } = trpc.registration.getStats.useQuery();

  // Check admin access - AFTER all hooks
  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="mx-auto text-red-500" size={48} />
              <p className="text-foreground font-semibold">Access Denied</p>
              <p className="text-muted-foreground text-sm">Only administrators can access this page.</p>
              <Button onClick={() => navigate("/")} className="w-full">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Mutations
  const approveMutation = trpc.registration.approve.useMutation({
    onSuccess: () => {
      toast.success("Registration approved!");
      utils.registration.getAll.invalidate();
      utils.registration.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve registration");
    },
  });

  const rejectMutation = trpc.registration.reject.useMutation({
    onSuccess: () => {
      toast.success("Registration rejected!");
      utils.registration.getAll.invalidate();
      utils.registration.getStats.invalidate();
      setRejectionReason({});
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject registration");
    },
  });

  const markPaidMutation = trpc.registration.markPaid.useMutation({
    onSuccess: () => {
      toast.success("Payment marked!");
      utils.registration.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark payment");
    },
  });

  const handleApprove = (id: number) => {
    approveMutation.mutate({ registrationId: id, language: "en" });
  };

  const handleReject = (id: number) => {
    const reason = rejectionReason[id] || "No reason provided";
    rejectMutation.mutate({ registrationId: id, reason, language: "en" });
  };

  const handleMarkPaid = (id: number) => {
    markPaidMutation.mutate({ registrationId: id, amountPaid: 1 });
  };

  const getRegistrationPrice = (type: string) => {
    const prices: Record<string, number> = {
      individual: 350,
      team: 6500,
      spare: 40,
      referee: 0,
      scorekeeper: 0,
    };
    return prices[type] || 0;
  };

  // Filter registrations by status
  const pendingRegistrations = allRegistrations.filter((r: any) => r.status === "pending");
  const approvedRegistrations = allRegistrations.filter((r: any) => r.status === "approved");
  const rejectedRegistrations = allRegistrations.filter((r: any) => r.status === "rejected");

  const RegistrationCard = ({ registration, showActions = true }: { registration: any; showActions?: boolean }) => (
    <Card className="hover:shadow-md transition">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-foreground">
                {registration.firstName} {registration.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{registration.email}</p>
            </div>
            <Badge
              variant={
                registration.status === "pending"
                  ? "secondary"
                  : registration.status === "approved"
                  ? "default"
                  : "destructive"
              }
            >
              {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
            </Badge>
          </div>

          <div className="border-t border-border pt-3 text-sm space-y-1">
            <p>
              <strong>Type:</strong> {registration.registrationType}
            </p>
            <p>
              <strong>Price:</strong> ${getRegistrationPrice(registration.registrationType)}
            </p>
            <p>
              <strong>Payment:</strong>{" "}
              <Badge variant={registration.paymentStatus === "paid" ? "default" : "secondary"}>
                {registration.paymentStatus}
              </Badge>
            </p>
            {registration.playerRating && (
              <p>
                <strong>Rating:</strong> {registration.playerRating}/10
              </p>
            )}
            {registration.position && (
              <p>
                <strong>Position:</strong> {registration.position}
              </p>
            )}
          </div>

          {showActions && (
            <div className="flex gap-2 flex-wrap">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Eye size={16} className="mr-1" /> Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {registration.firstName} {registration.lastName} - Details
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">First Name</p>
                        <p className="font-medium">{registration.firstName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Name</p>
                        <p className="font-medium">{registration.lastName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{registration.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{registration.phone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Registration Type</p>
                        <p className="font-medium">{registration.registrationType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium">{registration.status}</p>
                      </div>
                      {registration.playerRating && (
                        <div>
                          <p className="text-muted-foreground">Skill Rating</p>
                          <p className="font-medium">{registration.playerRating}/10</p>
                        </div>
                      )}
                      {registration.position && (
                        <div>
                          <p className="text-muted-foreground">Position</p>
                          <p className="font-medium">{registration.position}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Approve button - available for pending and rejected */}
              {(registration.status === "pending" || registration.status === "rejected") && (
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(registration.id)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 size={16} className="mr-1 animate-spin" />
                  ) : (
                    <CheckCircle size={16} className="mr-1" />
                  )}
                  {registration.status === "rejected" ? "Re-approve" : "Approve"}
                </Button>
              )}

              {/* Reject button - available for pending and approved */}
              {(registration.status === "pending" || registration.status === "approved") && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="flex-1">
                      <XCircle size={16} className="mr-1" /> {registration.status === "approved" ? "Revoke" : "Reject"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {registration.status === "approved" ? "Revoke Approval" : "Reject Registration"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Provide a reason for {registration.status === "approved" ? "revoking" : "rejecting"}{" "}
                        {registration.firstName}'s {registration.status === "approved" ? "approval" : "registration"}:
                      </p>
                      <Input
                        placeholder="Reason..."
                        value={rejectionReason[registration.id] || ""}
                        onChange={(e) =>
                          setRejectionReason({
                            ...rejectionReason,
                            [registration.id]: e.target.value,
                          })
                        }
                      />
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleReject(registration.id);
                        }}
                        disabled={rejectMutation.isPending}
                        className="w-full"
                      >
                        {rejectMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
                        Confirm
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {registration.paymentStatus === "unpaid" && registration.status === "approved" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkPaid(registration.id)}
                  disabled={markPaidMutation.isPending}
                >
                  {markPaidMutation.isPending && <Loader2 size={16} className="mr-1 animate-spin" />}
                  Mark Paid
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Player Management</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{statsData?.pending || 0}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{statsData?.approved || 0}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{statsData?.rejected || 0}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending ({pendingRegistrations.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedRegistrations.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedRegistrations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {allLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : pendingRegistrations.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No pending registrations
                </CardContent>
              </Card>
            ) : (
              pendingRegistrations.map((reg: any) => <RegistrationCard key={reg.id} registration={reg} />)
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {allLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : approvedRegistrations.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No approved registrations
                </CardContent>
              </Card>
            ) : (
              approvedRegistrations.map((reg: any) => <RegistrationCard key={reg.id} registration={reg} />)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {allLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : rejectedRegistrations.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No rejected registrations
                </CardContent>
              </Card>
            ) : (
              rejectedRegistrations.map((reg: any) => <RegistrationCard key={reg.id} registration={reg} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
