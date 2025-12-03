import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StreamViewer } from '@/components/video/stream-viewer';
import { StreamBroadcaster } from '@/components/video/stream-broadcaster';
import { NativeWebRTCBroadcaster } from '@/components/video/native-webrtc-broadcaster';
import { TranslatedText } from '@/components/translated-text';
import { ArrowLeft, MapPin, Clock, DollarSign, XCircle, Video, Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { Order } from '@shared/schema';

interface LiveStreamPageProps {
  orderId: string;
}

export default function LiveStreamPage() {
  const [match, params] = useRoute('/stream/:orderId');
  const [viewerCount, setViewerCount] = useState(0);
  const { user, isLoaded } = useUser(); // Get Clerk user
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment'); // 'paid' or 'pending'
  const queryClient = useQueryClient();

  const orderId = params?.orderId || '';
  const CURRENT_USER_ID = user?.id || 'guest';

  // Check if scheduled date has arrived
  const [canStartBroadcast, setCanStartBroadcast] = useState(false);
  
  // For manual mode switching (debugging only)
  const [manualMode, setManualMode] = useState<'viewer' | 'broadcaster' | null>(null);

  // Fetch current user data to get their role
  const { data: userData } = useQuery({
    queryKey: [`/api/users/${CURRENT_USER_ID}`],
    queryFn: async () => {
      if (CURRENT_USER_ID === 'guest') return null;
      const response = await apiRequest('GET', `/api/users/${CURRENT_USER_ID}`);
      const data = await response.json();
      return data;
    },
    enabled: CURRENT_USER_ID !== 'guest' && isLoaded,
  });

  // Fetch order details
  const { data: orderResponse, isLoading } = useQuery<{ data: Order | Order[] }>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
  });

  const order = Array.isArray(orderResponse?.data) 
    ? orderResponse.data.find((o: Order) => o.id === orderId)
    : orderResponse?.data as Order | undefined;

  // Determine actual user role from database
  const userRole = (userData?.data?.role || userData?.role) === 'provider' ? 'provider' : 'customer';

  // Calculate display mode synchronously based on order relationship
  const displayMode: 'viewer' | 'broadcaster' | null = (() => {
    if (manualMode) return manualMode; // Allow manual override for testing
    if (!order || CURRENT_USER_ID === 'guest') return null;
    
    // Provider/broadcaster: The person assigned to provide the service
    const isProvider = order.providerId === CURRENT_USER_ID;
    
    if (isProvider) {
      console.log('[DisplayMode] User is PROVIDER - broadcaster mode');
      return 'broadcaster';
    }
    
    // Everyone else is a viewer (customer or spectator)
    console.log('[DisplayMode] User is VIEWER - viewer mode');
    return 'viewer';
  })();

  // Update order status to live
  const updateOrderMutation = useMutation({
    mutationFn: (status: string) => 
      apiRequest('PATCH', `/api/orders/${orderId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    }
  });

  useEffect(() => {
    // Check if scheduled date has arrived
    if (order?.scheduledAt) {
      const scheduledDate = new Date(order.scheduledAt);
      const now = new Date();
      setCanStartBroadcast(scheduledDate <= now);
    } else {
      setCanStartBroadcast(true); // If no scheduled date, allow broadcast
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
    if (window.confirm('确定要取消订单吗？取消订单会降低您的信用评分作为惩罚。')) {
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
            <h3 className="text-lg font-medium mb-2">
              <TranslatedText context="error">Order Not Found</TranslatedText>
            </h3>
            <p className="text-muted-foreground mb-4">
              <TranslatedText context="error">The requested live stream could not be found.</TranslatedText>
            </p>
            <Button onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              <TranslatedText context="error">Go Back</TranslatedText>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLive = order.status === 'live';

  return (
    <div className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="mb-3 sm:mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <TranslatedText context="error">Back</TranslatedText>
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{order.title}</h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{order.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 flex-shrink-0" />
                  <span>${order.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{order.createdAt ? new Date(order.createdAt as Date).toLocaleDateString() : 'N/A'}</span>
                  <span className="sm:hidden">{order.createdAt ? new Date(order.createdAt as Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}</span>
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
              <TranslatedText>
                {isLive ? 'Live Now' :
                 order.status === 'accepted' ? 'Ready to Start' :
                 order.status === 'done' ? 'Stream Ended' :
                 'Waiting'}
              </TranslatedText>
            </Badge>
          </div>
        </div>

        {/* 模式切换控制 */}
        <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <div className="text-sm w-full lg:w-auto">
              <strong><TranslatedText context="home">Current Mode</TranslatedText>：</strong>
              <span className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-semibold gap-1 ${
                displayMode === 'broadcaster' ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'
              }`}>
                {displayMode === 'broadcaster' ? <Video className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                <TranslatedText context="home">{displayMode === 'broadcaster' ? 'Broadcaster Mode' : 'Viewer Mode'}</TranslatedText>
              </span>
              <div className="mt-2 lg:mt-0 lg:inline-block">
                <span className="block lg:inline lg:ml-4 text-gray-600">
                  <TranslatedText context="home">User Role</TranslatedText>: <span className="font-mono">{userRole}</span>
                </span>
                <span className="block lg:inline lg:ml-4 text-gray-600">
                  <TranslatedText context="home">Order Status</TranslatedText>: <span className="font-mono">{order?.status}</span>
                </span>
              </div>
            </div>
            <div className="flex gap-2 w-full lg:w-auto flex-wrap">
              <Button
                onClick={() => {
                  console.log('[Manual] Switching to broadcaster mode');
                  setManualMode('broadcaster');
                }}
                variant={displayMode === 'broadcaster' ? 'default' : 'outline'}
                size="sm"
                disabled={displayMode === 'broadcaster'}
                data-testid="switch-to-broadcaster"
                className={`flex-1 lg:flex-initial ${displayMode === 'broadcaster' ? 'bg-green-500 hover:bg-green-600' : ''}`}
              >
                <Video className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline"><TranslatedText context="home">{displayMode === 'broadcaster' ? 'Broadcaster Mode (Current)' : 'Switch to Broadcaster'}</TranslatedText></span>
                <span className="sm:hidden"><TranslatedText context="home">{displayMode === 'broadcaster' ? 'Broadcaster' : 'Broadcast'}</TranslatedText></span>
              </Button>
              <Button
                onClick={() => {
                  console.log('[Manual] Switching to viewer mode');
                  setManualMode('viewer');
                }}
                variant={displayMode === 'viewer' ? 'default' : 'outline'}
                size="sm"
                disabled={displayMode === 'viewer'}
                data-testid="switch-to-viewer"
                className={`flex-1 lg:flex-initial ${displayMode === 'viewer' ? 'bg-purple-500 hover:bg-purple-600' : ''}`}
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline"><TranslatedText context="home">{displayMode === 'viewer' ? 'Viewer Mode (Current)' : 'Switch to Viewer'}</TranslatedText></span>
                <span className="sm:hidden"><TranslatedText context="home">{displayMode === 'viewer' ? 'Viewer' : 'View'}</TranslatedText></span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-2">
            {!displayMode ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : displayMode === 'broadcaster' ? (
              <div className="space-y-4">
                {/* Broadcaster interface - Native WebRTC streaming */}
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded border font-semibold flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <TranslatedText>Broadcaster Mode: You are streaming</TranslatedText>
                </div>
                {!canStartBroadcast && order.scheduledAt && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded border font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      <TranslatedText>Broadcast will be available at:</TranslatedText> {new Date(order.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                )}
                <NativeWebRTCBroadcaster
                  orderId={orderId}
                  onStreamStart={handleStreamStart}
                  onStreamEnd={handleStreamEnd}
                  canStartBroadcast={canStartBroadcast}
                />
                
                {/* Provider cancel order button */}
                {(order.status === 'accepted' || order.status === 'live') && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-3">
                      <TranslatedText context="order_management">As a service provider, you can cancel the order, but this will decrease your credit score</TranslatedText>
                    </p>
                    <Button 
                      onClick={handleCancelOrder}
                      variant="destructive"
                      disabled={cancelOrderMutation.isPending}
                      data-testid="cancel-order-button"
                      className="w-full"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      <TranslatedText context="order_management">
                        {cancelOrderMutation.isPending ? 'Canceling...' : 'Cancel Order (Will Deduct Points)'}
                      </TranslatedText>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Viewer interface */}
                <div className="text-sm text-purple-600 bg-purple-50 p-3 rounded border font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <TranslatedText>Viewer Mode: Watching stream</TranslatedText>
                </div>
                {displayMode === 'viewer' && (
                  <StreamViewer
                    streamId={orderId}
                    isLive={isLive}
                    onViewerCountChange={setViewerCount}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stream Info */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <TranslatedText>Stream Information</TranslatedText>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">
                    <TranslatedText>Description</TranslatedText>
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {order.description}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">
                    <TranslatedText>Category</TranslatedText>
                  </h4>
                  <Badge variant="secondary">
                    {order.category || 'General'}
                  </Badge>
                </div>

                {isLive && (
                  <div>
                    <h4 className="font-medium mb-1">
                      <TranslatedText>Current Viewers</TranslatedText>
                    </h4>
                    <div className="text-2xl font-bold text-primary">
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
                  <TranslatedText>Stream Status</TranslatedText>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      <TranslatedText>Status</TranslatedText>
                    </span>
                    <Badge variant={isLive ? 'default' : 'secondary'}>
                      <TranslatedText>
                        {isLive ? 'Live' : 
                         order.status === 'accepted' ? 'Ready' :
                         order.status === 'done' ? 'Ended' : 'Waiting'}
                      </TranslatedText>
                    </Badge>
                  </div>
                  
                  {displayMode === 'broadcaster' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          <TranslatedText>Payment</TranslatedText>
                        </span>
                        <Badge variant={paymentStatus === 'paid' ? 'default' : 'secondary'} 
                               className={paymentStatus === 'paid' ? 'bg-green-600 flex items-center gap-1' : 'bg-orange-500 flex items-center gap-1'}>
                          {paymentStatus === 'paid' ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Paid
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      {!canStartBroadcast && order.scheduledAt && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-orange-600 font-medium flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <TranslatedText>Broadcast available at:</TranslatedText>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      <TranslatedText>Order ID</TranslatedText>
                    </span>
                    <span className="text-xs font-mono">
                      {orderId.slice(0, 8)}...
                    </span>
                  </div>

                  {displayMode === 'broadcaster' && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        <TranslatedText>
                          You are the streamer for this order. Use the controls to start your broadcast.
                        </TranslatedText>
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