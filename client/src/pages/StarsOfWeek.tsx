import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star } from 'lucide-react';

export default function StarsOfWeek() {
  const [, navigate] = useLocation();
  const { data: stars = [] } = trpc.admin.getStarsOfWeek.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-8 flex items-center gap-2">
          <Star className="w-8 h-8 text-yellow-400" />
          Stars of the Week
        </h1>

        {stars.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No stars selected yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stars.map(star => (
              <Card key={star.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    {star.playerName}
                  </CardTitle>
                  <p className="text-sm text-gray-500">{star.teamName}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700">{star.reason || 'Outstanding performance'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
