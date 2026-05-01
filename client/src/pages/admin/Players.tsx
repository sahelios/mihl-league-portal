import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface PlayerRegistration {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  team: string;
  registrationType: string;
  status: "pending" | "approved" | "rejected";
  paymentConfirmed: boolean;
  jerseyOrderConfirmed: boolean;
  createdAt: string;
}

export default function AdminPlayers() {
  const [registrations, setRegistrations] = useState<PlayerRegistration[]>([
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      team: "Iron Lions",
      registrationType: "individual",
      status: "pending",
      paymentConfirmed: false,
      jerseyOrderConfirmed: false,
      createdAt: "2026-06-01",
    },
    {
      id: 2,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      team: "Golan Guards",
      registrationType: "individual",
      status: "approved",
      paymentConfirmed: true,
      jerseyOrderConfirmed: true,
      createdAt: "2026-05-28",
    },
  ]);

  const handleApprove = (id: number) => {
    setRegistrations(
      registrations.map((r) =>
        r.id === id ? { ...r, status: "approved" } : r
      )
    );
    toast.success("Player registration approved!");
  };

  const handleReject = (id: number) => {
    setRegistrations(
      registrations.map((r) =>
        r.id === id ? { ...r, status: "rejected" } : r
      )
    );
    toast.success("Player registration rejected!");
  };

  const pendingRegistrations = registrations.filter((r) => r.status === "pending");
  const approvedRegistrations = registrations.filter((r) => r.status === "approved");
  const rejectedRegistrations = registrations.filter((r) => r.status === "rejected");

  const RegistrationCard = ({ registration }: { registration: PlayerRegistration }) => (
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
            <p><strong>Team:</strong> {registration.team}</p>
            <p><strong>Type:</strong> {registration.registrationType}</p>
            <p><strong>Payment:</strong> {registration.paymentConfirmed ? "✓ Confirmed" : "✗ Pending"}</p>
            <p><strong>Jersey:</strong> {registration.jerseyOrderConfirmed ? "✓ Confirmed" : "✗ Pending"}</p>
          </div>

          {registration.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(registration.id)}
              >
                <CheckCircle size={16} className="mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => handleReject(registration.id)}
              >
                <XCircle size={16} className="mr-1" /> Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-12 text-foreground">Player Management</h1>

        {/* Pending Registrations */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Clock size={24} className="text-accent" />
            <h2 className="text-2xl font-bold text-foreground">Pending Approvals ({pendingRegistrations.length})</h2>
          </div>
          {pendingRegistrations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingRegistrations.map((reg) => (
                <RegistrationCard key={reg.id} registration={reg} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No pending registrations.
              </CardContent>
            </Card>
          )}
        </section>

        {/* Approved Registrations */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle size={24} className="text-green-600" />
            <h2 className="text-2xl font-bold text-foreground">Approved ({approvedRegistrations.length})</h2>
          </div>
          {approvedRegistrations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {approvedRegistrations.map((reg) => (
                <RegistrationCard key={reg.id} registration={reg} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No approved registrations yet.
              </CardContent>
            </Card>
          )}
        </section>

        {/* Rejected Registrations */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <XCircle size={24} className="text-red-600" />
            <h2 className="text-2xl font-bold text-foreground">Rejected ({rejectedRegistrations.length})</h2>
          </div>
          {rejectedRegistrations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rejectedRegistrations.map((reg) => (
                <RegistrationCard key={reg.id} registration={reg} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No rejected registrations.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
