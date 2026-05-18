'use client';

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, ArrowLeft, Trash2, Grid3x3, List } from 'lucide-react';
import { toast } from 'sonner';

export default function Players() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // State
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Queries
  const { data: registrations = [] } = trpc.registration.getAll.useQuery();
  const { data: teams = [] } = trpc.admin.getTeams.useQuery({});
  const { data: seasons = [] } = trpc.admin.getSeasons.useQuery();
  const { data: statsData } = trpc.registration.getStats.useQuery();

  // Mutations
  const updatePlayerInfoMutation = trpc.admin.updatePlayerInfo.useMutation({
    onSuccess: () => {
      toast.success('Player info updated!');
      setIsEditDialogOpen(false);
      setEditingPlayer(null);
      setEditData({});
      utils.registration.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update player');
    },
  });

  const updatePlayerStatusMutation = trpc.admin.updatePlayerStatus.useMutation({
    onSuccess: () => {
      toast.success('Player status updated!');
      utils.registration.getAll.invalidate();
      utils.registration.getStats.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const deletePlayerMutation = trpc.admin.deletePlayer.useMutation({
    onSuccess: () => {
      toast.success('Player deleted!');
      utils.registration.getAll.invalidate();
      utils.registration.getStats.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete player');
    },
  });

  const updatePlayerEmailMutation = trpc.admin.updatePlayerEmail.useMutation({
    onSuccess: () => {
      toast.success('Email updated! Verification email sent to new address.');
      utils.registration.getAll.invalidate();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update email');
    },
  });

  // Filtered registrations
  const filteredRegistrations = registrations.filter(reg => {
    if (statusFilter === 'all') return true;
    return reg.status === statusFilter;
  });

  // Get team display name
  const getTeamDisplay = (reg: any) => {
    if (!reg.teamId) return 'No Team';
    const team = teams.find(t => t.id === reg.teamId);
    const season = seasons.find(s => s.id === team?.seasonId);
    if (team && season) return `${season.name} - ${team.name}`;
    if (team) return team.name;
    return `Team ID: ${reg.teamId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditClick = (player: any) => {
    setEditingPlayer(player);
    setEditData({
      firstName: player.firstName || '',
      lastName: player.lastName || '',
      email: player.email || '',
      phone: player.phone || '',
      playerRating: player.playerRating || null,
      registrationType: player.registrationType || 'individual',
      paymentMethod: player.paymentMethod || 'none',
      seasonId: player.seasonId || null,
      teamId: player.teamId || null,
      playerPictureUrl: player.playerPictureUrl || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingPlayer) return;

    const updates: any = {};
    if (editData.firstName !== editingPlayer.firstName) updates.firstName = editData.firstName;
    if (editData.lastName !== editingPlayer.lastName) updates.lastName = editData.lastName;
    if (editData.phone !== editingPlayer.phone) updates.phone = editData.phone;
    if (editData.playerRating !== editingPlayer.playerRating) updates.playerRating = editData.playerRating;
    if (editData.registrationType !== editingPlayer.registrationType) updates.registrationType = editData.registrationType;
    if (editData.paymentMethod !== editingPlayer.paymentMethod) updates.paymentMethod = editData.paymentMethod;
    if (editData.teamId !== editingPlayer.teamId) updates.teamId = editData.teamId;

    if (editData.email !== editingPlayer.email) {
      updatePlayerEmailMutation.mutate({
        registrationId: editingPlayer.id,
        newEmail: editData.email,
      });
    }

    if (Object.keys(updates).length > 0) {
      updatePlayerInfoMutation.mutate({
        registrationId: editingPlayer.id,
        ...updates,
      });
    } else if (editData.email === editingPlayer.email) {
      setIsEditDialogOpen(false);
      toast.info('No changes made');
    }
  };

  const handleStatusChange = (registrationId: number, newStatus: string) => {
    updatePlayerStatusMutation.mutate({
      registrationId,
      status: newStatus,
    });
  };

  const handleDeleteClick = (registrationId: number) => {
    deletePlayerMutation.mutate({ registrationId });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">Player Management</h1>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{statsData?.pending || 0}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{statsData?.approved || 0}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{statsData?.rejected || 0}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'approved' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('approved')}
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('rejected')}
          >
            Rejected
          </Button>
        </div>

        {/* Players Grid/List */}
        {filteredRegistrations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No players found
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredRegistrations.map((reg) => (
              <Card key={reg.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{reg.firstName} {reg.lastName}</CardTitle>
                      <p className="text-sm text-gray-600">{reg.email}</p>
                    </div>
                    <Badge className={getStatusColor(reg.status)}>
                      {reg.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <div><strong>Type:</strong> {reg.registrationType}</div>
                    <div><strong>Phone:</strong> {reg.phone}</div>
                    <div><strong>Payment:</strong> {reg.paymentMethod || 'Pending'}</div>
                    <div><strong>Position:</strong> {reg.registrationType === 'individual' ? 'Individual Player' : 'Team Registration'}</div>
                    <div><strong>Team:</strong> {getTeamDisplay(reg)}</div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => handleEditClick(reg)}>Edit</Button>
                    <Select value={reg.status} onValueChange={v => handleStatusChange(reg.id, v)}>
                      <SelectTrigger className="w-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="deleted">Delete</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteId(reg.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">First Name</label>
              <Input
                value={editData.firstName || ''}
                onChange={e => setEditData({...editData, firstName: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <Input
                value={editData.lastName || ''}
                onChange={e => setEditData({...editData, lastName: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={editData.email || ''}
                onChange={e => setEditData({...editData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={editData.phone || ''}
                onChange={e => setEditData({...editData, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Rating (1-10)</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={editData.playerRating || ''}
                onChange={e => setEditData({...editData, playerRating: e.target.value ? parseInt(e.target.value) : null})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Registration Type</label>
              <Select value={editData.registrationType || ''} onValueChange={v => setEditData({...editData, registrationType: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual Player</SelectItem>
                  <SelectItem value="team">Team Registration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={editData.paymentMethod || 'none'} onValueChange={v => setEditData({...editData, paymentMethod: v === 'none' ? '' : v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="etransfer">E-Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSaveEdit} 
                disabled={updatePlayerInfoMutation.isPending || updatePlayerEmailMutation.isPending}
              >
                {updatePlayerInfoMutation.isPending || updatePlayerEmailMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this player? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && handleDeleteClick(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
