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
import { useState } from "react";

export default function AdminStaffApplications() {
  // All hooks MUST be called before any conditional returns
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [rejectionReason, setRejectionReason] = useState<Record<number, string>>({});
  const [paymentAmounts, setPaymentAmounts] = useState<Record<number, number>>({});
  const utils = trpc.useUtils();
  const { data: allApplications = [], isLoading: allLoading } = trpc.admin.getAllStaffApplications.useQuery();
  const approveMutation = trpc.admin.approveStaffApplication.useMutation({
    onSuccess: () => {
      toast.success("Staff application approved!");
      utils.admin.getAllStaffApplications.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve application");
    },
  });
  const rejectMutation = trpc.admin.rejectStaffApplication.useMutation({
    onSuccess: () => {
      toast.success("Staff application rejected!");
      utils.admin.getAllStaffApplications.invalidate();
      setRejectionReason({});
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject application");
    },
  });

  // Check admin access - AFTER all hooks
  if (user?.email !== 'sarzouan@gmail.com') {
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



  const handleApprove = (id: number) => {
    const amount = paymentAmounts[id];
    if (!amount) {
      toast.error("Please set payment amount");
      return;
    }
    approveMutation.mutate({ id, paymentAmount: amount });
  };

  const handleReject = (id: number) => {
    const reason = rejectionReason[id] || "No reason provided";
    rejectMutation.mutate({ id, reason });
  };

  // Filter applications by status
  const pendingApplications = allApplications.filter((a: any) => a.status === "pending");
  const approvedApplications = allApplications.filter((a: any) => a.status === "approved");
  const rejectedApplications = allApplications.filter((a: any) => a.status === "rejected");

  const ApplicationCard = ({ application, showActions = true }: { application: any; showActions?: boolean }) => (
    <Card className="hover:shadow-md transition">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-foreground">
                {application.firstName} {application.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{application.email}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={application.role === "referee" ? "default" : "secondary"}>
                {application.role.toUpperCase()}
              </Badge>
              <Badge
                variant={
                  application.status === "pending"
                    ? "secondary"
                    : application.status === "approved"
                    ? "default"
                    : "destructive"
                }
              >
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="border-t border-border pt-3 text-sm space-y-1">
            <p>
              <strong>Phone:</strong> {application.phone}
            </p>
            <p>
              <strong>Interac:</strong> {application.interacEmail}
            </p>
            <p>
              <strong>Experience:</strong> {application.yearsOfExperience} years
            </p>
            <p>
              <strong>Levels:</strong> {application.hockeyLevels?.join(", ") || "N/A"}
            </p>
            {application.isCertified && (
              <p>
                <strong>Certified:</strong> Yes
              </p>
            )}
            <p className="font-semibold text-accent">
              <strong>Desired Payment:</strong> ${application.desiredSalary ?? 'Not specified'}/game
            </p>
            {application.paymentAmount && (
              <p>
                <strong>Approved Rate:</strong> ${application.paymentAmount}/game
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
                      {application.firstName} {application.lastName} - Details
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">First Name</p>
                        <p className="font-medium">{application.firstName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Name</p>
                        <p className="font-medium">{application.lastName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{application.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{application.phone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Role</p>
                        <p className="font-medium">{application.role}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium">{application.status}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Experience</p>
                        <p className="font-medium">{application.yearsOfExperience} years</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Certified</p>
                        <p className="font-medium">{application.isCertified ? "Yes" : "No"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Hockey Levels</p>
                        <p className="font-medium">{application.hockeyLevels?.join(", ") || "N/A"}</p>
                      </div>
                      {application.paymentAmount && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Payment Rate</p>
                          <p className="font-medium">${application.paymentAmount}/game</p>
                        </div>
                      )}
                      {application.desiredSalary != null && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Desired Salary</p>
                          <p className="font-medium">${application.desiredSalary}/game</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Approve button - available for pending and rejected */}
              {(application.status === "pending" || application.status === "rejected") && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {application.status === "rejected" ? "Re-approve" : "Approve"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approve Staff Application</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Set payment rate for {application.firstName} {application.lastName} ({application.role}):
                      </p>
                      <Input
                        type="number"
                        placeholder="Payment per game ($)"
                        value={paymentAmounts[application.id] || ""}
                        onChange={(e) =>
                          setPaymentAmounts({
                            ...paymentAmounts,
                            [application.id]: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(application.id)}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
                        Confirm Approval
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Reject button - available for pending and approved */}
              {(application.status === "pending" || application.status === "approved") && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="flex-1">
                      <XCircle size={16} className="mr-1" /> {application.status === "approved" ? "Revoke" : "Reject"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {application.status === "approved" ? "Revoke Approval" : "Reject Application"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Provide a reason for {application.status === "approved" ? "revoking" : "rejecting"}{" "}
                        {application.firstName}'s {application.status === "approved" ? "approval" : "application"}:
                      </p>
                      <Input
                        placeholder="Reason..."
                        value={rejectionReason[application.id] || ""}
                        onChange={(e) =>
                          setRejectionReason({
                            ...rejectionReason,
                            [application.id]: e.target.value,
                          })
                        }
                      />
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(application.id)}
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            ← Back
          </Button>
          <h1 className="text-3xl font-bold">Staff Applications</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{pendingApplications.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{approvedApplications.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{rejectedApplications.length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedApplications.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedApplications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {allLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : pendingApplications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No pending applications
                </CardContent>
              </Card>
            ) : (
              pendingApplications.map((app: any) => <ApplicationCard key={app.id} application={app} />)
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {allLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : approvedApplications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No approved applications
                </CardContent>
              </Card>
            ) : (
              approvedApplications.map((app: any) => <ApplicationCard key={app.id} application={app} />)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {allLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : rejectedApplications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No rejected applications
                </CardContent>
              </Card>
            ) : (
              rejectedApplications.map((app: any) => <ApplicationCard key={app.id} application={app} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
