import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import RefereeScorekeeper from './RefereeScorekeeper';

/**
 * Smart router that redirects admins to staff applications
 * and shows the registration form to public users
 */
export default function RefereeScorekeeperRouter() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // If user is authenticated and is an admin, redirect to staff applications
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/admin/staff-applications');
    }
  }, [isAuthenticated, user, navigate]);

  // Show loading while checking auth status
  if (isAuthenticated && user?.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Redirecting to staff applications...</p>
        </div>
      </div>
    );
  }

  // Show the public registration form for non-admin users
  return <RefereeScorekeeper />;
}
