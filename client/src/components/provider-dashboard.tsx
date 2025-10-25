import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Users, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  price: string;
  duration: number;
  requester: string;
  status: 'pending' | 'accepted' | 'completed';
  createdAt: string;
}

interface ProviderDashboardProps {
  onRequestAccepted?: (requestId: string) => void;
  onLocationVerified?: (requestId: string) => void;
  onStreamStarted?: (requestId: string) => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  onRequestAccepted,
  onLocationVerified,
  onStreamStarted,
}) => {
  const [requests, setRequests] = useState<StreamRequest[]>([
    {
      id: 'tokyo-food-tour',
      title: 'Tokyo Street Food Tour',
      description: 'Live street food experience in Tokyo, visiting famous food markets and trying local delicacies',
      location: 'Tokyo, Japan',
      price: '25.00',
      duration: 60,
      requester: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      status: 'pending',
      createdAt: '2 hours ago'
    },
    {
      id: 'paris-cafe-culture',
      title: 'Paris Cafe Culture Experience',
      description: 'Experience authentic Parisian cafe culture, visiting historic cafes and learning about French coffee traditions',
      location: 'Paris, France',
      price: '30.00',
      duration: 45,
      requester: '0x8f2a0d0c9b1a2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4',
      status: 'pending',
      createdAt: '1 hour ago'
    },
    {
      id: 'london-museum-tour',
      title: 'British Museum Virtual Tour',
      description: 'Guided tour through the British Museum, exploring ancient artifacts and world history',
      location: 'London, UK',
      price: '40.00',
      duration: 90,
      requester: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7',
      status: 'accepted',
      createdAt: '30 minutes ago'
    }
  ]);

  const { toast } = useToast();

  const acceptRequest = async (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'accepted' as const } : req
    ));
    
    onRequestAccepted?.(requestId);
    
    toast({
      title: "Request Accepted",
      description: "You have accepted this stream request. Location verification required.",
    });
  };

  const verifyLocation = async (requestId: string) => {
    // Mock location verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onLocationVerified?.(requestId);
    
    toast({
      title: "Location Verified",
      description: "Your location has been verified. You can now start streaming.",
    });
  };

  const startStream = async (requestId: string) => {
    onStreamStarted?.(requestId);
    
    toast({
      title: "Stream Started",
      description: "Your live stream has started. Viewers can now join.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="text-blue-600">Accepted</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Provider Dashboard</h2>
        <Badge variant="secondary" className="text-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified Provider
        </Badge>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id} className="w-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{request.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {request.description}
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{request.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">${request.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{request.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{request.requester.slice(0, 6)}...{request.requester.slice(-4)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {request.status === 'pending' && (
                  <Button 
                    onClick={() => acceptRequest(request.id)}
                    className="flex-1"
                  >
                    Accept Request
                  </Button>
                )}
                
                {request.status === 'accepted' && (
                  <>
                    <Button 
                      onClick={() => verifyLocation(request.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      Verify Location
                    </Button>
                    <Button 
                      onClick={() => startStream(request.id)}
                      className="flex-1"
                    >
                      Start Stream
                    </Button>
                  </>
                )}
                
                {request.status === 'completed' && (
                  <Button disabled className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProviderDashboard;
