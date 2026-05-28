import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SeasonWithStats {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  gameCount: number;
  teamCount: number;
}

export default function SeasonManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Queries
  const { data: seasons, isLoading } = trpc.admin.getAllSeasons.useQuery();
  const deleteSeasonMutation = trpc.admin.deleteSeasonData.useMutation();
  const setActiveSeasonMutation = trpc.admin.setActiveSeason.useMutation();

  if (authLoading) return <div className="p-4">Loading...</div>;
  if (!user || user.email !== 'sarzouan@gmail.com') {
    navigate('/');
    return null;
  }

  const handleDeleteSeason = async (seasonId: number) => {
    try {
      await deleteSeasonMutation.mutateAsync({ seasonId });
      toast.success('Season deleted successfully');
      utils.admin.getAllSeasons.invalidate();
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete season');
    }
  };

  const handleSetActiveSeason = async (seasonId: number) => {
    try {
      await setActiveSeasonMutation.mutateAsync({ seasonId });
      toast.success('Season set as active');
      utils.admin.getAllSeasons.invalidate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to set active season');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/admin')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Season Management</h1>
            <p className="text-muted-foreground mt-1">View and manage all seasons</p>
          </div>
        </div>

        {/* Seasons List */}
        {isLoading ? (
          <div className="text-center py-8">Loading seasons...</div>
        ) : !seasons || seasons.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No seasons found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {seasons.map((season: SeasonWithStats) => (
              <Card key={season.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{season.name}</CardTitle>
                        {season.isActive && (
                          <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <CardDescription className="mt-2">
                        {formatDate(season.startDate)} - {formatDate(season.endDate)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {!season.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActiveSeason(season.id)}
                          className="text-green-700 border-green-200 hover:bg-green-50"
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(season.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Games</p>
                      <p className="text-2xl font-bold">{season.gameCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teams</p>
                      <p className="text-2xl font-bold">{season.teamCount}</p>
                    </div>
                  </div>
                  {season.isActive && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      <span>This is the active season. Homepage tracker will display games from this season.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Season?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>This will permanently delete the season and all associated data including:</p>
                <ul className="ml-4 space-y-1 list-disc">
                  <li>All games</li>
                  <li>All teams</li>
                  <li>All player registrations</li>
                  <li>All statistics</li>
                </ul>
                <p className="font-semibold text-foreground">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (deleteConfirm !== null) {
                handleDeleteSeason(deleteConfirm);
              }
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteSeasonMutation.isPending}
          >
            {deleteSeasonMutation.isPending ? 'Deleting...' : 'Delete Season'}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
