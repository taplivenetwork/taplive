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
import { DemoControls } from "@/components/demo-controls";
import { TranslatedText } from "@/components/translated-text";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import type { Order } from "@shared/schema";

declare global {
  interface Window {
    mapUpdateLocation?: (lat: number, lng: number) => void;
  }
}

export default function Home() {
  const { toast } = useToast();
  const { currentLanguage } = useTranslation();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
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

  const orders = ordersResponse?.data || [];

  // Filter orders
  const filteredOrders = orders.filter((order: Order) => {
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
            <h2 className="text-2xl font-bold text-foreground">
              <TranslatedText>Discover Live Streams</TranslatedText>
            </h2>
            <p className="text-muted-foreground">
              <TranslatedText>Find and create location-based streaming experiences</TranslatedText>
            </p>
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
              <span>
                <TranslatedText>
                  {healthStatus === "connected" ? "API Connected" : "API Disconnected"}
                </TranslatedText>
              </span>
            </Badge>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90" 
              onClick={() => setCreateModalOpen(true)}
              data-testid="button-create-order"
            >
              <Plus className="w-4 h-4 mr-2" />
              <TranslatedText>Create Order</TranslatedText>
            </Button>
          </div>
        </header>

        {/* Map Container */}
        <div className="solid-card rounded-xl p-1 mb-6">
          <Map 
            orders={orders} 
            onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
            center={mapCenter}
          />
        </div>

        {/* Active Streams */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            <TranslatedText>Active Streams Nearby</TranslatedText>
          </h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="solid-card rounded-xl p-4 animate-pulse">
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
            <div className="solid-card rounded-xl p-8 text-center">
              <p className="text-muted-foreground">
                <TranslatedText>No active streams nearby at the moment</TranslatedText>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Panel */}
      <aside className="w-full lg:w-96 border-l border-border p-6 bg-white">
        <div className="space-y-6">
          {/* Demo Controls */}
          <DemoControls />
          
          {/* Tabs */}
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="available" data-testid="tab-available">
                <TranslatedText>Available Orders</TranslatedText>
              </TabsTrigger>
              <TabsTrigger value="my-orders" data-testid="tab-my-orders">
                <TranslatedText>My Orders</TranslatedText>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-4">
              {/* Filters */}
              <div className="space-y-3">
                <Input
                  placeholder={
                    currentLanguage === 'zh' ? "搜索位置或描述..." :
                    currentLanguage === 'ja' ? "場所や説明で検索..." :
                    currentLanguage === 'es' ? "Buscar por ubicación o descripción..." :
                    currentLanguage === 'ko' ? "위치 또는 설명으로 검색..." :
                    currentLanguage === 'fr' ? "Rechercher par lieu ou description..." :
                    currentLanguage === 'de' ? "Nach Ort oder Beschreibung suchen..." :
                    currentLanguage === 'ru' ? "Поиск по местоположению или описанию..." :
                    currentLanguage === 'pt' ? "Pesquisar por localização ou descrição..." :
                    currentLanguage === 'it' ? "Cerca per posizione o descrizione..." :
                    currentLanguage === 'ar' ? "البحث حسب الموقع أو الوصف..." :
                    currentLanguage === 'hi' ? "स्थान या विवरण द्वारा खोजें..." :
                    "Search by location or description..."}
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  data-testid="input-search"
                />
                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger data-testid="select-category-filter">
                      <SelectValue placeholder={
                        currentLanguage === 'zh' ? "所有类别" :
                        currentLanguage === 'ja' ? "すべてのカテゴリ" :
                        currentLanguage === 'es' ? "Todas las categorías" :
                        currentLanguage === 'ko' ? "모든 카테고리" :
                        currentLanguage === 'fr' ? "Toutes les catégories" :
                        currentLanguage === 'de' ? "Alle Kategorien" :
                        currentLanguage === 'ru' ? "Все категории" :
                        currentLanguage === 'pt' ? "Todas as categorias" :
                        currentLanguage === 'it' ? "Tutte le categorie" :
                        currentLanguage === 'ar' ? "جميع الفئات" :
                        currentLanguage === 'hi' ? "सभी श्रेणियां" :
                        "All Categories"} />
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
                      <SelectValue placeholder={
                        currentLanguage === 'zh' ? "任何价格" :
                        currentLanguage === 'ja' ? "任意の価格" :
                        currentLanguage === 'es' ? "Cualquier precio" :
                        currentLanguage === 'ko' ? "모든 가격" :
                        currentLanguage === 'fr' ? "Tous les prix" :
                        currentLanguage === 'de' ? "Jeder Preis" :
                        currentLanguage === 'ru' ? "Любая цена" :
                        currentLanguage === 'pt' ? "Qualquer preço" :
                        currentLanguage === 'it' ? "Qualsiasi prezzo" :
                        currentLanguage === 'ar' ? "أي سعر" :
                        currentLanguage === 'hi' ? "कोई भी कीमत" :
                        "Any Price"} />
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

              {/* Orders List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">
                  <TranslatedText>Streaming Requests</TranslatedText>
                </h3>
                
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="solid-card rounded-xl p-4 animate-pulse">
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
                  <div className="solid-card rounded-xl p-8 text-center">
                    <p className="text-muted-foreground">
                      <TranslatedText>No orders match your filters</TranslatedText>
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="my-orders" className="space-y-4">
              <div className="solid-card rounded-xl p-8 text-center">
                <p className="text-muted-foreground">
                  <TranslatedText>You haven't created any orders yet</TranslatedText>
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setCreateModalOpen(true)}
                  data-testid="button-create-first-order"
                >
                  <TranslatedText>Create Your First Order</TranslatedText>
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
