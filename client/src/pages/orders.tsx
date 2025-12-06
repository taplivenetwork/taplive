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
import { api, authFetch } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Filter, Calendar, TrendingUp, Plus, Play, CreditCard, Star, CheckCircle, Clock, Video, XCircle, Radio, Timer, CheckCheck, Eye } from "lucide-react";
import type { Order } from "@shared/schema";

export default function Orders() {
  const { toast } = useToast();
  const { currentLanguage } = useTranslation();
  const { user, isLoaded } = useUser();
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  
  // Rating modal states
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [viewRatingsModalOpen, setViewRatingsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  
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
  let pendingOrders: Order[], acceptedOrders: Order[], liveOrders: Order[], completedOrders: Order[], goLiveOrders: Order[], cancelledOrders: Order[];
  
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
    cancelledOrders = relevantOrders.filter((order: Order) => order.status === 'cancelled');
  } else {
    // Customer view: pending (awaiting provider), accepted (needs payment), live, completed (rate provider)
    pendingOrders = relevantOrders.filter((order: Order) => order.status === 'pending');
    acceptedOrders = relevantOrders.filter((order: Order) => order.status === 'accepted');
    liveOrders = relevantOrders.filter((order: Order) => order.status === 'live');
    completedOrders = relevantOrders.filter((order: Order) => order.status === 'done');
    cancelledOrders = relevantOrders.filter((order: Order) => order.status === 'cancelled');
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

  // Fetch ratings for an order
  const { data: orderRatings, refetch: refetchRatings } = useQuery({
    queryKey: [`/api/orders/${selectedOrder?.id}/ratings`],
    queryFn: async () => {
      if (!selectedOrder?.id) return null;
      const response = await apiRequest('GET', `/api/orders/${selectedOrder.id}/ratings`);
      return response.json();
    },
    enabled: !!selectedOrder?.id && viewRatingsModalOpen,
  });

  // Submit rating mutation
  const submitRatingMutation = useMutation({
    mutationFn: async (ratingData: any) => {
      const response = await authFetch('/api/ratings', {
        method: 'POST',
        body: JSON.stringify(ratingData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit rating');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
      setRatingModalOpen(false);
      setRating(0);
      setComment("");
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: (error: any) => {
      toast({
        title: "Rating Failed",
        description: error.message || "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle rating provider for customers
  const handleRateProvider = (orderId: string) => {
    const order = orders.find((o: Order) => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setRatingModalOpen(true);
    }
  };

  // Handle view ratings for providers
  const handleViewRatings = (orderId: string) => {
    const order = orders.find((o: Order) => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setViewRatingsModalOpen(true);
    }
  };

  // Submit rating
  const handleSubmitRating = () => {
    if (!selectedOrder || rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitRatingMutation.mutate({
      orderId: selectedOrder.id,
      revieweeId: selectedOrder.providerId,
      reviewType: 'creator_to_provider',
      rating: rating,
      comment: comment || undefined,
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
          <Card key={order.id} className="p-4 border-green-500 border-2 ">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg break-words">{order.title}</h3>
                  <Badge className="bg-green-500 mt-1">
                    <Radio className="w-3 h-3 mr-1 animate-pulse" />
                    Live Now
                  </Badge>
                </div>
                <span className="text-xl font-bold text-green-600 flex-shrink-0">${order.price}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
              <div className="text-xs font-medium flex items-center gap-1">
                Payment:
                {order.isPaid ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Confirmed
                  </span>
                ) : (
                  <span className="text-orange-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                )}
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
          <Card key={order.id} className="p-4 border-blue-500 border-2 ">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg break-words">{order.title}</h3>
                  <Badge className={dateArrived ? "bg-orange-500" : "bg-blue-500"}>
                    {dateArrived ? (
                      <>
                        <Timer className="w-3 h-3 mr-1" />
                        Ready to Go Live
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3 h-3 mr-1" />
                        Scheduled
                      </>
                    )}
                  </Badge>
                </div>
                <span className="text-xl font-bold flex-shrink-0">${order.price}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
              <div className="text-xs text-muted-foreground">
                <Clock className="w-3 h-3 inline mr-1" />
                {order.scheduledAt ? new Date(order.scheduledAt).toLocaleString() : 'Not scheduled'}
              </div>
              <div className="text-xs font-medium flex items-center gap-1">
                Payment:
                {order.isPaid ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Confirmed
                  </span>
                ) : (
                  <span className="text-orange-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                )}
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
          <Card key={order.id} className="p-4 ">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg break-words">{order.title}</h3>
                  <Badge className="bg-gray-500">
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
                <span className="text-xl font-bold text-green-600 flex-shrink-0">${order.price}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => handleViewRatings(order.id)}
              >
                <Eye className="w-4 h-4 mr-2" />
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
          <Card key={order.id} className="p-4 border-orange-500 border-2 ">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg break-words">{order.title}</h3>
                  <Badge className="bg-orange-500">
                    <Clock className="w-3 h-3 mr-1" />
                    Awaiting Provider
                  </Badge>
                </div>
                <span className="text-xl font-bold flex-shrink-0">${order.price}</span>
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
          <Card key={order.id} className="p-4 border-blue-500 border-2 ">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg break-words">{order.title}</h3>
                  <Badge className="bg-blue-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Accepted
                  </Badge>
                </div>
                <span className="text-xl font-bold flex-shrink-0">${order.price}</span>
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
          <Card key={order.id} className="p-4 border-green-500 border-2 ">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg break-words">{order.title}</h3>
                  <Badge className="bg-green-500 animate-pulse">
                    <Radio className="w-3 h-3 mr-1" />
                    Live Now
                  </Badge>
                </div>
                <span className="text-xl font-bold flex-shrink-0">${order.price}</span>
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
          <Card key={order.id} className="p-4 ">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg break-words">{order.title}</h3>
                  <Badge className="bg-gray-500">
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
                <span className="text-xl font-bold flex-shrink-0">${order.price}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
              <Button 
                onClick={() => handleRateProvider(order.id)}
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
    
    // Cancelled orders (same for both roles)
    if (order.status === 'cancelled') {
      return (
        <Card key={order.id} className="p-4 bg-gray-50 border-gray-300 ">
          <div className="space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-700 break-words">{order.title}</h3>
                  <Badge className="bg-gray-400 text-white">
                    <XCircle className="w-3 h-3 mr-1" />
                    Cancelled
                  </Badge>
                </div>
              <span className="text-xl font-bold text-gray-500 flex-shrink-0">${order.price}</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{order.description}</p>
            {order.scheduledAt && (
              <div className="text-xs text-gray-500">
                <Clock className="w-3 h-3 inline mr-1" />
                Was scheduled: {new Date(order.scheduledAt).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-gray-600">This order has been cancelled.</p>
          </div>
        </Card>
      );
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
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 w-full max-w-full">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse w-full max-w-full">
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
        <div className="text-center py-8 sm:py-12 px-4 ">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 break-words">
            <TranslatedText context="orders">{emptyMessage}</TranslatedText>
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 break-words">
            <TranslatedText context="orders">Create your first streaming order to get started</TranslatedText>
          </p>
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            <TranslatedText context="orders">Create Order</TranslatedText>
          </Button>
        </div>
      );
    }

    // Use role-based card renderer
    return (
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 w-full max-w-full">
        {orderList.map((order) => renderRoleBasedOrderCard(order))}
      </div>
    );
  };

  return (
    <div className="flex-1">
      {/* Enhanced Header with Stats */}
      <header className="p-4 lg:p-6 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 break-words">
              <TranslatedText context="orders">
                {userRole === 'provider' ? 'Provider Dashboard' : 'My Orders Dashboard'}
              </TranslatedText>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground break-words">
              <TranslatedText context="orders">
                {userRole === 'provider' 
                  ? 'Manage your accepted orders and streaming schedule' 
                  : 'Manage your streaming orders and track their progress'}
              </TranslatedText>
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 lg:pb-0">
            <Card className="p-2 sm:p-3 flex-shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{relevantOrders.length}</div>
                <div className="text-xs text-muted-foreground"><TranslatedText context="orders">Total</TranslatedText></div>
              </div>
            </Card>
            <Card className="p-2 sm:p-3 flex-shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{liveOrders.length}</div>
                <div className="text-xs text-muted-foreground"><TranslatedText context="orders">Live</TranslatedText></div>
              </div>
            </Card>
            <Card className="p-2 sm:p-3 flex-shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingOrders.length}</div>
                <div className="text-xs text-muted-foreground">
                  {userRole === 'provider' ? 'Scheduled' : 'Pending'}
                </div>
              </div>
            </Card>
            {userRole === 'provider' && (
              <Card className="p-2 sm:p-3 flex-shrink-0">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{goLiveOrders.length}</div>
                  <div className="text-xs text-muted-foreground">Ready</div>
                </div>
              </Card>
            )}
            <Card className="p-2 sm:p-3 flex-shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{cancelledOrders.length}</div>
                <div className="text-xs text-muted-foreground">Cancelled</div>
              </div>
            </Card>
          </div>
        </div>
      </header>

      {/* Filters and Search */}
      <div className="p-4 lg:p-6 border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-0">
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
              <SelectTrigger className="w-auto sm:w-40 px-3 sm:px-4">
                <Filter className="w-4 h-4 sm:mr-2" />
                <SelectValue placeholder="Status" className="hidden sm:inline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><TranslatedText context="orders">All Status</TranslatedText></SelectItem>
                <SelectItem value="pending"><TranslatedText context="orders">Pending</TranslatedText></SelectItem>
                <SelectItem value="live"><TranslatedText context="orders">Live</TranslatedText></SelectItem>
                <SelectItem value="completed"><TranslatedText context="orders">Completed</TranslatedText></SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-auto sm:w-40 px-3 sm:px-4">
                <TrendingUp className="w-4 h-4 sm:mr-2" />
                <SelectValue placeholder="Sort" className="hidden sm:inline" />
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
        <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="all">
          {userRole === 'provider' ? (
            // Provider Tabs
            <>
              <TabsList className="flex lg:grid w-full lg:grid-cols-6 bg-secondary mb-6 overflow-x-auto">
                <TabsTrigger value="all" data-testid="tab-all" className="flex-shrink-0 min-w-[80px] lg:min-w-0">
                  <TranslatedText context="orders">All</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{relevantOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending" className="flex-shrink-0 min-w-[120px] lg:min-w-0">
                  <Clock className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Scheduled</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{pendingOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="golive" data-testid="tab-golive" className="flex-shrink-0 min-w-[110px] lg:min-w-0">
                  <Play className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Go Live</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{goLiveOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="live" data-testid="tab-live" className="flex-shrink-0 min-w-[90px] lg:min-w-0">
                  <Video className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Live</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{liveOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" data-testid="tab-completed" className="flex-shrink-0 min-w-[130px] lg:min-w-0">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Completed</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{completedOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="cancelled" data-testid="tab-cancelled" className="flex-shrink-0 min-w-[120px] lg:min-w-0">
                  <XCircle className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Cancelled</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{cancelledOrders.length}</Badge>
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

              <TabsContent value="cancelled">
                {renderOrderList(cancelledOrders, "No cancelled orders")}
              </TabsContent>
            </>
          ) : (
            // Customer Tabs
            <>
              <TabsList className="flex lg:grid w-full lg:grid-cols-6 bg-secondary mb-6 overflow-x-auto">
                <TabsTrigger value="all" data-testid="tab-all" className="flex-shrink-0 min-w-[80px] lg:min-w-0">
                  <TranslatedText context="orders">All</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{relevantOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending" className="flex-shrink-0 min-w-[120px] lg:min-w-0">
                  <Clock className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Pending</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{pendingOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="accepted" data-testid="tab-accepted" className="flex-shrink-0 min-w-[120px] lg:min-w-0">
                  <CreditCard className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Accepted</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{acceptedOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="live" data-testid="tab-live" className="flex-shrink-0 min-w-[90px] lg:min-w-0">
                  <Video className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Live</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{liveOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" data-testid="tab-completed" className="flex-shrink-0 min-w-[130px] lg:min-w-0">
                  <Star className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Completed</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{completedOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="cancelled" data-testid="tab-cancelled" className="flex-shrink-0 min-w-[120px] lg:min-w-0">
                  <XCircle className="w-4 h-4 mr-1" />
                  <TranslatedText context="orders">Cancelled</TranslatedText>
                  <Badge variant="secondary" className="ml-2">{cancelledOrders.length}</Badge>
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

              <TabsContent value="cancelled">
                {renderOrderList(cancelledOrders, "No cancelled orders")}
              </TabsContent>
            </>
          )}
        </Tabs>
        </div>
      </div>

      {/* Customer Rating Modal */}
      <Dialog open={ratingModalOpen} onOpenChange={setRatingModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white text-slate-900">
          <DialogHeader className="bg-white">
            <DialogTitle className="text-slate-900">Rate Your Experience</DialogTitle>
            <DialogDescription className="text-slate-600">
              How was your live stream experience with this provider?
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 py-4 bg-white">
              {/* Order Info */}
              <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-sm mb-1 text-slate-900">{selectedOrder.title}</h4>
                <p className="text-xs text-slate-600">${selectedOrder.price} • {selectedOrder.duration} minutes</p>
              </div>

              {/* Star Rating */}
              <div className="space-y-2 bg-white">
                <Label className="text-slate-900">Your Rating</Label>
                <div className="flex gap-2 justify-center py-2 bg-white">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none transition-transform hover:scale-110"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoveredStar || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-slate-600">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="space-y-2 bg-white">
                <Label htmlFor="comment" className="text-slate-900">Additional Comments (Optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Share your thoughts about the stream quality, professionalism, etc..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="resize-none bg-white text-slate-900 border-slate-300"
                />
              </div>
            </div>
          )}

          <DialogFooter className="bg-white">
            <Button
              variant="outline"
              onClick={() => {
                setRatingModalOpen(false);
                setRating(0);
                setComment("");
                setSelectedOrder(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={rating === 0 || submitRatingMutation.isPending}
            >
              {submitRatingMutation.isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provider View Ratings Modal */}
      <Dialog open={viewRatingsModalOpen} onOpenChange={setViewRatingsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Customer Reviews</DialogTitle>
            <DialogDescription className="text-slate-600">
              See what customers are saying about this stream
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* Order Info */}
              <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-sm mb-1 text-slate-900">{selectedOrder.title}</h4>
                <p className="text-xs text-slate-600">
                  ${selectedOrder.price} • {new Date(selectedOrder.scheduledAt).toLocaleDateString()}
                </p>
              </div>

              {/* Ratings List */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {orderRatings?.data?.length > 0 ? (
                  orderRatings.data.map((rating: any) => (
                    <Card key={rating.id} className="p-4 bg-white border-2 border-slate-300 shadow-md">
                      <div className="space-y-2">
                        {/* Customer Info & Rating */}
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm text-slate-900">
                              {rating.reviewerName || 'Customer'}
                            </p>
                            <p className="text-xs text-slate-600">
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= rating.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Comment */}
                        {rating.comment && (
                          <p className="text-sm text-slate-800 mt-2 p-3 bg-slate-100 rounded border border-slate-200">
                            "{rating.comment}"
                          </p>
                        )}

                        {/* Additional Ratings */}
                        {(rating.qualityRating || rating.punctualityRating || rating.communicationRating) && (
                          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200">
                            {rating.qualityRating && (
                              <div className="text-center">
                                <p className="text-xs text-slate-600">Quality</p>
                                <p className="text-sm font-semibold text-slate-900">{rating.qualityRating}/5</p>
                              </div>
                            )}
                            {rating.punctualityRating && (
                              <div className="text-center">
                                <p className="text-xs text-slate-600">Punctuality</p>
                                <p className="text-sm font-semibold text-slate-900">{rating.punctualityRating}/5</p>
                              </div>
                            )}
                            {rating.communicationRating && (
                              <div className="text-center">
                                <p className="text-xs text-slate-600">Communication</p>
                                <p className="text-sm font-semibold text-slate-900">{rating.communicationRating}/5</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 bg-white">
                    <Star className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">No reviews yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="bg-white">
            <Button
              onClick={() => {
                setViewRatingsModalOpen(false);
                setSelectedOrder(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}