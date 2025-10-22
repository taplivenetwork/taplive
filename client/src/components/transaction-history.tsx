import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, ArrowDownLeft, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Transaction, Payout } from "@shared/schema";

interface TransactionHistoryProps {
  userId: string;
  className?: string;
}

export function TransactionHistory({ userId, className }: TransactionHistoryProps) {
  // Fetch user transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/transactions`],
    queryFn: () => fetch(`/api/users/${userId}/transactions`).then(res => res.json()),
    enabled: !!userId,
  });

  // Fetch user payouts
  const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/payouts`],
    queryFn: () => fetch(`/api/users/${userId}/payouts`).then(res => res.json()),
    enabled: !!userId,
  });

  const transactions: Transaction[] = transactionsData?.data || [];
  const payouts: Payout[] = payoutsData?.data || [];
  const isLoading = transactionsLoading || payoutsLoading;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'payout':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'refund':
        return <ArrowDownLeft className="w-4 h-4 text-blue-500" />;
      case 'commission':
        return <DollarSign className="w-4 h-4 text-yellow-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'text-red-600';
      case 'payout':
        return 'text-green-600';
      case 'refund':
        return 'text-blue-600';
      case 'commission':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.pending}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="space-y-1">
                      <div className="w-32 h-4 bg-gray-200 rounded"></div>
                      <div className="w-24 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allActivity = [
    ...transactions.map(t => ({
      id: t.id,
      type: 'transaction' as const,
      data: t,
      date: t.createdAt,
    })),
    ...payouts.map(p => ({
      id: p.id,
      type: 'payout' as const,
      data: p,
      date: p.createdAt,
    })),
  ].sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allActivity.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm mt-1">
              Your payment and payout history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allActivity.map((activity, index) => (
              <div key={activity.id}>
                {activity.type === 'transaction' ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(activity.data.type)}
                      <div>
                        <div className="font-medium text-sm">
                          {activity.data.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(activity.data.createdAt!), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${getTransactionColor(activity.data.type)}`}>
                        {activity.data.type === 'payment' ? '-' : '+'}${activity.data.amount} {activity.data.currency}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {activity.data.type}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50/50">
                    <div className="flex items-center gap-3">
                      <ArrowDownLeft className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="font-medium text-sm">
                          Payout Received
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(activity.data.createdAt!), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        +${activity.data.amount} {activity.data.currency}
                      </div>
                      {getStatusBadge(activity.data.status)}
                    </div>
                  </div>
                )}
                {index < allActivity.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}