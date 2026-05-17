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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  // Queries
  const { data: registrations = [] } = trpc.registration.getAll.useQuery();
  const { data: teams = [] } = trpc.admin.getTeams.useQuery({});
  const { data: seasons = [] } = trpc.admin.getSeasons.useQuery();
  const { data: statsData } = trpc.registration.getStats.useQuery();

  // Mutations
  const updatePlayerInfoMutation = trpc.admin.updatePlayerInfo.useMutation({
    onSuccess: () => {
      toast.success('Player info updated!');
      utils.registration.getAll.invalidate();
      setEditingId(null);
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
      setEditingId(null);
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
    return team && season ? `${season.name} - ${team.name}` : `Team ID: ${reg.teamId}`;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (reg: any) => {
    setEditingId(reg.id);
    setEditData({
      name: `${reg.firstName} ${reg.lastName}`,
      email: reg.email,
      phone: reg.phone,
      rating: reg.playerRating,
      paymentMethod: reg.paymentMethod || '',
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    
    // Get the original player data
    const originalPlayer = registrations.find(r => r.id === editingId);
    
    // If picture is a data URL, show info that S3 upload will be done later
    if (editData.playerPictureUrl && editData.playerPictureUrl.startsWith('data:')) {
      toast.info('Picture will be uploaded to storage in next phase');
    }
    
    // Check if email has changed
    if (originalPlayer && editData.email && editData.email !== originalPlayer.email) {
      // Email changed - use updatePlayerEmail mutation
      updatePlayerEmailMutation.mutate({
        registrationId: editingId,
        newEmail: editData.email,
      });
    } else {
      // No email change - use regular update
      updatePlayerInfoMutation.mutate({
        registrationId: editingId,
        ...editData,
      });
    }
  };

  const handleStatusChange = (regId: number, newStatus: string) => {
    if (newStatus === 'deleted') {
      setDeleteId(regId);
    } else {
      updatePlayerStatusMutation.mutate({
        registrationId: regId,
        status: newStatus as any,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deletePlayerMutation.mutate({ registrationId: deleteId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Player Management</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
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

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status as any)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRegistrations.map(reg => (
              <Card key={reg.id} className="hover:shadow-lg transition-shadow">
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
                  {editingId === reg.id ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="First Name"
                        value={editData.firstName || ''}
                        onChange={e => setEditData({...editData, firstName: e.target.value})}
                      />
                      <Input
                        placeholder="Last Name"
                        value={editData.lastName || ''}
                        onChange={e => setEditData({...editData, lastName: e.target.value})}
                      />
                      <Input
                        placeholder="Email"
                        value={editData.email || ''}
                        onChange={e => setEditData({...editData, email: e.target.value})}
                      />
                      <Input
                        placeholder="Phone"
                        value={editData.phone || ''}
                        onChange={e => setEditData({...editData, phone: e.target.value})}
                      />
                      <Input
                        placeholder="Rating (1-10)"
                        type="number"
                        min="1"
                        max="10"
                        value={editData.playerRating || ''}
                        onChange={e => setEditData({...editData, playerRating: e.target.value ? parseInt(e.target.value) : null})}
                      />
                      <Select value={editData.registrationType || ''} onValueChange={v => setEditData({...editData, registrationType: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual Player</SelectItem>
                          <SelectItem value="team">Team Registration</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={editData.paymentMethod || 'none'} onValueChange={v => setEditData({...editData, paymentMethod: v === 'none' ? '' : v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Payment Method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="eTransfer">eTransfer</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="arrangement">Arrangement</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={editData.seasonId?.toString() || ''} onValueChange={v => setEditData({...editData, seasonId: v ? parseInt(v) : null})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Season" />
                        </SelectTrigger>
                        <SelectContent>
                          {seasons.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={editData.teamId?.toString() || 'none'} onValueChange={v => setEditData({...editData, teamId: v === 'none' ? null : parseInt(v)})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Team</SelectItem>
                          {teams.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        type="file"
                        accept="image/*"
                        placeholder="Upload player picture"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setEditData({...editData, playerPictureUrl: event.target?.result});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit} disabled={updatePlayerInfoMutation.isPending || updatePlayerEmailMutation.isPending}>
                          {updatePlayerInfoMutation.isPending || updatePlayerEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm">
                        <div><strong>Type:</strong> {reg.registrationType}</div>
                        <div><strong>Phone:</strong> {reg.phone}</div>
                        <div><strong>Payment:</strong> {reg.paymentMethod || 'Pending'}</div>
                        <div><strong>Position:</strong> {reg.registrationType === 'individual' ? 'Individual Player' : 'Team Registration'}</div>
                        <div><strong>Team:</strong> {getTeamDisplay(reg)}</div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={() => handleEdit(reg)}>Edit</Button>
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
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {filteredRegistrations.map(reg => (
              <Card key={reg.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{reg.firstName} {reg.lastName}</div>
                      <div className="text-sm text-gray-600">{reg.email}</div>
                    </div>
                    <div className="flex-1 text-sm">
                      <div>{getTeamDisplay(reg)}</div>
                      <div className="text-gray-600">{reg.phone}</div>
                    </div>
                    <Badge className={getStatusColor(reg.status)}>
                      {reg.status}
                    </Badge>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" onClick={() => handleEdit(reg)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteId(reg.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Player</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the player and all associated data including stats, team assignments, and messages. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
