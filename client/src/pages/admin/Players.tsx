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
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, ArrowLeft, Trash2, Grid3x3, List, Search, ChevronDown, ChevronUp, Calendar, Users, Shield, Star } from 'lucide-react';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const POSITION_LABELS: Record<string, string> = {
  forward: 'Forward',
  defenseman: 'Defense',
  defense: 'Defense',
  goalie: 'Goalie',
};

function formatEvalDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatGameLabel(game: any): string {
  const date = formatEvalDate(game.gameDate || game.date);
  const time = game.gameTime || game.time || '';
  return `${date}${time ? ' · ' + time : ''}`;
}

export default function Players() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: registrations = [], isLoading: loadingPlayers } = trpc.registration.getAll.useQuery();
  const { data: statsData } = trpc.registration.getStats.useQuery();
  const { data: seasons = [] } = trpc.admin.getSeasons.useQuery();
  const { data: teams = [] } = trpc.admin.getTeams.useQuery({});
  const { data: evalAssignments = [] } = trpc.admin.getAllEvalAssignments.useQuery();

  // Eval games for the season selected in the edit dialog
  const { data: evalGames = [] } = trpc.admin.getEvaluationGamesBySeasonId.useQuery(
    { seasonId: editData.seasonId || 0 },
    { enabled: !!editData.seasonId }
  );

  // Active season for defaulting the season selector
  const activeSeason = seasons.find((s: any) => s.isActive);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => {
    utils.registration.getAll.invalidate();
    utils.registration.getStats.invalidate();
    utils.admin.getAllEvalAssignments.invalidate();
  };

  const updateInfoMutation = trpc.admin.updatePlayerInfo.useMutation({
    onSuccess: () => { toast.success('Player updated'); setIsEditOpen(false); invalidate(); },
    onError: (e) => toast.error(e.message || 'Failed to update player'),
  });

  const updateStatusMutation = trpc.admin.updatePlayerStatus.useMutation({
    onSuccess: () => { toast.success('Status updated'); invalidate(); },
    onError: (e) => toast.error(e.message || 'Failed to update status'),
  });

  const assignEvalMutation = trpc.admin.assignPlayerToEvaluationGame.useMutation({
    onSuccess: () => { toast.success('Eval game assignment updated'); invalidate(); },
    onError: (e) => toast.error(e.message || 'Failed to assign eval game'),
  });

  const assignTeamMutation = trpc.admin.assignPlayerToTeam.useMutation({
    onSuccess: () => { toast.success('Team assignment updated'); invalidate(); },
    onError: (e) => toast.error(e.message || 'Failed to assign team'),
  });

  const deletePlayerMutation = trpc.admin.deletePlayer.useMutation({
    onSuccess: () => { toast.success('Player deleted'); invalidate(); setDeleteId(null); },
    onError: (e) => toast.error(e.message || 'Failed to delete player'),
  });

  const updateEmailMutation = trpc.admin.updatePlayerEmail.useMutation({
    onSuccess: () => { toast.success('Email updated'); invalidate(); },
    onError: (e) => toast.error(e.message || 'Failed to update email'),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getPlayerEvalAssignment = (registrationId: number) =>
    evalAssignments.find((a: any) => a.registrationId === registrationId);

  const getPlayerTeam = (reg: any) => {
    if (!reg.teamId) return null;
    return teams.find((t: any) => t.id === reg.teamId);
  };

  const getSeasonName = (seasonId: number | null) =>
    seasons.find((s: any) => s.id === seasonId)?.name || '—';

  const filtered = registrations.filter((r: any) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.includes(q)
      );
    }
    return true;
  });

  // ── Edit dialog open ──────────────────────────────────────────────────────
  const openEdit = (player: any) => {
    const evalAssignment = getPlayerEvalAssignment(player.id);
    setEditingPlayer(player);
    setEditData({
      firstName: player.firstName || '',
      lastName: player.lastName || '',
      email: player.email || '',
      phone: player.phone || '',
      playerRating: player.playerRating ?? '',
      registrationType: player.registrationType || 'individual',
      paymentMethod: player.paymentMethod || 'none',
      position: player.position || 'none',
      seasonId: player.seasonId || activeSeason?.id || null,
      teamId: player.teamId || null,
      // Eval assignment
      evalGameId: evalAssignment ? evalAssignment.evalGameId : null,
      evalTeam: evalAssignment ? evalAssignment.team : 'none',
    });
    setIsEditOpen(true);
  };

  // ── Save edit ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editingPlayer) return;

    const updates: any = {};
    const fullName = `${editData.firstName} ${editData.lastName}`.trim();
    const currentName = `${editingPlayer.firstName} ${editingPlayer.lastName}`.trim();
    if (fullName !== currentName) updates.name = fullName;
    if (editData.phone !== editingPlayer.phone) updates.phone = editData.phone;
    if (editData.playerRating !== (editingPlayer.playerRating ?? ''))
      updates.rating = editData.playerRating === '' ? null : Number(editData.playerRating);
    if (editData.paymentMethod !== 'none' && editData.paymentMethod !== (editingPlayer.paymentMethod || 'none'))
      updates.paymentMethod = editData.paymentMethod;
    if (editData.seasonId !== editingPlayer.seasonId) updates.seasonId = editData.seasonId;
    if (editData.position !== (editingPlayer.position || 'none'))
      updates.position = editData.position === 'none' ? null : editData.position;

    // Email change — separate mutation
    if (editData.email !== editingPlayer.email) {
      updateEmailMutation.mutate({ registrationId: editingPlayer.id, newEmail: editData.email });
    }

    // Team assignment
    const newTeamId = editData.teamId || null;
    if (newTeamId !== (editingPlayer.teamId || null)) {
      assignTeamMutation.mutate({
        registrationId: editingPlayer.id,
        teamId: newTeamId,
        seasonId: editData.seasonId || activeSeason?.id || 0,
      });
    }

    // Eval game assignment
    const prevEval = getPlayerEvalAssignment(editingPlayer.id);
    const prevEvalGameId = prevEval?.evalGameId ?? null;
    const newEvalGameId = editData.evalGameId || null;
    const newEvalTeam = editData.evalTeam === 'none' ? 'white' : editData.evalTeam;
    if (newEvalGameId !== prevEvalGameId || (newEvalGameId && editData.evalTeam !== 'none' && editData.evalTeam !== prevEval?.team)) {
      assignEvalMutation.mutate({
        registrationId: editingPlayer.id,
        evaluationGameId: newEvalGameId,
        team: newEvalTeam,
      });
    }

    if (Object.keys(updates).length > 0) {
      updateInfoMutation.mutate({ registrationId: editingPlayer.id, ...updates });
    } else if (editData.email === editingPlayer.email && newTeamId === (editingPlayer.teamId || null) && newEvalGameId === prevEvalGameId) {
      toast.info('No changes made');
      setIsEditOpen(false);
    } else {
      setIsEditOpen(false);
    }
  };

  const isSaving = updateInfoMutation.isPending || updateEmailMutation.isPending || assignEvalMutation.isPending || assignTeamMutation.isPending;

  if (!user) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Player Management</h1>
              <p className="text-sm text-gray-500">Review, approve, and assign players</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => setViewMode('grid')}>
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: statsData?.total ?? registrations.length, color: 'text-blue-600' },
            { label: 'Pending', value: statsData?.pending ?? 0, color: 'text-yellow-600' },
            { label: 'Approved', value: statsData?.approved ?? 0, color: 'text-green-600' },
            { label: 'Rejected', value: statsData?.rejected ?? 0, color: 'text-red-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map(s => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? 'default' : 'outline'}
                onClick={() => setStatusFilter(s)}
                className="capitalize"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Players List */}
        {loadingPlayers ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No players found
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
          }>
            {filtered.map((reg: any) => {
              const evalAssignment = getPlayerEvalAssignment(reg.id);
              const playerTeam = getPlayerTeam(reg);
              const isExpanded = expandedCards.has(reg.id);

              return (
                <Card key={reg.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">
                          {reg.firstName} {reg.lastName}
                        </CardTitle>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{reg.email}</p>
                      </div>
                      <Badge className={`ml-2 text-xs border ${STATUS_COLORS[reg.status] || 'bg-gray-100 text-gray-700'}`}>
                        {reg.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Key info always visible */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="text-gray-500">Phone</div>
                      <div className="font-medium">{reg.phone || '—'}</div>
                      <div className="text-gray-500">Rating</div>
                      <div className="font-medium">{reg.playerRating ?? '—'}</div>
                      <div className="text-gray-500">Position</div>
                      <div className="font-medium">{POSITION_LABELS[reg.position] || '—'}</div>
                      <div className="text-gray-500">Payment</div>
                      <div className="font-medium">{reg.paymentMethod || '—'}</div>
                    </div>

                    {/* Eval & Team assignments — highlighted */}
                    <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-blue-700">
                        <Calendar className="w-3 h-3" />
                        <span className="font-medium">Eval Game:</span>
                        <span>{evalAssignment ? `${formatEvalDate(evalAssignment.evalGameDate)} · ${evalAssignment.team === 'white' ? '⬜ White' : '⬛ Black'}` : 'Not assigned'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-700">
                        <Shield className="w-3 h-3" />
                        <span className="font-medium">Team:</span>
                        <span>{playerTeam?.name || '—'}</span>
                      </div>
                    </div>

                    {/* Expandable extra details */}
                    {isExpanded && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-t pt-2">
                        <div className="text-gray-500">Season</div>
                        <div className="font-medium">{getSeasonName(reg.seasonId)}</div>
                        <div className="text-gray-500">Type</div>
                        <div className="font-medium capitalize">{reg.registrationType}</div>
                        <div className="text-gray-500">Payment confirmed</div>
                        <div className="font-medium">{reg.paymentConfirmed ? 'Yes' : 'No'}</div>
                        <div className="text-gray-500">Registered</div>
                        <div className="font-medium">{new Date(reg.createdAt).toLocaleDateString()}</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap pt-1">
                      <Button size="sm" onClick={() => openEdit(reg)} className="flex-1">
                        Edit / Assign
                      </Button>
                      {/* Quick status toggle */}
                      <Select
                        value={reg.status}
                        onValueChange={v => updateStatusMutation.mutate({ registrationId: reg.id, status: v as any })}
                      >
                        <SelectTrigger className="w-auto h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => setExpandedCards(prev => {
                          const next = new Set(prev);
                          next.has(reg.id) ? next.delete(reg.id) : next.add(reg.id);
                          return next;
                        })}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 px-2"
                        onClick={() => setDeleteId(reg.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Edit Dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Player — {editingPlayer?.firstName} {editingPlayer?.lastName}
            </DialogTitle>
          </DialogHeader>

          {editingPlayer && (
            <div className="space-y-4">
              {/* Status */}
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <Label className="text-sm font-semibold">Status</Label>
                <Select
                  value={editingPlayer.status}
                  onValueChange={v => {
                    updateStatusMutation.mutate({ registrationId: editingPlayer.id, status: v as any });
                    setEditingPlayer({ ...editingPlayer, status: v });
                  }}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">First Name</Label>
                  <Input value={editData.firstName || ''} onChange={e => setEditData({ ...editData, firstName: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Last Name</Label>
                  <Input value={editData.lastName || ''} onChange={e => setEditData({ ...editData, lastName: e.target.value })} />
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Email</Label>
                  <Input type="email" value={editData.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Phone</Label>
                  <Input value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                </div>
              </div>

              {/* Rating + Position */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Rating (1–10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={editData.playerRating ?? ''}
                    onChange={e => setEditData({ ...editData, playerRating: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Position</Label>
                  <Select value={editData.position || 'none'} onValueChange={v => setEditData({ ...editData, position: v })}>
                    <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      <SelectItem value="forward">Forward</SelectItem>
                      <SelectItem value="defenseman">Defense</SelectItem>
                      <SelectItem value="goalie">Goalie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment */}
              <div>
                <Label className="text-xs text-gray-600">Payment Method</Label>
                <Select value={editData.paymentMethod || 'none'} onValueChange={v => setEditData({ ...editData, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="eTransfer">E-Transfer</SelectItem>
                    <SelectItem value="arrangement">Arrangement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Season */}
              <div>
                <Label className="text-xs text-gray-600">Season</Label>
                <Select
                  value={editData.seasonId?.toString() || 'none'}
                  onValueChange={v => setEditData({ ...editData, seasonId: v === 'none' ? null : parseInt(v), teamId: null, evalGameId: null })}
                >
                  <SelectTrigger><SelectValue placeholder="Select season" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {seasons.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}{s.isActive ? ' (Active)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Evaluation Game Assignment */}
              <div className="border rounded-lg p-3 space-y-3 bg-blue-50/50">
                <Label className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Evaluation Game Assignment
                </Label>
                <div>
                  <Label className="text-xs text-gray-600">Eval Game</Label>
                  <Select
                    value={editData.evalGameId?.toString() || 'none'}
                    onValueChange={v => setEditData({ ...editData, evalGameId: v === 'none' ? null : parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={editData.seasonId ? 'Select eval game' : 'Select a season first'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not assigned</SelectItem>
                      {evalGames.map((g: any) => (
                        <SelectItem key={g.id} value={g.id.toString()}>
                          {formatGameLabel(g)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editData.evalGameId && (
                  <div>
                    <Label className="text-xs text-gray-600">Eval Team</Label>
                    <Select value={editData.evalTeam || 'none'} onValueChange={v => setEditData({ ...editData, evalTeam: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not assigned</SelectItem>
                        <SelectItem value="white">⬜ White Team</SelectItem>
                        <SelectItem value="black">⬛ Black Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Team Assignment (post-eval) */}
              <div className="border rounded-lg p-3 space-y-3 bg-green-50/50">
                <Label className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> League Team Assignment
                </Label>
                <Select
                  value={editData.teamId?.toString() || 'none'}
                  onValueChange={v => setEditData({ ...editData, teamId: v === 'none' ? null : parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editData.seasonId ? 'Select team' : 'Select a season first'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {teams
                      .filter((t: any) => !editData.seasonId || t.seasonId === editData.seasonId)
                      .map((t: any) => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────────── */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the player and all their assignments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deletePlayerMutation.mutate({ registrationId: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
