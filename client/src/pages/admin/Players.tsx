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

export default function AdminPlayers() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [rejectionReason, setRejectionReason] = useState<Record<number, string>>({});
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const utils = trpc.useUtils();

  // Check admin access
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
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
    );
  }

  // Fetch all registrations by status
  const { data: pendingData, isLoading: pendingLoading } = trpc.registration.getPending.useQuery();
  const { data: statsData } = trpc.registration.getStats.useQuery();

  // Mutations
  const approveMutation = trpc.registration.approve.useMutation({
    onSuccess: () => {
      toast.success("Registration approved!");
      utils.registration.getPending.invalidate();
      utils.registration.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve registration");
    },
  });

  const rejectMutation = trpc.registration.reject.useMutation({
    onSuccess: () => {
      toast.success("Registration rejected!");
      utils.registration.getPending.invalidate();
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
      utils.registration.getPending.invalidate();
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

              {registration.status === "pending" && (
                <>
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
                    Approve
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="destructive" className="flex-1">
                        <XCircle size={16} className="mr-1" /> Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Registration</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Provide a reason for rejecting {registration.firstName}'s registration:
                        </p>
                        <Input
                          placeholder="Reason for rejection..."
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
                          Confirm Rejection
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
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

  const pending = pendingData || [];
  const approved = statsData?.approved || 0;
  const rejected = statsData?.rejected || 0;
  const total = statsData?.total || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Player Management</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-accent">{pending.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">{approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-red-600">{rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-foreground">{total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs for different statuses */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock size={16} />
              Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle size={16} />
              Approved ({approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle size={16} />
              Rejected ({rejected})
            </TabsTrigger>
          </TabsList>

          {/* Pending Registrations */}
          <TabsContent value="pending" className="mt-6">
            {pendingLoading ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Loader2 className="mx-auto animate-spin" />
                </CardContent>
              </Card>
            ) : pending.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pending.map((reg: any) => (
                  <RegistrationCard key={reg.id} registration={reg} showActions={true} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No pending registrations.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Approved Registrations */}
          <TabsContent value="approved" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {approved > 0 ? (
                pending
                  .filter((reg: any) => reg.status === "approved")
                  .map((reg: any) => <RegistrationCard key={reg.id} registration={reg} showActions={true} />)
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No approved registrations yet.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Rejected Registrations */}
          <TabsContent value="rejected" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rejected > 0 ? (
                pending
                  .filter((reg: any) => reg.status === "rejected")
                  .map((reg: any) => <RegistrationCard key={reg.id} registration={reg} showActions={false} />)
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No rejected registrations.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
