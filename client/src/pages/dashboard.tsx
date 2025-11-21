import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TransactionHistory } from "@/components/transaction-history";
import { TranslatedText } from "@/components/translated-text";
import { DollarSign, TrendingUp, Clock, Star, CreditCard, ArrowUpRight } from "lucide-react";

export function Dashboard() {
  // For demo purposes, using a fixed user ID
  const userId = "890ed15c-d22b-4fde-a6f0-3b5096411d80";

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
  });

  // Fetch user orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: () => fetch('/api/orders').then(res => res.json()),
  });

  // Fetch user transactions
  const { data: transactionsData } = useQuery({
    queryKey: [`/api/users/${userId}/transactions`],
    queryFn: () => fetch(`/api/users/${userId}/transactions`).then(res => res.json()),
  });

  // Fetch user payouts
  const { data: payoutsData } = useQuery({
    queryKey: [`/api/users/${userId}/payouts`],
    queryFn: () => fetch(`/api/users/${userId}/payouts`).then(res => res.json()),
  });

  const user = userData?.data;
  const orders = ordersData?.data || [];
  const transactions = transactionsData?.data || [];
  const payouts = payoutsData?.data || [];

  // Calculate statistics
  const userOrders = orders.filter((order: any) => order.creatorId === userId || order.providerId === userId);
  const completedOrders = userOrders.filter((order: any) => order.status === 'done');
  const totalEarnings = parseFloat(user?.totalEarnings || '0');
  const totalSpent = transactions
    .filter((t: any) => t.type === 'payment')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
  const pendingPayouts = payouts.filter((p: any) => p.status === 'pending').length;

  if (userLoading || ordersLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            <TranslatedText context="dashboard">Dashboard</TranslatedText>
          </h1>
          <p className="text-muted-foreground mt-1">
            <TranslatedText context="dashboard">Welcome back</TranslatedText>, {user?.name || 'User'}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <TranslatedText context="dashboard">{user?.role || 'User'}</TranslatedText>
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <TranslatedText context="dashboard">Total Earnings</TranslatedText>
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="total-earnings">
              ${totalEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TranslatedText context="dashboard">From completed orders</TranslatedText>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <TranslatedText context="dashboard">Total Spent</TranslatedText>
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="total-spent">
              ${totalSpent.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TranslatedText context="dashboard">On streaming orders</TranslatedText>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <TranslatedText context="dashboard">Completed Orders</TranslatedText>
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="completed-orders">
              {completedOrders.length}
            </div>
            <p className="text-xs text-muted-foreground">
              <TranslatedText context="dashboard">Successfully completed</TranslatedText>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <TranslatedText context="dashboard">Rating</TranslatedText>
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="user-rating">
              {user?.rating || '0.0'}⭐
            </div>
            <p className="text-xs text-muted-foreground">
              <TranslatedText context="dashboard">From</TranslatedText> {user?.totalRatings || 0} <TranslatedText context="dashboard">reviews</TranslatedText>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <TranslatedText context="dashboard">Payment Summary</TranslatedText>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                <TranslatedText context="dashboard">Recent Transactions</TranslatedText>
              </span>
              <Badge variant="outline">{transactions.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                <TranslatedText context="dashboard">Pending Payouts</TranslatedText>
              </span>
              <Badge variant={pendingPayouts > 0 ? 'default' : 'secondary'}>
                {pendingPayouts}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                <TranslatedText context="dashboard">Completed Payouts</TranslatedText>
              </span>
              <Badge variant="outline">
                {payouts.filter((p: any) => p.status === 'completed').length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5" />
              <TranslatedText context="dashboard">Quick Actions</TranslatedText>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <span><TranslatedText context="dashboard">Create New Order</TranslatedText></span>
                <span className="text-xs text-muted-foreground">→</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <span><TranslatedText context="dashboard">Browse Orders</TranslatedText></span>
                <span className="text-xs text-muted-foreground">→</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <span><TranslatedText context="dashboard">Update Profile</TranslatedText></span>
                <span className="text-xs text-muted-foreground">→</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Revenue Model */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <TranslatedText context="dashboard">Revenue Model</TranslatedText>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <TranslatedText context="dashboard">Platform Fee</TranslatedText>
                </span>
                <span className="font-medium">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <TranslatedText context="dashboard">Provider Share</TranslatedText>
                </span>
                <span className="font-medium text-green-600">90%</span>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                <TranslatedText context="dashboard">Automatic payout after order completion</TranslatedText>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <TransactionHistory userId={userId} className="w-full" />
    </div>
  );
}