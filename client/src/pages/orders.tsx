import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { OrderCard } from "@/components/order-card";
import { LiveStreamCard } from "@/components/live-stream-card";
import { TranslatedText } from "@/components/translated-text";
import { useTranslation } from "@/hooks/use-translation";
import translationsData from "@/lib/translations.json";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar, TrendingUp, Plus, Play, CreditCard, Star, CheckCircle, Clock, Video } from "lucide-react";
import type { Order } from "@shared/schema";

export default function Orders() {
  const { toast } = useToast();
  const { currentLanguage } = useTranslation();
  const { user, isLoaded } = useUser();
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  
  const CURRENT_USER_ID = user?.id || "guest";
  
  // Fetch user data to get role
  const { data: userData } = useQuery({
    queryKey: [`/api/users/${CURRENT_USER_ID}`],
    queryFn: async () => {
      if (CURRENT_USER_ID === "guest") return null;
      const response = await apiRequest('GET', `/api/users/${CURRENT_USER_ID}`);
      const data = await response.json();
      return data;
    },
    enabled: CURRENT_USER_ID !== "guest" && isLoaded,
  });

  const userRole = (userData?.data?.role || userData?.role) === 'provider' ? 'provider' : 'customer';
  
  // Helper function to get translated text for placeholders
  const getTranslation = (key: string) => {
    try {
      const translations = (translationsData.translations as any)["orders"];
      return translations?.[currentLanguage]?.[key] || key;
    } catch {
      return key;
    }
  };
  
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: () => api.orders.getAll(),
  });

  const orders = ordersResponse?.data || [];
  
  // Role-based order filtering
  const relevantOrders = orders.filter((order: Order) => {
    if (userRole === 'provider') {
      // Provider sees orders they've accepted or are assigned to
      return order.providerId === CURRENT_USER_ID;
    } else {
      // Customer sees orders they've created
      return order.creatorId === CURRENT_USER_ID;
    }
  });
  
  // Filter and sort orders
  const filteredOrders = relevantOrders.filter((order: Order) => {
    const matchesSearch = !searchFilter || 
      order.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      order.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a: Order, b: Order) => {
    switch (sortBy) {
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "recent":
      default:
        // Handle null createdAt values safely
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
    }
  });

  // Filter orders by status for role-specific views
  let pendingOrders: Order[], acceptedOrders: Order[], liveOrders: Order[], completedOrders: Order[], goLiveOrders: Order[];
  
  if (userRole === 'provider') {
    // Provider view: pending (not started), go-live (date arrived), accepted (streaming), completed
    const now = new Date();
    pendingOrders = relevantOrders.filter((order: Order) => 
      order.status === 'accepted' && order.scheduledAt && new Date(order.scheduledAt) > now
    );
    goLiveOrders = relevantOrders.filter((order: Order) => 
      order.status === 'accepted' && order.scheduledAt && new Date(order.scheduledAt) <= now
    );
    acceptedOrders = relevantOrders.filter((order: Order) => order.status === 'accepted');
    liveOrders = relevantOrders.filter((order: Order) => order.status === 'live');
    completedOrders = relevantOrders.filter((order: Order) => order.status === 'done');
  } else {
    // Customer view: pending (awaiting provider), accepted (needs payment), live, completed (rate provider)
    pendingOrders = relevantOrders.filter((order: Order) => order.status === 'pending');
    acceptedOrders = relevantOrders.filter((order: Order) => order.status === 'accepted');
    liveOrders = relevantOrders.filter((order: Order) => order.status === 'live');
    completedOrders = relevantOrders.filter((order: Order) => order.status === 'done');
    goLiveOrders = []; // Not applicable for customers
  }
  
  const openOrders = relevantOrders.filter((order: Order) => order.status === 'open');

  // Helper function to check if stream date has arrived
  const isStreamDateArrived = (order: Order): boolean => {
    if (!order.scheduledAt) return true; // If no scheduled date, can go live anytime
    return new Date(order.scheduledAt) <= new Date();
  };

  // Handle Go Live action for providers
  const handleGoLive = async (orderId: string) => {
    try {
      await api.orders.update(orderId, { status: 'live' });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Going Live!",
        description: "Redirecting to stream page...",
      });
      setTimeout(() => {
        window.location.href = `/stream/${orderId}?mode=broadcaster`;
      }, 1000);
    } catch (error) {
      toast({
        title: "Failed to start stream",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Handle payment confirmation for customers
  const handlePayment = async (orderId: string) => {
    toast({
      title: "Processing Payment",
      description: "Redirecting to payment gateway...",
    });
    // TODO: Integrate actual payment gateway
    // For now, just redirect to a payment page or show a modal
    window.location.href = `/payment/${orderId}`;
  };

  // Handle rating provider for customers
  const handleRateProvider = (_orderId: string, _providerId: string) => {
    // TODO: Open rating modal
    toast({
      title: "Rate Provider",
      description: "Rating feature coming soon...",
    });
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
        // Mock orders can't be deleted from orders page since they don't appear here
        // But add logic for safety
        toast({
          title: "Cannot Delete",
          description: "This is a demo stream that cannot be deleted from this page.",
          variant: "destructive",
        });
      } else {
        // Handle real orders via API
        deleteOrderMutation.mutate(orderId);
      }
    }
  };

  const handleJoinStream = (orderId: string) => {
    window.location.href = `/stream/${orderId}?mode=viewer`;
  };

  // Role-specific order card renderer
  const renderRoleBasedOrderCard = (order: Order) => {
    const dateArrived = isStreamDateArrived(order);
    
    if (userRole === 'provider') {
      // Provider view
      if (order.status === 'live') {
        return (
          <Card key={order.id} className="p-4 border-green-500 border-2">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{order.title}</h3>
                  <Badge className="bg-green-500 mt-1">🔴 Live Now</Badge>
                </div>
                <span className="text-xl font-bold text-green-600">${order.price}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
              <div className="text-xs font-medium">
                Payment: <span className={order.isPaid ? "text-green-600" : "text-orange-600"}>
                  {order.isPaid ? "✅ Confirmed" : "⏳ Pending"}
                </span>
              </div>
              <Button 
                onClick={() => window.location.href = `/stream/${order.id}?mode=broadcaster&payment=${order.isPaid ? 'paid' : 'pending'}`}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Video className="w-4 h-4 mr-2" />
                Continue Streaming
              </Button>
            </div>
          </Card>
        );
      }
      
      if (order.status === 'accepted') {
        return (
          <Card key={order.id} className="p-4 border-blue-500 border-2">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{order.title}</h3>
                  <Badge className={dateArrived ? "bg-orange-500" : "bg-blue-500"}>
                    {dateArrived ? "⏰ Ready to Go Live" : "📅 Scheduled"}
                  </Badge>
                </div>
                <span className="text-xl font-bold">${order.price}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
              <div className="text-xs text-muted-foreground">
                <Clock className="w-3 h-3 inline mr-1" />
                {order.scheduledAt ? new Date(order.scheduledAt).toLocaleString() : 'Not scheduled'}
              </div>
              <div className="text-xs font-medium">
                Payment: <span className={order.isPaid ? "text-green-600" : "text-orange-600"}>
                  {order.isPaid ? "✅ Confirmed" : "⏳ Pending"}
                </span>
              </div>
              {dateArrived ? (
                <Button 
                  onClick={() => handleGoLive(order.id)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Go Live Now
                </Button>
              ) : (
                <Button 
                  onClick={() => window.location.href = `/stream/${order.id}?mode=broadcaster&payment=${order.isPaid ? 'paid' : 'pending'}`}
                  className="w-full"
                  variant="outline"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Enter Room (Prepare)
                </Button>
              )}
            </div>
          </Card>
        );
      }
      
      if (order.status === 'done') {
        return (
          <Card key={order.id} className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{order.title}</h3>
                  <Badge className="bg-gray-500">✅ Completed</Badge>
                </div>
                <span className="text-xl font-bold text-green-600">${order.price}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => toast({ title: "Reviews", description: "View reviews feature coming soon..." })}
              >
                <Star className="w-4 h-4 mr-2" />
                View Reviews
              </Button>
            </div>
          </Card>
        );
      }
    } else {
      // Customer view
      if (order.status === 'pending') {
        return (
          <Card key={order.id} className="p-4 border-orange-500 border-2">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{order.title}</h3>
                  <Badge className="bg-orange-500">⏳ Awaiting Provider</Badge>
                </div>
                <span className="text-xl font-bold">${order.price}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
              <div className="text-xs text-muted-foreground">
                <Clock className="w-3 h-3 inline mr-1" />
                {order.scheduledAt ? new Date(order.scheduledAt).toLocaleString() : 'Not scheduled'}
              </div>
              <p className="text-xs text-muted-foreground">Waiting for a provider to accept your request...</p>
            </div>
          </Card>
        );
      }
      
      if (order.status === 'accepted') {
        return (
          <Card key={order.id} className="p-4 border-blue-500 border-2">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{order.title}</h3>
                  <Badge className="bg-blue-500">✓ Accepted</Badge>
                </div>
                <span className="text-xl font-bold">${order.price}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
              <div className="text-xs text-muted-foreground">
                <Clock className="w-3 h-3 inline mr-1" />
                {order.scheduledAt ? new Date(order.scheduledAt).toLocaleString() : 'Not scheduled'}
              </div>
              <Button 
                onClick={() => handlePayment(order.id)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {order.isPaid ? "Payment Confirmed" : "Confirm Payment"}
              </Button>
            </div>
          </Card>
        );
      }
      
      if (order.status === 'live') {
        return (
          <Card key={order.id} className="p-4 border-green-500 border-2">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{order.title}</h3>
                  <Badge className="bg-green-500 animate-pulse">🔴 Live Now</Badge>
                </div>
                <span className="text-xl font-bold">${order.price}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
              <Button 
                onClick={() => handleJoinStream(order.id)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Stream
              </Button>
            </div>
          </Card>
        );
      }
      
      if (order.status === 'done') {
        return (
          <Card key={order.id} className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{order.title}</h3>
                  <Badge className="bg-gray-500">✅ Completed</Badge>
                </div>
                <span className="text-xl font-bold">${order.price}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
              <Button 
                onClick={() => order.providerId && handleRateProvider(order.id, order.providerId)}
                className="w-full"
              >
                <Star className="w-4 h-4 mr-2" />
                Rate Provider
              </Button>
            </div>
          </Card>
        );
      }
    }
    
    // Default fallback
    return (
      <div key={order.id} className="col-span-1">
        <OrderCard order={order} showActions={true} />
      </div>
    );
  };

  const renderOrderList = (orderList: Order[], emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (orderList.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            <TranslatedText context="orders">{emptyMessage}</TranslatedText>
          </h3>
          <p className="text-muted-foreground mb-4">
            <TranslatedText context="orders">Create your first streaming order to get started</TranslatedText>
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            <TranslatedText context="orders">Create Order</TranslatedText>
          </Button>
        </div>
      );
    }

    // Use role-based card renderer
    return (
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {orderList.map((order) => renderRoleBasedOrderCard(order))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Enhanced Header with Stats */}
      <header className="p-4 lg:p-6 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              <TranslatedText context="orders">
                {userRole === 'provider' ? 'Provider Dashboard' : 'My Orders Dashboard'}
              </TranslatedText>
            </h2>
            <p className="text-muted-foreground">
              <TranslatedText context="orders">
                {userRole === 'provider' 
                  ? 'Manage your accepted orders and streaming schedule' 
                  : 'Manage your streaming orders and track their progress'}
              </TranslatedText>
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{relevantOrders.length}</div>
                <div className="text-xs text-muted-foreground"><TranslatedText context="orders">Total</TranslatedText></div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{liveOrders.length}</div>
                <div className="text-xs text-muted-foreground"><TranslatedText context="orders">Live</TranslatedText></div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingOrders.length}</div>
                <div className="text-xs text-muted-foreground">
                  {userRole === 'provider' ? 'Scheduled' : 'Pending'}
                </div>
              </div>
            </Card>
            {userRole === 'provider' && (
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{goLiveOrders.length}</div>
                  <div className="text-xs text-muted-foreground">Ready</div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </header>

      {/* Filters and Search */}
      <div className="p-4 lg:p-6 border-b border-border bg-card/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={getTranslation("Search orders...")}
                className="pl-10"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                data-testid="input-search-orders"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><TranslatedText context="orders">All Status</TranslatedText></SelectItem>
                <SelectItem value="pending"><TranslatedText context="orders">Pending</TranslatedText></SelectItem>
                <SelectItem value="live"><TranslatedText context="orders">Live</TranslatedText></SelectItem>
                <SelectItem value="completed"><TranslatedText context="orders">Completed</TranslatedText></SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <TrendingUp className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent"><TranslatedText context="orders">Most Recent</TranslatedText></SelectItem>
                <SelectItem value="price-high"><TranslatedText context="orders">Price: High to Low</TranslatedText></SelectItem>
                <SelectItem value="price-low"><TranslatedText context="orders">Price: Low to High</TranslatedText></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-6">
        <Tabs defaultValue="all" className="w-full">
          {userRole === 'provider' ? (
            // Provider Tabs
            <>
              <TabsList className="grid w-full grid-cols-5 bg-secondary mb-6">
                <TabsTrigger value="all" data-testid="tab-all">
                  <TranslatedText context="orders">All</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{relevantOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending">
                  <Clock className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Scheduled</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{pendingOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="golive" data-testid="tab-golive">
                  <Play className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Go Live</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{goLiveOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="live" data-testid="tab-live">
                  <Video className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Live</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{liveOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" data-testid="tab-completed">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Completed</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{completedOrders.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                {renderOrderList(filteredOrders, "You haven't accepted any orders yet")}
              </TabsContent>

              <TabsContent value="pending">
                {renderOrderList(pendingOrders, "No scheduled orders")}
              </TabsContent>

              <TabsContent value="golive">
                {renderOrderList(goLiveOrders, "No orders ready to go live")}
              </TabsContent>

              <TabsContent value="live">
                {renderOrderList(liveOrders, "No active streams")}
              </TabsContent>

              <TabsContent value="completed">
                {renderOrderList(completedOrders, "No completed orders")}
              </TabsContent>
            </>
          ) : (
            // Customer Tabs
            <>
              <TabsList className="grid w-full grid-cols-5 bg-secondary mb-6">
                <TabsTrigger value="all" data-testid="tab-all">
                  <TranslatedText context="orders">All</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{relevantOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending">
                  <Clock className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Pending</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{pendingOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="accepted" data-testid="tab-accepted">
                  <CreditCard className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Accepted</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{acceptedOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="live" data-testid="tab-live">
                  <Video className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Live</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{liveOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" data-testid="tab-completed">
                  <Star className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Completed</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{completedOrders.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                {renderOrderList(filteredOrders, "You haven't created any orders yet")}
              </TabsContent>

              <TabsContent value="pending">
                {renderOrderList(pendingOrders, "No pending orders")}
              </TabsContent>

              <TabsContent value="accepted">
                {renderOrderList(acceptedOrders, "No accepted orders")}
              </TabsContent>

              <TabsContent value="live">
                {renderOrderList(liveOrders, "No live streams")}
              </TabsContent>

              <TabsContent value="completed">
                {renderOrderList(completedOrders, "No completed orders")}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}