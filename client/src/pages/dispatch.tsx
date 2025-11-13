import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ProviderRankingCard } from "@/components/provider-ranking";
import { TrendingUp, Users, MapPin, Zap } from "lucide-react";
import type { Order } from "@shared/schema";
import type { ProviderRanking } from "@shared/dispatch";

export function DispatchPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);

  // Fetch all orders
  const { data: ordersData } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: () => fetch('/api/orders').then(res => res.json()),
  });

  // Fetch available providers
  const { data: providersData } = useQuery({
    queryKey: ['/api/providers'],
    queryFn: () => fetch('/api/providers').then(res => res.json()),
  });

  // Fetch ranked providers for selected order
  const { data: rankingsData, isLoading: rankingsLoading } = useQuery({
    queryKey: [`/api/orders/${selectedOrderId}/providers`],
    queryFn: () => fetch(`/api/orders/${selectedOrderId}/providers`).then(res => res.json()),
    enabled: !!selectedOrderId,
  });

  // Fetch algorithm info
  const { data: algorithmData } = useQuery({
    queryKey: ['/api/dispatch/algorithm'],
    queryFn: () => fetch('/api/dispatch/algorithm').then(res => res.json()),
  });

  const orders: Order[] = ordersData?.data || [];
  const providers = providersData?.data || [];
  const rankings: ProviderRanking[] = rankingsData?.data || [];
  const algorithm = algorithmData?.data;

  const openOrders = orders.filter(order => order.status === 'open' || order.status === 'pending');
  const selectedOrder = orders.find(order => order.id === selectedOrderId);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
<<<<<<< HEAD
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
=======
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
          <TrendingUp className="w-6 h-6" />
          Smart Dispatch System
        </h1>
        <p className="text-muted-foreground">
          Intelligent provider ranking based on distance, reputation, network speed and device performance
        </p>
      </div>

      {/* Algorithm Overview */}
      {algorithm && (
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Algorithm Weights
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(algorithm.weights).map(([factor, weight]) => (
              <div key={factor} className="text-center">
<<<<<<< HEAD
                <div className="text-2xl font-bold text-primary">{weight as number}%</div>
                <div className="text-xs text-muted-foreground capitalize">
=======
                <div className="text-3xl font-bold text-primary">{weight as number}%</div>
                <div className="text-base text-muted-foreground capitalize">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
                  {factor}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <div>
<<<<<<< HEAD
              <div className="text-2xl font-bold text-foreground">{openOrders.length}</div>
              <div className="text-sm text-muted-foreground">
=======
              <div className="text-3xl font-bold text-foreground">{openOrders.length}</div>
              <div className="text-base text-muted-foreground">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
                Active Orders
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <div>
<<<<<<< HEAD
              <div className="text-2xl font-bold text-foreground">{providers.length}</div>
              <div className="text-sm text-muted-foreground">
=======
              <div className="text-3xl font-bold text-foreground">{providers.length}</div>
              <div className="text-base text-muted-foreground">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
                Available Providers
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <div>
<<<<<<< HEAD
              <div className="text-2xl font-bold text-foreground">
=======
              <div className="text-3xl font-bold text-foreground">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
                {providers.length > 0 ? 
                  (providers.reduce((sum: number, p: any) => sum + parseFloat(p.dispatchScore || '0'), 0) / providers.length).toFixed(1)
                  : '0.0'
                }
              </div>
<<<<<<< HEAD
              <div className="text-sm text-muted-foreground">
=======
              <div className="text-base text-muted-foreground">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
                Avg Dispatch Score
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Order Selection and Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="space-y-2 flex-1">
<<<<<<< HEAD
            <label className="text-sm font-medium text-foreground">
=======
            <label className="text-base font-medium text-foreground">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
              Select Order for Provider Ranking
            </label>
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
              <SelectTrigger className="w-full md:w-80" data-testid="select-order">
                <SelectValue placeholder="Choose an order..." />
              </SelectTrigger>
              <SelectContent>
                {openOrders.map(order => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.title} - ${order.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
<<<<<<< HEAD
            <label className="text-sm text-foreground">
=======
            <label className="text-base text-foreground">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
              Show Details
            </label>
            <Switch 
              checked={showDetails} 
              onCheckedChange={setShowDetails}
              data-testid="toggle-details"
            />
          </div>
        </div>

        {selectedOrder && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-foreground">{selectedOrder.title}</h4>
<<<<<<< HEAD
            <p className="text-sm text-muted-foreground mt-1">{selectedOrder.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
=======
            <p className="text-base text-muted-foreground mt-1">{selectedOrder.description}</p>
            <div className="flex items-center gap-4 mt-2 text-base text-muted-foreground">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
              <span>📍 {selectedOrder.address}</span>
              <span>💰 ${selectedOrder.price}</span>
              <span>⏱️ {selectedOrder.duration}min</span>
            </div>
          </div>
        )}
      </Card>

      {/* Provider Rankings */}
      {selectedOrderId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Provider Rankings
            </h2>
            {rankings.length > 0 && (
              <Badge variant="outline" data-testid="provider-count">
                {rankings.length} providers
              </Badge>
            )}
          </div>

          {rankingsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Calculating rankings...
            </div>
          ) : rankings.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No available providers found for this order</p>
<<<<<<< HEAD
                <p className="text-sm mt-1">
=======
                <p className="text-base mt-1">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
                  Providers need to be online and have location data
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {rankings.map((ranking) => (
                <ProviderRankingCard
                  key={ranking.userId}
                  ranking={ranking}
                  showDetails={showDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}