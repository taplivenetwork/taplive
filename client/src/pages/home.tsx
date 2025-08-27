import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map } from "@/components/ui/map";
import { OrderCard } from "@/components/order-card";
import { CreateOrderModal } from "@/components/create-order-modal";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [healthStatus, setHealthStatus] = useState<"connected" | "disconnected">("disconnected");

  // Health check
  const { data: healthData } = useQuery({
    queryKey: ['/healthz'],
    queryFn: api.health.check,
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
  });

  useEffect(() => {
    setHealthStatus(healthData ? "connected" : "disconnected");
  }, [healthData]);

  // Fetch orders
  const { data: ordersResponse, isLoading, error } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: () => api.orders.getAll(),
  });

  const orders = ordersResponse?.data || [];

  // Filter orders
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = !searchFilter || 
      order.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      order.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      order.address?.toLowerCase().includes(searchFilter.toLowerCase());
    
    const matchesCategory = !categoryFilter || order.category === categoryFilter;
    
    const matchesPrice = !priceFilter || (() => {
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
        title: "Success",
        description: "Order accepted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept order",
        variant: "destructive",
      });
    }
  };

  const handleJoinStream = (orderId: string) => {
    toast({
      title: "Joining Stream",
      description: "Opening live stream...",
    });
    // TODO: Implement stream joining logic
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
    <div className="flex-1 flex flex-col lg:flex-row">
      {/* Map Section */}
      <div className="flex-1 p-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Discover Live Streams</h2>
            <p className="text-muted-foreground">Find and create location-based streaming experiences</p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {/* Health Status */}
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
              <span>{healthStatus === "connected" ? "API Connected" : "API Disconnected"}</span>
            </Badge>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90" 
              onClick={() => setCreateModalOpen(true)}
              data-testid="button-create-order"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </div>
        </header>

        {/* Map Container */}
        <div className="glassmorphism rounded-xl p-1 mb-6">
          <Map 
            orders={orders} 
            onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
          />
        </div>

        {/* Active Streams */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Active Streams Nearby</h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="glassmorphism rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : activeStreams.length > 0 ? (
            <div className="space-y-4">
              {activeStreams.map((stream) => (
                <OrderCard
                  key={stream.id}
                  order={stream}
                  onJoin={handleJoinStream}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <div className="glassmorphism rounded-xl p-8 text-center">
              <p className="text-muted-foreground">No active streams nearby at the moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Panel */}
      <aside className="w-full lg:w-96 border-l border-border p-6 bg-card/50">
        <div className="space-y-6">
          {/* Tabs */}
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="available" data-testid="tab-available">Available Orders</TabsTrigger>
              <TabsTrigger value="my-orders" data-testid="tab-my-orders">My Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-4">
              {/* Filters */}
              <div className="space-y-3">
                <Input
                  placeholder="Search by location or description..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  data-testid="input-search"
                />
                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger data-testid="select-category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
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
                      <SelectItem value="">Any Price</SelectItem>
                      <SelectItem value="10-25">$10-25</SelectItem>
                      <SelectItem value="25-50">$25-50</SelectItem>
                      <SelectItem value="50+">$50+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Streaming Requests</h3>
                
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="glassmorphism rounded-xl p-4 animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAccept={handleAcceptOrder}
                        onJoin={handleJoinStream}
                        showActions={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glassmorphism rounded-xl p-8 text-center">
                    <p className="text-muted-foreground">No orders match your filters</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="my-orders" className="space-y-4">
              <div className="glassmorphism rounded-xl p-8 text-center">
                <p className="text-muted-foreground">You haven't created any orders yet</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setCreateModalOpen(true)}
                  data-testid="button-create-first-order"
                >
                  Create Your First Order
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </aside>

      {/* Create Order Modal */}
      <CreateOrderModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        selectedLocation={selectedLocation}
      />
    </div>
  );
}
