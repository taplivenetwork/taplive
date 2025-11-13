import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Play, Users, MapPin, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { OrderCard } from "@/components/order-card";
import { LiveStreamCard } from "@/components/live-stream-card";
import { MultiStreamGrid } from "@/components/multi-stream-grid";
import { CreateOrderModal } from "@/components/create-order-modal";
import { api } from "@/lib/api";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

declare global {
  interface Window {
    mapUpdateLocation?: (lat: number, lng: number) => void;
  }
}

export default function Home() {
  const { toast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [healthStatus, setHealthStatus] = useState<"connected" | "disconnected">("disconnected");
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');
  const [dismissedOrders, setDismissedOrders] = useState<Set<string>>(new Set());

  // Health check
  const { data: healthData } = useQuery({
    queryKey: ['/healthz'],
    queryFn: api.health.check,
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
  });

  // Set up global map update function for geocoding
  useEffect(() => {
    window.mapUpdateLocation = (lat: number, lng: number) => {
      setMapCenter({ lat, lng });
      setSelectedLocation({ lat, lng });
    };
    
    return () => {
      delete window.mapUpdateLocation;
    };
  }, []);

  useEffect(() => {
    setHealthStatus(healthData ? "connected" : "disconnected");
  }, [healthData]);

  // Fetch orders
  const { data: ordersResponse, isLoading, error } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: () => api.orders.getAll(),
  });

  // Mock tourist orders for MVP demo
  const mockTouristOrders = [
    {
      id: 'mock-tokyo-tower',
      title: 'Tokyo Tower Live View',
      description: '360-degree panoramic view of Tokyo nightscape, experience Japan urban charm',
      price: '25.00',
      status: 'pending' as const,
      category: 'travel',
      address: 'Shiba Park 4-2-8, Minato-ku, Tokyo, Japan',
      latitude: "35.6586",
      longitude: "139.7454",
      type: 'single' as const,
      creatorId: 'tourist-jp',
      providerId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-times-square',
      title: 'Times Square NYC Live',
      description: 'Experience the city that never sleeps, real-time crowd and traffic flow',
      price: '30.00',
      status: 'pending' as const,
      category: 'events',
      address: 'Times Square, Manhattan, New York City, USA',
      latitude: "40.7589",
      longitude: "-73.9851",
      type: 'single' as const,
      creatorId: 'tourist-ny',
      providerId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-eiffel-tower',
      title: 'Eiffel Tower Sunset Stream',
      description: 'Paris landmark, romantic sunset moment live broadcast',
      price: '35.00',
      status: 'pending' as const,
      category: 'travel',
      address: 'Champ de Mars, 5 Avenue Anatole France, Paris, France',
      latitude: "48.8584",
      longitude: "2.2945",
      type: 'single' as const,
      creatorId: 'tourist-paris',
      providerId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-big-ben',
      title: 'Big Ben Hourly Chime',
      description: 'UK iconic landmark, hear the hourly bell chime',
      price: '20.00',
      status: 'pending' as const,
      category: 'events',
      address: 'Palace of Westminster, London, UK',
      latitude: "51.5007",
      longitude: "-0.1246",
      type: 'single' as const,
      creatorId: 'tourist-london',
      providerId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-sydney-opera',
      title: 'Sydney Opera House Harbour View',
      description: 'Australian landmark, Sydney Harbour Bridge full panoramic stream',
      price: '28.00',
      status: 'pending' as const,
      category: 'travel',
      address: 'Bennelong Point, Sydney, New South Wales, Australia',
      latitude: "-33.8568",
      longitude: "151.2153",
      type: 'single' as const,
      creatorId: 'tourist-sydney',
      providerId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'mock-santorini',
      title: 'Santorini Sunset View Stream',
      description: 'Greece most beautiful island, Aegean Sea blue and white architecture',
      price: '40.00',
      status: 'pending' as const,
      category: 'travel',
      address: 'Oia, Santorini, Greece',
      latitude: "36.4618",
      longitude: "25.3753",
      type: 'single' as const,
      creatorId: 'tourist-greece',
      providerId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Deduplicate orders - filter by order ID, then add mock orders
  const allOrders = ordersResponse?.data || [];
  const realOrders = allOrders.filter((order: Order, index: number, arr: Order[]) => 
    arr.findIndex(o => o.id === order.id) === index
  );
  
  // Merge real orders with mock tourist orders
  const orders = [...realOrders, ...mockTouristOrders] as Order[];

  // Mutation for cancelling orders
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('DELETE', `/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle order dismissal
  const handleDismissOrder = (orderId: string) => {
    console.log(`Dismiss order: ${orderId}`);
    setDismissedOrders(prev => new Set([...Array.from(prev), orderId]));
    
    // Show notification
    toast({
      title: "Order Dismissed",
      description: "This order will no longer be displayed, system will recommend new orders",
      variant: "default",
    });
  };

  // Reset dismissed orders
  const handleResetDismissedOrders = () => {
    console.log('Reset all dismissed orders');
    setDismissedOrders(new Set());
    toast({
      title: "Orders Restored",
      description: "All dismissed orders have been restored",
      variant: "default",
    });
  };

  // Filter orders (exclude dismissed orders)
  const filteredOrders = orders.filter((order: Order) => {
    // First exclude dismissed orders
    if (dismissedOrders.has(order.id)) {
      return false;
    }

    const matchesSearch = !searchFilter || 
      order.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      order.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      order.address?.toLowerCase().includes(searchFilter.toLowerCase());
    
    const matchesCategory = !categoryFilter || categoryFilter === "all" || order.category === categoryFilter;
    
    const matchesPrice = !priceFilter || priceFilter === "all" || (() => {
      const price = parseFloat(order.price);
      switch (priceFilter) {
        case "10-25": return price >= 10 && price <= 25;
        case "25-50": return price >= 25 && price <= 50;
        case "50+": return price >= 50;
        default: return true;
      }
    })();

    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Active streams (live orders)
  const activeStreams = orders.filter((order: Order) => order.status === 'live');

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.orders.update(orderId, { status: 'accepted' });
      toast({
        title: "接单成功！",
        description: "正在跳转到直播页面...",
      });
      // 接单成功后跳转到直播页面
      setTimeout(() => {
        window.location.href = `/stream/${orderId}`;
      }, 1000);
    } catch (error) {
      toast({
        title: "接单失败",
        description: "请重试",
        variant: "destructive",
      });
    }
  };

  const handleJoinStream = (orderId: string) => {
    toast({
      title: "正在进入直播",
      description: "正在打开直播间...",
    });
    // 直接跳转到观看模式
    window.location.href = `/stream/${orderId}?mode=viewer`;
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm("Cancel this order?")) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  // Delete order mutation for live streams
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return api.orders.delete(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Stream Deleted",
        description: "The live stream has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete stream. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteStream = async (orderId: string) => {
    if (window.confirm("Delete this live stream?")) {
      // Check if this is a mock order (starts with 'mock-')
      if (orderId.startsWith('mock-')) {
        // Handle mock orders locally - add to dismissed orders
        setDismissedOrders(prev => new Set([...Array.from(prev), orderId]));
        toast({
          title: "Stream Deleted",
          description: "The live stream has been removed from display.",
          variant: "default",
        });
      } else {
        // Handle real orders via API
        deleteOrderMutation.mutate(orderId);
      }
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Connection Error</h2>
          <p className="text-muted-foreground">Failed to connect to the server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header with Search and Quick Actions */}
      <header className="p-4 lg:p-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 circuit-bg relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2 neon-text">
              Live Streaming Hub
            </h1>
            <p className="text-muted-foreground">
              Discover Amazing Content
            </p>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const liveOrder = activeStreams[0];
                  if (liveOrder) {
                    window.location.href = `/stream/${liveOrder.id}?mode=viewer`;
                  } else {
                    toast({
                      title: "No Live Streams",
                      description: "No live streams available at the moment, please try again later",
                    });
                  }
                }}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 py-3 shadow-lg shadow-purple-500/25"
                data-testid="button-watch-live"
              >
                👥 Watch Stream
              </Button>
            </div>
            
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search live streams..."
                className="pl-10 pr-4"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                data-testid="input-search-streams"
              />
            </div>
            <Badge 
              className={`${
                healthStatus === "connected" 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              }`}
              data-testid="health-status"
            >
              <div className={`w-2 h-2 rounded-full animate-pulse mr-2 ${
                healthStatus === "connected" ? "bg-green-400" : "bg-red-400"
              }`} />
              <span className="hidden sm:inline">
                {healthStatus === "connected" ? "Connected" : "Disconnected"}
              </span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Live Streams Main Area */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Filter Tabs */}
          <Tabs defaultValue="live" className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
              <TabsList className="grid w-full grid-cols-3 lg:w-fit lg:grid-cols-3 bg-secondary">
                <TabsTrigger value="live" data-testid="tab-live-streams">
                  <Play className="w-4 h-4 mr-2" />
                  Live Now
                </TabsTrigger>
                <TabsTrigger value="trending" data-testid="tab-trending">
                  <Users className="w-4 h-4 mr-2" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="nearby" data-testid="tab-nearby">
                  <MapPin className="w-4 h-4 mr-2" />
                  Nearby
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2 mt-4 lg:mt-0">
                <Button
                  size="sm"
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('cards');
                  }}
                  className={viewMode === 'cards' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                  data-testid="button-card-view"
                >
                  Card View {viewMode === 'cards' && '✓'}
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('grid');
                  }}
                  className={viewMode === 'grid' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : ''}
                  data-testid="button-grid-view"
                >
                  Grid View {viewMode === 'grid' && '✓'}
                </Button>
              </div>
            </div>

            {/* Live Streams Grid */}
            <TabsContent value="live" className="mt-6">
              {isLoading ? (
                <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden animate-pulse">
                      <div className="aspect-video bg-muted"></div>
                      <CardContent className="p-4">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : viewMode === 'grid' ? (
                <MultiStreamGrid 
                  streams={orders} 
                  onStreamClick={handleJoinStream} 
                />
              ) : activeStreams.length > 0 ? (
                <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {activeStreams.map((stream) => (
                    <LiveStreamCard
                      key={stream.id}
                      stream={stream}
                      onJoin={handleJoinStream}
                      onCancel={handleCancelOrder}
                      onDelete={handleDeleteStream}
                      isMyOrder={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No Live Streams
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to start streaming
                  </p>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Stream
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="trending" className="mt-6">
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {/* Show trending streams */}
                {filteredOrders.slice(0, 6).map((order) => (
                  <LiveStreamCard
                    key={order.id}
                    stream={order}
                    onJoin={handleJoinStream}
                    onCancel={handleCancelOrder}
                    onDelete={handleDeleteStream}
                    isMyOrder={false}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="nearby" className="mt-6">
              {(() => {
                const availableOrders = orders.filter(order => order.status === 'open' || order.status === 'pending');
                
                return availableOrders.length > 0 ? (
                  <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {availableOrders.slice(0, 6).map((order) => (
                      <LiveStreamCard
                        key={order.id}
                        stream={order}
                        onAccept={handleAcceptOrder}
                        onCancel={handleCancelOrder}
                        onDelete={handleDeleteStream}
                        isPending={true}
                        isMyOrder={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No Available Orders
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Create a new order to get started
                    </p>
                    <Button onClick={() => setCreateModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Order
                    </Button>
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>
        </main>

        {/* Sidebar - Create Stream & Quick Actions */}
        <aside className="w-full lg:w-80 xl:w-96 border-l border-border bg-card/50 backdrop-blur holographic">
          <div className="p-4 lg:p-6 space-y-6">
            {/* Quick Create */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Start Streaming
              </h3>
              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70" 
                onClick={() => setCreateModalOpen(true)}
                data-testid="button-create-stream"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Live Stream
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Request live content from anywhere
              </p>
            </div>

            {/* Quick Filters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Quick Filters
              </h3>
              
              <div className="space-y-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger data-testid="select-price-filter">
                    <SelectValue placeholder="Any Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Price</SelectItem>
                    <SelectItem value="10-25">$10-25</SelectItem>
                    <SelectItem value="25-50">$25-50</SelectItem>
                    <SelectItem value="50+">$50+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Requests
                </h3>
                {dismissedOrders.size > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetDismissedOrders}
                    className="h-6 px-2 text-xs"
                  >
                    Restore All ({dismissedOrders.size})
                  </Button>
                )}
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-muted rounded-lg p-3 animate-pulse">
                      <div className="h-3 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-muted-foreground/20 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredOrders.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredOrders.slice(0, 5).map((order) => (
                    <Card key={order.id} className="relative group p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                      {/* 关闭按钮 */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-1 right-1 w-5 h-5 p-0 bg-red-500 hover:bg-red-600 border-0 text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissOrder(order.id);
                        }}
                        title="Close this order"
                      >
                        <X className="w-3 h-3" />
                      </Button>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {order.category || 'General'}
                          </Badge>
                          <span className="text-sm font-medium text-primary">
                            ${order.price}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm line-clamp-1 pr-6">
                          {order.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {order.address}
                        </p>
                        
                        {/* Mock order identifier */}
                        {order.id.startsWith('mock-') && (
                          <Badge className="text-xs bg-blue-500 text-white">
                            🌍 International Attraction
                          </Badge>
                        )}
                        
                        <Button size="sm" className="w-full" onClick={() => handleAcceptOrder(order.id)}>
                          Accept Request
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : dismissedOrders.size > 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    All orders closed
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    📺 Limited orders in MVP phase, unlimited order sources in future
                  </p>
                  <Button size="sm" variant="outline" onClick={handleResetDismissedOrders}>
                    Restore all orders
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    No Active Requests
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setCreateModalOpen(true)}>
                    Create First Request
                  </Button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        selectedLocation={selectedLocation}
      />
    </div>
  );
}
