import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';

export default function Staff() {
  const [, navigate] = useLocation();

  const staffMembers = [
    {
      id: 1,
      name: 'Simon Arzouan',
      role: 'League Commissioner',
      email: 'simon@mihl.ca',
      phone: '514-965-2842'
    },
    {
      id: 2,
      name: 'Registration Coordinator',
      role: 'Player Registration',
      email: 'registration@mihl.ca',
      phone: '514-965-2842'
    }
  ];

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
          <Users className="w-8 h-8" />
          League Staff
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {staffMembers.map(member => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">{member.name}</CardTitle>
                <p className="text-sm text-gray-500">{member.role}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">
                      {member.email}
                    </a>
                  </p>
                  <p className="text-sm">
                    <strong>Phone:</strong>{' '}
                    <a href={`tel:${member.phone}`} className="text-blue-600 hover:underline">
                      {member.phone}
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-blue-50">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              For league inquiries, registration questions, or general information, please reach out to our staff:
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <strong>General Inquiries:</strong>{' '}
                <a href="mailto:registration@mihl.ca" className="text-blue-600 hover:underline">
                  registration@mihl.ca
                </a>
              </li>
              <li>
                <strong>Phone:</strong>{' '}
                <a href="tel:514-965-2842" className="text-blue-600 hover:underline">
                  514-965-2842
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
