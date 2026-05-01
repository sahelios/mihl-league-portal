import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Suspension {
  id: number;
  playerName: string;
  team: string;
  reason: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export default function Suspensions() {
  const suspensions: Suspension[] = [
    {
      id: 1,
      playerName: "Sample Player 1",
      team: "Iron Lions",
      reason: "Excessive penalties",
      startDate: "2026-06-15",
      endDate: "2026-06-22",
      isActive: false,
    },
    {
      id: 2,
      playerName: "Sample Player 2",
      team: "Golan Guards",
      reason: "Unsportsmanlike conduct",
      startDate: "2026-06-20",
      isActive: true,
    },
  ];

  const activeSuspensions = suspensions.filter(s => s.isActive);
  const pastSuspensions = suspensions.filter(s => !s.isActive);

  const SuspensionCard = ({ suspension }: { suspension: Suspension }) => (
    <Card className="hover:shadow-md transition">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-foreground">{suspension.playerName}</p>
              <p className="text-sm text-muted-foreground">{suspension.team}</p>
            </div>
            <Badge variant={suspension.isActive ? "default" : "secondary"}>
              {suspension.isActive ? "Active" : "Expired"}
            </Badge>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-sm"><strong>Reason:</strong> {suspension.reason}</p>
            <p className="text-sm"><strong>Start Date:</strong> {new Date(suspension.startDate).toLocaleDateString()}</p>
            {suspension.endDate && (
              <p className="text-sm"><strong>End Date:</strong> {new Date(suspension.endDate).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-12 text-foreground">Suspensions</h1>

        {/* Active Suspensions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Active Suspensions</h2>
          {activeSuspensions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeSuspensions.map(suspension => (
                <SuspensionCard key={suspension.id} suspension={suspension} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No active suspensions at this time.
              </CardContent>
            </Card>
          )}
        </section>

        {/* Past Suspensions */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Past Suspensions</h2>
          {pastSuspensions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastSuspensions.map(suspension => (
                <SuspensionCard key={suspension.id} suspension={suspension} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No past suspensions.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
