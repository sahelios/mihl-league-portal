import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Users, CheckCircle, XCircle, BarChart3, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Check admin access
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
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
    );
  }

  // Fetch registration statistics
  const { data: statsData, isLoading } = trpc.registration.getStats.useQuery();

  const stats = statsData || {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  };

  const adminMenuItems = [
    {
      title: "Player Management",
      description: "Review and approve player registrations",
      icon: Users,
      href: "/admin/players",
      badge: stats.pending > 0 ? stats.pending : null,
      color: "text-blue-600",
    },
    {
      title: "Game Management",
      description: "Enter scores and manage games",
      icon: BarChart3,
      href: "/admin/games",
      color: "text-green-600",
    },
    {
      title: "News Management",
      description: "Create and manage news posts",
      icon: BarChart3,
      href: "/admin/news",
      color: "text-purple-600",
    },
    {
      title: "Stars of the Week",
      description: "Select and manage star players",
      icon: BarChart3,
      href: "/admin/stars",
      color: "text-yellow-600",
    },
    {
      title: "Suspensions",
      description: "Manage player suspensions",
      icon: BarChart3,
      href: "/admin/suspensions",
      color: "text-red-600",
    },
    {
      title: "Messages",
      description: "Send messages to players and teams",
      icon: BarChart3,
      href: "/admin/messages",
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your league.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Registrations</p>
                  <p className="text-3xl font-bold text-foreground">{isLoading ? <Loader2 className="animate-spin" /> : stats.total}</p>
                </div>
                <Users className="text-accent opacity-20" size={40} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-accent">{isLoading ? <Loader2 className="animate-spin" /> : stats.pending}</p>
                </div>
                <AlertCircle className="text-accent opacity-20" size={40} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{isLoading ? <Loader2 className="animate-spin" /> : stats.approved}</p>
                </div>
                <CheckCircle className="text-green-600 opacity-20" size={40} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{isLoading ? <Loader2 className="animate-spin" /> : stats.rejected}</p>
                </div>
                <XCircle className="text-red-600 opacity-20" size={40} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Admin Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="hover:shadow-lg transition cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <Icon className={`${item.color} opacity-70`} size={32} />
                        {item.badge && (
                          <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                      <Button variant="outline" size="sm" className="w-full">
                        Go to {item.title}
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        {stats.pending > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-foreground">Action Required</h2>
            <Card>
              <CardHeader>
                <CardTitle>Pending Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  You have <strong>{stats.pending}</strong> pending registration{stats.pending !== 1 ? "s" : ""} awaiting approval.
                </p>
                <Link href="/admin/players">
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Review Registrations
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
