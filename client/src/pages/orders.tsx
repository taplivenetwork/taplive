import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { OrderCard } from "@/components/order-card";
import { LiveStreamCard } from "@/components/live-stream-card";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar, TrendingUp, Plus } from "lucide-react";
import type { Order } from "@shared/schema";

export default function Orders() {
  const { toast } = useToast();
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: () => api.orders.getAll(),
  });

  const orders = ordersResponse?.data || [];
  
  // Filter and sort orders
  const filteredOrders = orders.filter((order: Order) => {
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

  // Filter orders by status
  const pendingOrders = orders.filter((order: Order) => order.status === 'pending');
  const openOrders = orders.filter((order: Order) => order.status === 'open');
  const acceptedOrders = orders.filter((order: Order) => order.status === 'accepted');
  const liveOrders = orders.filter((order: Order) => order.status === 'live');
  const completedOrders = orders.filter((order: Order) => order.status === 'done');

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
            {emptyMessage}
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first streaming order to get started
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        </div>
      );
    }

    // Use LiveStreamCard for live orders, OrderCard for others
    return (
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {orderList.map((order) => {
          if (order.status === 'live' || order.status === 'accepted') {
            return (
              <LiveStreamCard
                key={order.id}
                stream={order}
                onJoin={handleJoinStream}
                onDelete={handleDeleteStream}
              />
            );
          }
          return (
            <div key={order.id} className="col-span-1">
              <OrderCard
                order={order}
                showActions={true}
              />
            </div>
          );
        })}
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
              My Orders Dashboard
            </h2>
            <p className="text-muted-foreground">
              Manage your streaming orders and track their progress
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{orders.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{liveOrders.length}</div>
                <div className="text-xs text-muted-foreground">Live</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingOrders.length}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </Card>
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
                placeholder="Search orders..."
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <TrendingUp className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-secondary mb-6">
            <TabsTrigger value="all" data-testid="tab-all">
              All
              <Badge variant="secondary" className="ml-2">{orders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending
              <Badge variant="secondary" className="ml-2">{pendingOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="open" data-testid="tab-open">
              Open
              <Badge variant="secondary" className="ml-2">{openOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="accepted" data-testid="tab-accepted">
              Accepted
              <Badge variant="secondary" className="ml-2">{acceptedOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="live" data-testid="tab-live">
              Live
              <Badge variant="secondary" className="ml-2">{liveOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed
              <Badge variant="secondary" className="ml-2">{completedOrders.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderOrderList(filteredOrders, "You haven't created any orders yet")}
          </TabsContent>

          <TabsContent value="pending">
            {renderOrderList(pendingOrders, "No pending orders")}
          </TabsContent>

          <TabsContent value="open">
            {renderOrderList(openOrders, "No open orders")}
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
        </Tabs>
      </div>
    </div>
  );
}