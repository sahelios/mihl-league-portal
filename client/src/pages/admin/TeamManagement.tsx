"use client";

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TeamManagement() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // State
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  // Queries
  const { data: seasons = [] } = trpc.admin.getSeasons.useQuery();
  const { data: teams = [] } = trpc.admin.getTeams.useQuery(
    selectedSeasonId ? { seasonId: selectedSeasonId } : undefined,
    { enabled: !!selectedSeasonId }
  );
  const { data: registrations = [] } = trpc.registration.getAll.useQuery({} as any, { enabled: !!selectedSeasonId });
  const { data: waitingList = [] } = trpc.admin.getWaitingList.useQuery({} as any, { enabled: !!selectedSeasonId });

  // Mutations
  const assignTeamMutation = trpc.admin.assignTeam.useMutation({
    onSuccess: () => {
      toast.success("Player assigned to team!");
      utils.registration.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign player");
    },
  });

  // Filter players by status
  const pendingPlayers = registrations.filter(r => r.status === "pending" && !r.teamId);
  const approvedPlayers = registrations.filter(r => r.status === "approved" && !r.teamId);
  const waitingListPlayers = waitingList.filter(w => !registrations.find(r => r.id === w.playerId && r.teamId));

  const teamPlayers = registrations.filter(r => r.teamId === selectedTeamId);

  const handleAssignPlayer = (playerId: number) => {
    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }
    if (!selectedSeasonId) {
      toast.error("Please select a season");
      return;
    }
    assignTeamMutation.mutate({ registrationId: playerId, teamId: selectedTeamId });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold">Team Management</h1>

        {/* Season & Team Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Select Season</label>
            <Select value={selectedSeasonId?.toString() || ""} onValueChange={v => {
              setSelectedSeasonId(v ? parseInt(v) : null);
              setSelectedTeamId(null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Select Team</label>
            <Select value={selectedTeamId?.toString() || ""} onValueChange={v => setSelectedTeamId(v ? parseInt(v) : null)} disabled={!selectedSeasonId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(t => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedTeamId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Players */}
            <Card>
              <CardHeader>
                <CardTitle>Team Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teamPlayers.length > 0 ? (
                    teamPlayers.map(p => (
                      <div key={p.id} className="p-3 bg-gray-100 rounded flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{p.firstName} {p.lastName}</p>
                          <p className="text-sm text-gray-600">{p.email}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No players assigned yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Available Players */}
            <Card>
              <CardHeader>
                <CardTitle>Available Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingPlayers.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Pending ({pendingPlayers.length})</h4>
                      <div className="space-y-2">
                        {pendingPlayers.map(p => (
                          <div key={p.id} className="p-2 bg-yellow-50 rounded flex justify-between items-center">
                            <div className="text-sm">
                              <p className="font-medium">{p.firstName} {p.lastName}</p>
                              <p className="text-gray-600">{p.email}</p>
                            </div>
                            <Button size="sm" onClick={() => handleAssignPlayer(p.id)} disabled={assignTeamMutation.isPending}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {approvedPlayers.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Approved ({approvedPlayers.length})</h4>
                      <div className="space-y-2">
                        {approvedPlayers.map(p => (
                          <div key={p.id} className="p-2 bg-green-50 rounded flex justify-between items-center">
                            <div className="text-sm">
                              <p className="font-medium">{p.firstName} {p.lastName}</p>
                              <p className="text-gray-600">{p.email}</p>
                            </div>
                            <Button size="sm" onClick={() => handleAssignPlayer(p.id)} disabled={assignTeamMutation.isPending}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {waitingListPlayers.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Waiting List ({waitingListPlayers.length})</h4>
                      <div className="space-y-2">
                        {waitingListPlayers.map(w => {
                          const player = registrations.find(r => r.id === w.playerId);
                          return player ? (
                            <div key={w.id} className="p-2 bg-blue-50 rounded flex justify-between items-center">
                              <div className="text-sm">
                                <p className="font-medium">{player.firstName} {player.lastName}</p>
                                <p className="text-gray-600">{player.email}</p>
                              </div>
                              <Button size="sm" onClick={() => handleAssignPlayer(player.id)} disabled={assignTeamMutation.isPending}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {pendingPlayers.length === 0 && approvedPlayers.length === 0 && waitingListPlayers.length === 0 && (
                    <p className="text-gray-500">No available players</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
