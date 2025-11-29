import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { Link } from "wouter";
import { Plus, Search, Filter, Play, Users, MapPin, Clock, X, Settings, Bell } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { OrderCard } from "@/components/order-card";
import { LiveStreamCard } from "@/components/live-stream-card";
import { MultiStreamGrid } from "@/components/multi-stream-grid";
import { CreateOrderModal } from "@/components/create-order-modal";
import { DemoControls } from "@/components/demo-controls";
import { NotificationCard } from "@/components/notification-card";
import { TranslatedText } from "@/components/translated-text";
import { api } from "@/lib/api";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import type { Order, Notification } from "@shared/schema";

declare global {
  interface Window {
    mapUpdateLocation?: (lat: number, lng: number) => void;
  }
}

export default function Home() {
  const { toast } = useToast();
  const { currentLanguage, setCurrentLanguage } = useTranslation();
  const { user, isLoaded } = useUser(); // Get Clerk user
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [healthStatus, setHealthStatus] = useState<"connected" | "disconnected">("disconnected");
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');
  const [dismissedOrders, setDismissedOrders] = useState<Set<string>>(new Set()); // 跟踪被关闭的订单
  
  // Use Clerk user ID instead of dummy user ID
  const CURRENT_USER_ID = user?.id || "guest";

  // Fetch user data to get role
  const { data: userData } = useQuery({
    queryKey: [`/api/users/${CURRENT_USER_ID}`],
    queryFn: async () => {
      if (CURRENT_USER_ID === "guest") return null;
      const response = await apiRequest('GET', `/api/users/${CURRENT_USER_ID}`);
      const data = await response.json();
      console.log('Fetched user data:', data); // Debug log
      return data;
    },
    enabled: CURRENT_USER_ID !== "guest" && isLoaded,
    refetchOnWindowFocus: true, // Refetch when window regains focus
    staleTime: 0, // Always consider data stale to refetch on mount
  });

  console.log('userData:', userData); // Debug log
  console.log('userData.role:', userData?.role); // Debug log
  console.log('userData.data?.role:', userData?.data?.role); // Debug log
  
  // The API might return { data: { role: ... } } structure
  const userRole = (userData?.data?.role || userData?.role) === 'provider' ? 'provider' : 'customer';
  console.log('this is the userRole', userRole); // Keep your existing log
 console.log("this is the userRole", userRole)
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

  // Sync Clerk user to database on first load
  useEffect(() => {
    const syncUser = async () => {
      if (user?.id) {
        try {
          // Try to sync user to database
          await fetch('/api/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: user.id,
              username: user.username || user.emailAddresses[0]?.emailAddress.split('@')[0] || `user_${user.id.slice(0, 8)}`,
              email: user.emailAddresses[0]?.emailAddress || '',
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'TapLive User',
              avatar: user.imageUrl || null,
            }),
          });
          console.log('✅ User synced to database:', user.id);
        } catch (error) {
          console.error('Failed to sync user:', error);
        }
      }
    };
    
    if (isLoaded && user) {
      syncUser();
    }
  }, [user, isLoaded]);

  // Fetch orders
  const { data: ordersResponse, isLoading, error } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: () => api.orders.getAll(),
  });

  // Fetch provider notifications (order dispatches)
  const { data: notificationsResponse, isLoading: notificationsLoading } = useQuery({
    queryKey: [`/api/users/${CURRENT_USER_ID}/notifications/orders`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${CURRENT_USER_ID}/notifications/orders`);
      const jsonData = await response.json();
      console.log("fetched notifications response:", jsonData);
      return jsonData.data || [];
    },
    refetchInterval: 3000, // Refetch every 5 minutes for near-real-time updates
    
  });

  const notifications: Notification[] = notificationsResponse || [];

  // Use only real orders from database
  const allOrders = ordersResponse?.data || [];
  const orders = allOrders.filter((order: Order, index: number, arr: Order[]) => 
    arr.findIndex(o => o.id === order.id) === index
  ) as Order[];

  // Get dispatched orders from notifications
  const dispatchedOrderIds = notifications.map(n => n.orderId).filter(Boolean);

  const dispatchedOrders = orders.filter(order => 
    dispatchedOrderIds.includes(order.id) && order.status === 'pending'
  );

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

  // 处理订单关闭
  const handleDismissOrder = (orderId: string) => {
    console.log(`关闭订单: ${orderId}`);
    setDismissedOrders(prev => new Set([...Array.from(prev), orderId]));
    
    // 显示提示
    toast({
      title: "Order closed",
      description: "This order will no longer be displayed, the system will automatically recommend new orders",
      variant: "default",
    });
  };

  // 重置关闭的订单
  const handleResetDismissedOrders = () => {
    
    setDismissedOrders(new Set());
    toast({
      title: "Orders restored",
      description: "All closed orders have been redisplayed",
      variant: "default",
    });
  };

  // Filter orders (排除被关闭的订单)
  const filteredOrders = orders.filter((order: Order) => {
    // 首先排除被关闭的订单
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
      await api.orders.update(orderId, { 
        status: 'accepted',
        providerId: CURRENT_USER_ID  // Assign the provider who accepted the order
      });
      toast({
        title: "Order accepted successfully!",
        description: "Redirecting to live page...",
      });
      // 接单成功后跳转到直播页面
      setTimeout(() => {
        window.location.href = `/stream/${orderId}`;
      }, 1000);
    } catch (error) {
      toast({
        title: "Order acceptance failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleJoinStream = (orderId: string) => {
    toast({
      title: "Entering live stream",
      description: "Opening live room...",
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
              <TranslatedText>Live Streaming Hub</TranslatedText>
            </h1>
            <p className="text-muted-foreground">
              <TranslatedText context="home">Discover amazing live content from around the world</TranslatedText>
            </p>
          </div>
          
          {/* 桌面版语言选择器 - 右上角显眼位置 */}
          <div className="hidden lg:flex items-center gap-3 mb-4">
            {/* Notification Bell with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                    >
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <TranslatedText>No new notifications</TranslatedText>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const metadata = typeof notification.metadata === 'string' 
                      ? JSON.parse(notification.metadata) 
                      : notification.metadata;
                    const order = orders.find(o => o.id === notification.orderId);
                    
                    return (
                      <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-pointer">
                        <div className="flex justify-between w-full items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{order?.title || 'New Order'}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ${order?.price || 0} • {Math.round(metadata?.distance || 0)}km away
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (order?.id) {
                                handleAcceptOrder(order.id);
                              }
                            }}
                            className="ml-2"
                          >
                            <TranslatedText>Accept</TranslatedText>
                          </Button>
                        </div>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <LanguageSelector 
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
              className="shadow-md border-2 border-primary/20 hover:border-primary/40 transition-colors"
            />
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* 观看直播按钮 - 震撼入口 */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  // 跳转到最新的live订单进行观看
                  const liveOrder = activeStreams[0];
                  if (liveOrder) {
                    window.location.href = `/stream/${liveOrder.id}?mode=viewer`;
                  } else {
                    toast({
                      title: "No live streams available",
                      description: "Currently no live streams, please try again later",
                    });
                  }
                }}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 py-3 shadow-lg shadow-purple-500/25"
                data-testid="button-watch-live"
              >
                👥 <TranslatedText context="home">Watch Live Now</TranslatedText>
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
                <TranslatedText>
                  {healthStatus === "connected" ? "Live" : "Offline"}
                </TranslatedText>
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
                  <TranslatedText>Live Now</TranslatedText>
                </TabsTrigger>
                <TabsTrigger value="trending" data-testid="tab-trending">
                  <Users className="w-4 h-4 mr-2" />
                  <TranslatedText>Trending</TranslatedText>
                </TabsTrigger>
                <TabsTrigger value="nearby" data-testid="tab-nearby">
                  <MapPin className="w-4 h-4 mr-2" />
                  <TranslatedText>Nearby</TranslatedText>
                </TabsTrigger>
              </TabsList>
              
              {/* 视图模式切换 */}
              <div className="flex gap-2 mt-4 lg:mt-0">
                <Button
                  size="sm"
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  onClick={() => {
                    console.log('切换到单个直播模式，当前模式:', viewMode);
                    setViewMode('cards');
                  }}
                  className={viewMode === 'cards' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                  data-testid="button-card-view"
                >
                  🎬 <TranslatedText context="home">Single Stream</TranslatedText> {viewMode === 'cards' && '✓'}
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => {
                    console.log('切换到多屏模式，当前模式:', viewMode);
                    setViewMode('grid');
                  }}
                  className={viewMode === 'grid' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : ''}
                  data-testid="button-grid-view"
                >
                  📺 <TranslatedText context="home">Multi-Grid</TranslatedText> {viewMode === 'grid' && '✓'}
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
                /* 震撼多屏网格模式 */
                <MultiStreamGrid 
                  streams={orders} 
                  onStreamClick={handleJoinStream} 
                />
              ) : activeStreams.length > 0 ? (
                /* 传统卡片模式 */
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
                    <TranslatedText>No Live Streams</TranslatedText>
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    <TranslatedText>Be the first to start streaming in your area!</TranslatedText>
                  </p>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    <TranslatedText>Create First Stream</TranslatedText>
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
                      <TranslatedText>No Available Orders</TranslatedText>
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      <TranslatedText>Create a new order to get started!</TranslatedText>
                    </p>
                    <Button onClick={() => setCreateModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      <TranslatedText>Create Order</TranslatedText>
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
                <TranslatedText>Start Streaming</TranslatedText>
              </h3>
              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70" 
                onClick={() => setCreateModalOpen(true)}
                data-testid="button-create-stream"
              >
                <Plus className="w-5 h-5 mr-2" />
                <TranslatedText>Create Live Stream</TranslatedText>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                <TranslatedText>Request live content from your location</TranslatedText>
              </p>
            </div>

            {/* Demo Controls */}
            <DemoControls />

            {/* Quick Filters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <TranslatedText>Quick Filters</TranslatedText>
              </h3>
              
              <div className="space-y-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all"><TranslatedText>All Categories</TranslatedText></SelectItem>
                    <SelectItem value="music"><TranslatedText>Music</TranslatedText></SelectItem>
                    <SelectItem value="food"><TranslatedText>Food</TranslatedText></SelectItem>
                    <SelectItem value="travel"><TranslatedText>Travel</TranslatedText></SelectItem>
                    <SelectItem value="events"><TranslatedText>Events</TranslatedText></SelectItem>
                    <SelectItem value="fitness"><TranslatedText>Fitness</TranslatedText></SelectItem>
                    <SelectItem value="education"><TranslatedText>Education</TranslatedText></SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger data-testid="select-price-filter">
                    <SelectValue placeholder="Any Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all"><TranslatedText>Any Price</TranslatedText></SelectItem>
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
                  <TranslatedText>Recent Requests</TranslatedText>
                </h3>
                {dismissedOrders.size > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetDismissedOrders}
                    className="h-6 px-2 text-xs"
                  >
                    <TranslatedText context="home">Restore All</TranslatedText> ({dismissedOrders.size})
                  </Button>
                )}
              </div>
              
              {CURRENT_USER_ID === 'guest' ? (
                <div className="text-center py-8 px-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-dashed border-green-200">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    <TranslatedText context="home">Sign Up to Activate</TranslatedText>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    <TranslatedText context="home">Sign in or create an account to view and accept live stream requests</TranslatedText>
                  </p>
                </div>
              ) : userRole === 'customer' ? (
                <div className="text-center py-8 px-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-200">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    <TranslatedText context="home">Provider Feature</TranslatedText>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    <TranslatedText context="home">Change to provider mode to receive and accept live stream requests</TranslatedText>
                  </p>
                  <Link href="/settings">
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      <TranslatedText context="home">Go to Settings</TranslatedText>
                    </Button>
                  </Link>
                </div>
              ) : isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-muted rounded-lg p-3 animate-pulse">
                      <div className="h-3 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-muted-foreground/20 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : dispatchedOrders.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {dispatchedOrders.map((order) => {
                    const notification = notifications.find(n => n.orderId === order.id);
                    const metadata = notification?.metadata 
                      ? typeof notification.metadata === 'string' ? JSON.parse(notification.metadata) : notification.metadata
                      : null;
                    
                    return (
                      <Card key={order.id} className="relative group p-3 hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-blue-500">
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
                          
                          {/* Distance indicator */}
                          {metadata?.distance && (
                            <Badge className="text-xs bg-green-500 text-white">
                              📍 {Math.round(metadata.distance)}km away
                            </Badge>
                          )}
                          
                          <Button 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                            onClick={() => handleAcceptOrder(order.id)}
                          >
                            <TranslatedText>Accept Request</TranslatedText>
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    <TranslatedText>No active requests</TranslatedText>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💡 <TranslatedText context="home">New orders matching your profile will appear here</TranslatedText>
                  </p>
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
