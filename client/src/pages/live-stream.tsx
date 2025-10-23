import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StreamViewer } from '@/components/video/stream-viewer';
import { StreamBroadcaster } from '@/components/video/stream-broadcaster';
import { NativeWebRTCBroadcaster } from '@/components/video/native-webrtc-broadcaster';
import { ArrowLeft, MapPin, Clock, DollarSign, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryclient';
import type { Order } from '@shared/schema';

interface LiveStreamPageProps {
  orderId: string;
}

export default function LiveStreamPage() {
  const [match, params] = useRoute('/stream/:orderId');
  const [viewerCount, setViewerCount] = useState(0);
  
  // Check URL parameter to determine default mode
  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get('mode');
  const [userRole, setUserRole] = useState<'viewer' | 'broadcaster'>(
    modeParam === 'viewer' ? 'viewer' : 'viewer' // Default to viewer mode unless broadcaster
  );
  const queryClient = useQueryClient();

  const orderId = params?.orderId || '';

  // Fetch order details
  const { data: orderResponse, isLoading } = useQuery({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
  });

  const order = Array.isArray(orderResponse?.data) 
    ? orderResponse.data.find((o: Order) => o.id === orderId)
    : orderResponse?.data as Order | undefined;

  // Update order status to live
  const updateOrderMutation = useMutation({
    mutationFn: (status: string) => 
      apiRequest('PATCH', `/api/orders/${orderId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    }
  });

  useEffect(() => {
    // Determine user role (simplified - in real app would check authentication)
    // For demo, if order status is 'accepted' OR 'live', show broadcaster controls
    // Also allow broadcaster controls for 'pending' and 'open' status for testing
    if (order && ['pending', 'open', 'accepted', 'live'].includes(order.status)) {
      console.log('🎬 Setting user role to broadcaster for status:', order.status);
      setUserRole('broadcaster');
    } else {
      console.log('👥 Setting user role to viewer for status:', order?.status);
      setUserRole('viewer');
    }
  }, [order]);

  const handleStreamStart = () => {
    updateOrderMutation.mutate('live');
  };

  const handleStreamEnd = () => {
    console.log('🔚 Manually ending stream - setting status to done');
    updateOrderMutation.mutate('done');
  };

  // Provider cancel order mutation (with rating penalty)
  const cancelOrderMutation = useMutation({
    mutationFn: () => 
      apiRequest('POST', `/api/orders/${orderId}/cancel-by-provider`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      window.history.back(); // Go back to previous page
    }
  });

  const handleCancelOrder = () => {
    if (window.confirm('Are you sure you want to cancel this order? Cancelling will reduce your credit score as a penalty.')) {
      cancelOrderMutation.mutate();
    }
  };

  const handleGoBack = () => {
    console.log('🔙 Navigating back...');
    // Try multiple navigation methods
    try {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Fallback to home page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-medium mb-2">
              Order Not Found
            </h3>
            <p className="text-muted-foreground mb-4">
              The requested live stream could not be found.
            </p>
            <Button onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLive = order.status === 'live';

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{order.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{order.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>${order.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <Badge 
              className={
                isLive ? 'bg-red-500 text-white' :
                order.status === 'accepted' ? 'bg-orange-500 text-white' :
                'bg-gray-500 text-white'
              }
            >
              {isLive && <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />}
              {isLive ? 'Live Now' :
               order.status === 'accepted' ? 'Ready to Start' :
               order.status === 'done' ? 'Stream Ended' :
               'Waiting'}
            </Badge>
          </div>
        </div>

        {/* Mode Switch Controls */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-base">
              <strong>Current Mode:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-base font-semibold ${
                userRole === 'broadcaster' ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'
              }`}>
                {userRole === 'broadcaster' ? '🎬 Broadcaster Mode' : '👥 Viewer Mode'}
              </span>
              <span className="ml-4 text-gray-600">
                Order Status: <span className="font-mono">{order?.status}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  console.log('🔄 Switching to broadcaster mode');
                  setUserRole('broadcaster');
                }}
                variant={userRole === 'broadcaster' ? 'default' : 'outline'}
                size="sm"
                data-testid="switch-to-broadcaster"
                className={userRole === 'broadcaster' ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                🎬 {userRole === 'broadcaster' ? '✅ Active Broadcaster' : 'Switch to Broadcaster'}
              </Button>
              <Button
                onClick={() => {
                  console.log('🔄 Switching to viewer mode');
                  setUserRole('viewer');
                }}
                variant={userRole === 'viewer' ? 'default' : 'outline'}
                size="sm"
                data-testid="switch-to-viewer"
                className={userRole === 'viewer' ? 'bg-purple-500 hover:bg-purple-600' : ''}
              >
                👥 {userRole === 'viewer' ? '✅ Active Viewer' : 'Switch to Viewer'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-2">
            {userRole === 'broadcaster' ? (
              <div className="space-y-4">
                {/* Broadcaster Interface - Native WebRTC Streaming */}
                <div className="text-base text-green-600 bg-green-50 p-3 rounded border font-semibold">
                  🎬 Broadcaster Mode: You are live streaming
                </div>
                <NativeWebRTCBroadcaster
                  orderId={orderId}
                  onStreamStart={handleStreamStart}
                  onStreamEnd={handleStreamEnd}
                />
                
                {/* Provider cancel order button */}
                {(order.status === 'accepted' || order.status === 'live') && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-base text-yellow-800 mb-3">
                      As a service provider, you can cancel this order, but it will reduce your credit score
                    </p>
                    <Button 
                      onClick={handleCancelOrder}
                      variant="destructive"
                      disabled={cancelOrderMutation.isPending}
                      data-testid="cancel-order-button"
                      className="w-full"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order (score penalty)'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Viewer Interface */}
                <div className="text-base text-purple-600 bg-purple-50 p-3 rounded border font-semibold">
                  👥 Viewer Mode: Watching live stream
                </div>
                <StreamViewer
                  streamId={orderId}
                  isLive={isLive}
                  onViewerCountChange={setViewerCount}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stream Info */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Stream Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">
                    Description
                  </h4>
                  <p className="text-base text-muted-foreground">
                    {order.description}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">
                    Category
                  </h4>
                  <Badge variant="secondary">
                    {order.category || 'General'}
                  </Badge>
                </div>

                {isLive && (
                  <div>
                    <h4 className="font-medium mb-1">
                      Current Viewers
                    </h4>
                    <div className="text-4xl font-bold text-primary">
                      {viewerCount}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Stream Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base text-muted-foreground">
                      Status
                    </span>
                    <Badge variant={isLive ? 'default' : 'secondary'}>
                      {isLive ? 'Live' : 
                       order.status === 'accepted' ? 'Ready' :
                       order.status === 'done' ? 'Ended' : 'Waiting'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-base text-muted-foreground">
                      Order ID
                    </span>
                    <span className="text-base font-mono">
                      {orderId.slice(0, 8)}...
                    </span>
                  </div>

                  {userRole === 'broadcaster' && (
                    <div className="pt-2 border-t">
                      <p className="text-base text-muted-foreground">
                        You are the streamer for this order. Use the controls to start your broadcast.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}