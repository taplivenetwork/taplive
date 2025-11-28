import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TransactionHistory } from "@/components/transaction-history";
import { TranslatedText } from "@/components/translated-text";
import { DollarSign, TrendingUp, Clock, Star, CreditCard, ArrowUpRight, Users, Activity, Wifi, Smartphone, MapPin, Calendar, CheckCircle2, AlertCircle, TrendingDown } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

export function Dashboard() {
  const { userId } = useAuth();

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
    enabled: !!userId,
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
    enabled: !!userId,
  });
 
  // Fetch user payouts
  const { data: payoutsData } = useQuery({
    queryKey: [`/api/users/${userId}/payouts`],
    queryFn: () => fetch(`/api/users/${userId}/payouts`).then(res => res.json()),
    enabled: !!userId,
  });

  // Fetch user notifications
  const { data: notificationsData } = useQuery({
    queryKey: [`/api/users/${userId}/notifications`],
    queryFn: () => fetch(`/api/users/${userId}/notifications`).then(res => res.json()),
    enabled: !!userId,
 
  });

  const user = userData?.data;
  const orders = ordersData?.data || [];
  const transactions = transactionsData?.data || [];
  const payouts = payoutsData?.data || [];
  console.log("notificationData", notificationsData)
  const notifications = notificationsData?.data || [];
  console.log("First notification:", notifications[0])

  // Role-based order filtering
  const userRole = user?.role || 'customer';
  const userOrders = orders.filter((order: any) => {
    if (userRole === 'provider') {
      return order.providerId === userId;
    } else {
      return order.creatorId === userId;
    }
  });

  // Calculate statistics based on role
  const completedOrders = userOrders.filter((order: any) => order.status === 'done');
  const activeOrders = userOrders.filter((order: any) => ['accepted', 'live'].includes(order.status));
  const pendingOrders = userOrders.filter((order: any) => order.status === 'pending');
  const cancelledOrders = userOrders.filter((order: any) => order.status === 'cancelled');

  // Role-specific calculations
  let totalEarnings = 0;
  let totalSpent = 0;
  let pendingPayouts = 0;
  let averageRating = 0;
  let responseTime = 0;
  let trustScore = 0;
  let availability = false;
  let networkSpeed = 0;
  let devicePerformance = 0;

  if (userRole === 'provider') {
    totalEarnings = parseFloat(user?.totalEarnings || '0');
    pendingPayouts = payouts.filter((p: any) => p.status === 'pending').length;
    averageRating = parseFloat(user?.rating || '0');
    responseTime = user?.responseTime || 0;
    trustScore = parseFloat(user?.trustScore || '0');
    availability = user?.availability || false;
    networkSpeed = parseFloat(user?.networkSpeed || '0');
    devicePerformance = parseFloat(user?.devicePerformance || '0');
  } else {
    // Customer calculations
    totalSpent = transactions
      .filter((t: any) => t.type === 'payment')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
    averageRating = parseFloat(user?.rating || '0');
  }

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
          {userRole === 'provider' && (
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>Service Area: {user?.availableRadius || 10}km</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Last Active: {user?.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Recently'}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            <TranslatedText context="dashboard">{userRole === 'provider' ? 'Service Provider' : 'Customer'}</TranslatedText>
          </Badge>
          {userRole === 'provider' && (
            <Badge variant={availability ? 'default' : 'secondary'} className="text-sm">
              {availability ? '🟢 Available' : '⚪ Unavailable'}
            </Badge>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userRole === 'provider' ? (
          // Provider Statistics
          <>
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
                  <TranslatedText context="dashboard">Completed Orders</TranslatedText>
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
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
                  <TranslatedText context="dashboard">Provider Rating</TranslatedText>
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="user-rating">
                  {averageRating.toFixed(1)}⭐
                </div>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText context="dashboard">From</TranslatedText> {user?.totalRatings || 0} <TranslatedText context="dashboard">reviews</TranslatedText>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <TranslatedText context="dashboard">Response Time</TranslatedText>
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="response-time">
                  {responseTime}min
                </div>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText context="dashboard">Average response time</TranslatedText>
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          // Customer Statistics
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <TranslatedText context="dashboard">Total Spent</TranslatedText>
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
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
                  <TranslatedText context="dashboard">Orders Created</TranslatedText>
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="orders-created">
                  {userOrders.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText context="dashboard">Total orders placed</TranslatedText>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <TranslatedText context="dashboard">Active Orders</TranslatedText>
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="active-orders">
                  {activeOrders.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText context="dashboard">Currently in progress</TranslatedText>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <TranslatedText context="dashboard">Customer Rating</TranslatedText>
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="customer-rating">
                  {averageRating.toFixed(1)}⭐
                </div>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText context="dashboard">As a customer</TranslatedText>
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Role-specific Additional Information */}
      {userRole === 'provider' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <TranslatedText context="dashboard">Performance Metrics</TranslatedText>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Dispatch Score</TranslatedText>
                </span>
                <span className="font-medium">{parseFloat(user?.dispatchScore || 0).toFixed(1)}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Completed Orders</TranslatedText>
                </span>
                <span className="font-medium">{user?.completedOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Success Rate</TranslatedText>
                </span>
                <span className="font-medium text-green-600">
                  {userOrders.length > 0 ? ((completedOrders.length / userOrders.length) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <TranslatedText context="dashboard">Location & Coverage</TranslatedText>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Service Radius</TranslatedText>
                </span>
                <span className="font-medium">{user?.availableRadius || 10} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Current Location</TranslatedText>
                </span>
                <span className="font-medium text-xs">
                  {user?.currentLatitude && user?.currentLongitude 
                    ? `${parseFloat(user.currentLatitude).toFixed(2)}, ${parseFloat(user.currentLongitude).toFixed(2)}`
                    : 'Not set'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Timezone</TranslatedText>
                </span>
                <span className="font-medium text-xs">{user?.timezone || 'UTC'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <TranslatedText context="dashboard">Order Alerts</TranslatedText>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">New Orders</TranslatedText>
                </span>
                <Badge variant="outline">{pendingOrders.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Urgent Orders</TranslatedText>
                </span>
                <Badge variant="destructive">
                  {userOrders.filter((order: any) => {
                    const scheduledTime = new Date(order.scheduledAt);
                    const now = new Date();
                    const hoursDiff = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                    return hoursDiff <= 2 && hoursDiff > 0;
                  }).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Notifications</TranslatedText>
                </span>
                <Badge variant="secondary">{notifications.filter((n: any) => !n.read && n.status !== 'read').length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {userRole === 'customer' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <TranslatedText context="dashboard">Order Activity</TranslatedText>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">This Month</TranslatedText>
                </span>
                <span className="font-medium">
                  {userOrders.filter((order: any) => {
                    const orderDate = new Date(order.createdAt);
                    const now = new Date();
                    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
                  }).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">This Week</TranslatedText>
                </span>
                <span className="font-medium">
                  {userOrders.filter((order: any) => {
                    const orderDate = new Date(order.createdAt);
                    const now = new Date();
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return orderDate >= weekAgo;
                  }).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Avg Order Value</TranslatedText>
                </span>
                <span className="font-medium text-green-600">
                  ${userOrders.length > 0 ? (totalSpent / userOrders.length).toFixed(2) : '0.00'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-5 h-5" />
                <TranslatedText context="dashboard">Service Quality</TranslatedText>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Completed Orders</TranslatedText>
                </span>
                <span className="font-medium">{completedOrders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Satisfaction Rate</TranslatedText>
                </span>
                <span className="font-medium text-green-600">
                  {userOrders.length > 0 ? ((completedOrders.length / userOrders.length) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Repeat Orders</TranslatedText>
                </span>
                <span className="font-medium">0</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <TranslatedText context="dashboard">Spending Insights</TranslatedText>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Total Spent</TranslatedText>
                </span>
                <span className="font-medium text-blue-600">${totalSpent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Avg Monthly</TranslatedText>
                </span>
                <span className="font-medium">
                  ${(totalSpent / 12).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  <TranslatedText context="dashboard">Most Used Category</TranslatedText>
                </span>
                <span className="font-medium text-xs">
                  {userOrders.length > 0 ? userOrders[0].category : 'None'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {userRole === 'provider' ? (
          // Provider Activity Summary
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  <TranslatedText context="dashboard">Provider Status</TranslatedText>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    <TranslatedText context="dashboard">Availability</TranslatedText>
                  </span>
                  <Badge variant={availability ? 'default' : 'secondary'}>
                    {availability ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    <TranslatedText context="dashboard">Trust Score</TranslatedText>
                  </span>
                  <Badge variant="outline">
                    {trustScore.toFixed(1)}/5.0
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    <TranslatedText context="dashboard">Active Orders</TranslatedText>
                  </span>
                  <Badge variant="outline">
                    {activeOrders.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  <TranslatedText context="dashboard">Device Performance</TranslatedText>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    <TranslatedText context="dashboard">Network Speed</TranslatedText>
                  </span>
                  <span className="font-medium">{networkSpeed.toFixed(1)} Mbps</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    <TranslatedText context="dashboard">Device Score</TranslatedText>
                  </span>
                  <span className="font-medium">{devicePerformance.toFixed(1)}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    <TranslatedText context="dashboard">Device Name</TranslatedText>
                  </span>
                  <span className="font-medium text-xs">{user?.deviceName || 'Unknown'}</span>
                </div>
              </CardContent>
            </Card>

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
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    <TranslatedText context="dashboard">Total Earnings</TranslatedText>
                  </span>
                  <span className="font-medium text-green-600">${totalEarnings.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          // Customer Activity Summary
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  <TranslatedText context="dashboard">Order Status</TranslatedText>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    <TranslatedText context="dashboard">Active Orders</TranslatedText>
                  </span>
                  <Badge variant="outline">
                    {activeOrders.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    <TranslatedText context="dashboard">Pending Orders</TranslatedText>
                  </span>
                  <Badge variant="secondary">
                    {pendingOrders.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    <TranslatedText context="dashboard">Cancelled Orders</TranslatedText>
                  </span>
                  <Badge variant="destructive">
                    {cancelledOrders.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
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
                    <TranslatedText context="dashboard">Total Spent</TranslatedText>
                  </span>
                  <span className="font-medium text-blue-600">${totalSpent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    <TranslatedText context="dashboard">Avg Order Value</TranslatedText>
                  </span>
                  <span className="font-medium">
                    ${userOrders.length > 0 ? (totalSpent / userOrders.length).toFixed(2) : '0.00'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
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
                    <span><TranslatedText context="dashboard">Browse Providers</TranslatedText></span>
                    <span className="text-xs text-muted-foreground">→</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                    <span><TranslatedText context="dashboard">View Order History</TranslatedText></span>
                    <span className="text-xs text-muted-foreground">→</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Transaction History */}
      {userId && <TransactionHistory userId={userId} className="w-full" />}
    </div>
  );
}