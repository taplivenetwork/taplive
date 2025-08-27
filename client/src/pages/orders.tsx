import { useQuery } from "@tanstack/react-query";
import { OrderCard } from "@/components/order-card";
import { TranslatedText } from "@/components/translated-text";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Order } from "@shared/schema";

export default function Orders() {
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: () => api.orders.getAll(),
  });

  const orders = ordersResponse?.data || [];

  // Filter orders by status
  const pendingOrders = orders.filter((order: Order) => order.status === 'pending');
  const openOrders = orders.filter((order: Order) => order.status === 'open');
  const acceptedOrders = orders.filter((order: Order) => order.status === 'accepted');
  const liveOrders = orders.filter((order: Order) => order.status === 'live');
  const completedOrders = orders.filter((order: Order) => order.status === 'done');

  const renderOrderList = (orderList: Order[], emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="solid-card rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      );
    }

    if (orderList.length === 0) {
      return (
        <div className="solid-card rounded-xl p-8 text-center">
          <p className="text-muted-foreground">
            <TranslatedText>{emptyMessage}</TranslatedText>
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {orderList.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            showActions={false}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 p-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          <TranslatedText>My Orders</TranslatedText>
        </h2>
        <p className="text-muted-foreground">
          <TranslatedText>Manage your streaming orders and track their progress</TranslatedText>
        </p>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-secondary mb-6">
          <TabsTrigger value="all" data-testid="tab-all">
            <TranslatedText>All</TranslatedText>
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            <TranslatedText>Pending</TranslatedText>
          </TabsTrigger>
          <TabsTrigger value="open" data-testid="tab-open">
            <TranslatedText>Open</TranslatedText>
          </TabsTrigger>
          <TabsTrigger value="accepted" data-testid="tab-accepted">
            <TranslatedText>Accepted</TranslatedText>
          </TabsTrigger>
          <TabsTrigger value="live" data-testid="tab-live">
            <TranslatedText>Live</TranslatedText>
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            <TranslatedText>Completed</TranslatedText>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderOrderList(orders, "You haven't created any orders yet")}
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
  );
}
