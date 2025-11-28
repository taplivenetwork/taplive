import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TranslatedText } from "@/components/translated-text";
import { DollarSign, TrendingUp, Calendar, Clock, Star, AlertCircle } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  completedStreams: number;
  avgRating: number;
  recentEarnings: Array<{
    id: string;
    title: string;
    amount: number;
    date: string;
    duration: number;
    orderId: string;
    status: string;
  }>;
}

export default function Earnings() {
  const { user, isLoaded } = useUser();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchEarnings();
    }
  }, [isLoaded, user]);

  const fetchEarnings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${user.id}/earnings`);
      
      if (response.status === 403) {
        setError("Earnings data is only available for providers");
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch earnings data');
      }

      const data = await response.json();
      setEarningsData(data.data);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError('Failed to load earnings data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Earnings Skeleton */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-6 w-12 mb-2" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              <TranslatedText context="earnings">Earnings</TranslatedText>
            </h1>
          </div>
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <p className="text-sm text-muted-foreground">
                Only providers can view earnings data.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show no data state
  if (!earningsData) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              <TranslatedText context="earnings">Earnings</TranslatedText>
            </h1>
            <p className="text-muted-foreground">
              <TranslatedText context="earnings">Track your streaming revenue and performance</TranslatedText>
            </p>
          </div>
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Earnings Yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete your first stream to start earning!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { totalEarnings, monthlyEarnings, completedStreams, avgRating, recentEarnings } = earningsData;

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            <TranslatedText context="earnings">Earnings</TranslatedText>
          </h1>
          <p className="text-muted-foreground">
            <TranslatedText context="earnings">Track your streaming revenue and performance</TranslatedText>
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <TranslatedText context="earnings">Total Earnings</TranslatedText>
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                <TranslatedText context="earnings">All time</TranslatedText>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <TranslatedText context="earnings">This Month</TranslatedText>
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${monthlyEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                <TranslatedText context="earnings">Current month</TranslatedText>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <TranslatedText context="earnings">Completed Streams</TranslatedText>
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedStreams}</div>
              <p className="text-xs text-muted-foreground">
                <TranslatedText context="earnings">This month</TranslatedText>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <TranslatedText context="earnings">Average Rating</TranslatedText>
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                <TranslatedText context="earnings">From customer reviews</TranslatedText>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Earnings */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle>
              <TranslatedText context="earnings">Recent Earnings</TranslatedText>
            </CardTitle>
            <CardDescription>
              <TranslatedText context="earnings">Your latest completed streaming sessions</TranslatedText>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentEarnings.length > 0 ? (
              <div className="space-y-4">
                {recentEarnings.map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-card/50">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">
                        <TranslatedText context="earnings">{earning.title}</TranslatedText>
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(earning.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {earning.duration} min
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ${earning.amount.toFixed(2)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <TranslatedText context="earnings">Completed</TranslatedText>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Recent Earnings</h3>
                <p className="text-muted-foreground">
                  Your completed streams will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}