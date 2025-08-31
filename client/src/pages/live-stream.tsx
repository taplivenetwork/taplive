import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StreamViewer } from '@/components/video/stream-viewer';
import { StreamBroadcaster } from '@/components/video/stream-broadcaster';
import { TranslatedText } from '@/components/translated-text';
import { ArrowLeft, MapPin, Clock, DollarSign, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { Order } from '@shared/schema';

interface LiveStreamPageProps {
  orderId: string;
}

export default function LiveStreamPage() {
  const [match, params] = useRoute('/stream/:orderId');
  const [viewerCount, setViewerCount] = useState(0);
  const [userRole, setUserRole] = useState<'viewer' | 'broadcaster'>('viewer');
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
    // For demo, if order status is 'accepted', show broadcaster controls
    if (order?.status === 'accepted') {
      setUserRole('broadcaster');
    } else {
      setUserRole('viewer');
    }
  }, [order]);

  const handleStreamStart = () => {
    updateOrderMutation.mutate('live');
  };

  const handleStreamEnd = () => {
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
    window.history.back();
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
              <TranslatedText>Order Not Found</TranslatedText>
            </h3>
            <p className="text-muted-foreground mb-4">
              <TranslatedText>The requested live stream could not be found.</TranslatedText>
            </p>
            <Button onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              <TranslatedText>Go Back</TranslatedText>
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
            <TranslatedText>Back</TranslatedText>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{order.title}</h1>
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
              <TranslatedText>
                {isLive ? 'Live Now' :
                 order.status === 'accepted' ? 'Ready to Start' :
                 order.status === 'done' ? 'Stream Ended' :
                 'Waiting'}
              </TranslatedText>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-2">
            {userRole === 'broadcaster' ? (
              <div className="space-y-4">
                <StreamBroadcaster
                  orderId={orderId}
                  onStreamStart={handleStreamStart}
                  onStreamEnd={handleStreamEnd}
                />
                
                {/* Provider cancel order button */}
                {(order.status === 'accepted' || order.status === 'live') && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-3">
                      <TranslatedText>作为服务提供者，您可以取消订单，但这会降低您的信用评分</TranslatedText>
                    </p>
                    <Button 
                      onClick={handleCancelOrder}
                      variant="destructive"
                      disabled={cancelOrderMutation.isPending}
                      data-testid="cancel-order-button"
                      className="w-full"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      <TranslatedText>
                        {cancelOrderMutation.isPending ? '取消中...' : '取消订单 (会扣分)'}
                      </TranslatedText>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <StreamViewer
                streamId={orderId}
                isLive={isLive}
                onViewerCountChange={setViewerCount}
              />
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
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      <TranslatedText>Order ID</TranslatedText>
                    </span>
                    <span className="text-xs font-mono">
                      {orderId.slice(0, 8)}...
                    </span>
                  </div>

                  {userRole === 'broadcaster' && (
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