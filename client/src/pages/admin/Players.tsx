'use client';

import { useState } from 'react';
import { useLocation } from 'wouter';

import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Players() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Dialog state
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  // Data queries
  const { data: registrations = [] } = trpc.registration.getAll.useQuery();
  const { data: teams = [] } = trpc.admin.getTeams.useQuery({});
  const { data: statsData } = trpc.registration.getStats.useQuery();

  // Mutations
  const approveMutation = trpc.registration.approve.useMutation({
    onSuccess: () => {
      toast.success('Registration approved!');
      utils.registration.getAll.invalidate();
      utils.registration.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve registration');
    },
  });

  const rejectMutation = trpc.registration.reject.useMutation({
    onSuccess: () => {
      toast.success('Registration rejected!');
      utils.registration.getAll.invalidate();
      utils.registration.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reject registration');
    },
  });

  const markPaidMutation = trpc.registration.markPaid.useMutation({
    onSuccess: () => {
      toast.success('Payment marked!');
      utils.registration.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to mark payment');
    },
  });

  const assignTeamMutation = trpc.registration.assignTeam.useMutation({
    onSuccess: () => {
      toast.success('Player assigned to team!');
      utils.registration.getAll.invalidate();
      setTeamDialogOpen(false);
      setSelectedTeam('');
      setSelectedRegistrationId(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to assign team');
    },
  });

  const updateRatingMutation = trpc.registration.updatePlayerRating.useMutation({
    onSuccess: () => {
      toast.success('Player rating updated!');
      utils.registration.getAll.invalidate();
      setRatingDialogOpen(false);
      setSelectedRating('');
      setSelectedRegistrationId(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update rating');
    },
  });

  const deletePlayerMutation = trpc.admin.deletePlayer.useMutation({
    onSuccess: () => {
      toast.success('Player deleted successfully!');
      utils.registration.getAll.invalidate();
      utils.registration.getStats.invalidate();
      setDeleteDialogOpen(false);
      setSelectedRegistrationId(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete player');
    },
  });

  const addToEvaluationGameMutation = trpc.admin.addToEvaluationGame.useMutation({
    onSuccess: () => {
      toast.success('Player added to evaluation game!');
      utils.registration.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add to evaluation game');
    },
  });

  // Handlers
  const handleApprove = (id: number) => {
    approveMutation.mutate({ registrationId: id, language: 'en' });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate({ registrationId: id, reason: 'Rejected by admin', language: 'en' });
  };

  const handleMarkPaid = (id: number) => {
    markPaidMutation.mutate({ registrationId: id, amountPaid: 1 });
  };

  const handleOpenRatingDialog = (registrationId: number, currentRating: number | null) => {
    setSelectedRegistrationId(registrationId);
    setSelectedRating((currentRating || '').toString());
    setRatingDialogOpen(true);
  };

  const handleOpenTeamDialog = (registrationId: number) => {
    setSelectedRegistrationId(registrationId);
    setSelectedTeam('');
    setTeamDialogOpen(true);
  };

  const handleOpenDeleteDialog = (registrationId: number) => {
    setSelectedRegistrationId(registrationId);
    setDeleteDialogOpen(true);
  };

  const handleUpdateRating = () => {
    if (!selectedRegistrationId || !selectedRating) {
      toast.error('Please select a valid rating');
      return;
    }
    updateRatingMutation.mutate({
      registrationId: selectedRegistrationId,
      rating: parseInt(selectedRating),
    });
  };

  const handleAssignTeam = () => {
    if (!selectedRegistrationId || !selectedTeam) {
      toast.error('Please select a team');
      return;
    }
    assignTeamMutation.mutate({
      registrationId: selectedRegistrationId,
      teamId: parseInt(selectedTeam),
    });
  };

  const handleDeletePlayer = () => {
    if (!selectedRegistrationId) {
      toast.error('No player selected');
      return;
    }
    deletePlayerMutation.mutate({ registrationId: selectedRegistrationId });
  };

  const handleAddToEvaluationGame = (registrationId: number) => {
    const today = new Date().toISOString().split('T')[0];
    addToEvaluationGameMutation.mutate({ registrationId, evaluationDate: today });
  };

  const getRegistrationPrice = (type: string) => {
    const prices: Record<string, number> = {
      individual: 350,
      team: 350,
      referee: 0,
      scorekeeper: 0,
    };
    return prices[type] || 0;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPositionDisplay = (registrationType: string) => {
    if (registrationType === 'individual') return 'Individual Player';
    if (registrationType === 'team') return 'Team Registration';
    return registrationType;
  };

  // Filter registrations based on status
  const filteredRegistrations = statusFilter === 'all'
    ? registrations
    : registrations.filter((reg: any) => reg.status === statusFilter);

  const PlayerCard = ({ registration }: { registration: any }) => (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">
                {registration.firstName} {registration.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{registration.email}</p>
            </div>
            <Badge className={getStatusColor(registration.status)}>
              {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
            </Badge>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium">{registration.registrationType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Price</p>
              <p className="font-medium">${getRegistrationPrice(registration.registrationType)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{registration.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment</p>
              <p className="font-medium">{registration.paymentStatus}</p>
            </div>
          </div>

          {/* Position */}
          <div>
            <p className="text-sm text-muted-foreground">Position</p>
            <p className="font-medium">{getPositionDisplay(registration.registrationType)}</p>
          </div>

          {/* Team & Rating Info */}
          {registration.teamId && (
            <div>
              <p className="text-sm text-muted-foreground">Team</p>
              <p className="font-medium">Team ID: {registration.teamId}</p>
            </div>
          )}

          {registration.playerRating && (
            <div>
              <p className="text-sm text-muted-foreground">Rating</p>
              <p className="font-medium">{registration.playerRating}/10</p>
            </div>
          )}

          {/* Waiting List Status */}
          {registration.waitingListStatus && registration.waitingListStatus !== 'none' && (
            <div>
              <Badge variant="outline" className="bg-orange-50">
                Waiting List: {registration.waitingListStatus}
              </Badge>
            </div>
          )}

          {/* Actions */}
          {registration.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleApprove(registration.id)}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending && <Loader2 size={16} className="mr-1 animate-spin" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => handleReject(registration.id)}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending && <Loader2 size={16} className="mr-1 animate-spin" />}
                Reject
              </Button>
            </div>
          )}

          {registration.status === 'approved' && (
            <div className="space-y-2">
              {/* Team Assignment */}
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => handleOpenTeamDialog(registration.id)}
                disabled={assignTeamMutation.isPending || teams.length === 0}
              >
                {assignTeamMutation.isPending && <Loader2 size={16} className="mr-1 animate-spin" />}
                {registration.teamId ? 'Change Team' : 'Assign Team'}
              </Button>

              {/* Rating Edit */}
              {registration.registrationType === 'individual' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOpenRatingDialog(registration.id, registration.playerRating)}
                  disabled={updateRatingMutation.isPending}
                >
                  {updateRatingMutation.isPending && <Loader2 size={16} className="mr-1 animate-spin" />}
                  {registration.playerRating ? 'Update Rating' : 'Set Rating'}
                </Button>
              )}

              {/* Payment */}
              {registration.paymentStatus === 'unpaid' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleMarkPaid(registration.id)}
                  disabled={markPaidMutation.isPending}
                >
                  {markPaidMutation.isPending && <Loader2 size={16} className="mr-1 animate-spin" />}
                  Mark Paid
                </Button>
              )}

              {/* Add to Evaluation Game */}
              {!registration.evaluationDate && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleAddToEvaluationGame(registration.id)}
                  disabled={addToEvaluationGameMutation.isPending}
                >
                  {addToEvaluationGameMutation.isPending && <Loader2 size={16} className="mr-1 animate-spin" />}
                  Add to Eval Game
                </Button>
              )}
            </div>
          )}

          {/* Delete Button - Always Available */}
          <Button
            size="sm"
            variant="destructive"
            className="w-full"
            onClick={() => handleOpenDeleteDialog(registration.id)}
            disabled={deletePlayerMutation.isPending}
          >
            <Trash2 size={16} className="mr-2" />
            Delete Player
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Player Management</h1>
        </div>

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

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 font-medium transition-colors ${
                statusFilter === status
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRegistrations.map((registration) => (
            <PlayerCard key={registration.id} registration={registration} />
          ))}
        </div>

        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No players found with the selected filter.</p>
          </div>
        )}
      </div>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Player Rating</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger>
                <SelectValue placeholder="Select rating (1-10)" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              onClick={handleUpdateRating}
              disabled={updateRatingMutation.isPending || !selectedRating}
            >
              {updateRatingMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
              Update Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Assignment Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Player to Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No teams available
                  </SelectItem>
                ) : (
                  teams.map((team: any) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              onClick={handleAssignTeam}
              disabled={assignTeamMutation.isPending || !selectedTeam || teams.length === 0}
            >
              {assignTeamMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this player? This action will remove all player data including stats, team assignments, and notifications. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlayer}
              disabled={deletePlayerMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePlayerMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
