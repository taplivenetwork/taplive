import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, TrendingUp, Check, X } from "lucide-react";
import { TranslatedText } from "@/components/translated-text";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";

interface NotificationCardProps {
  notification: Notification;
  onAccept?: (orderId: string) => void;
  onDismiss?: () => void;
}

export function NotificationCard({ notification, onAccept, onDismiss }: NotificationCardProps) {
  const { toast } = useToast();

  // Parse metadata
  const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PATCH', `/api/notifications/${notification.id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });

  const handleViewOrder = () => {
    if (notification.orderId) {
      markReadMutation.mutate();
      // Navigate using window.location for simplicity
      window.location.href = `/orders/${notification.orderId}`;
    }
  };

  const handleAccept = () => {
    if (notification.orderId) {
      markReadMutation.mutate();
      onAccept?.(notification.orderId);
    }
  };

  const handleDismiss = () => {
    markReadMutation.mutate();
    onDismiss?.();
  };

  // Check if expired
  const isExpired = notification.expiresAt && new Date(notification.expiresAt) < new Date();

  if (notification.type === 'order_dispatch') {
    return (
      <Card className={`border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all ${isExpired ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-slate-900">{notification.title}</h4>
                <Badge variant={isExpired ? "secondary" : "default"} className="ml-auto">
                  {isExpired ? 'Expired' : `${metadata.dispatchScore?.toFixed(0) || 0}% Match`}
                </Badge>
              </div>

              {/* Details */}
              <div className="space-y-2 ml-8">
                <p className="text-sm text-slate-700">{notification.message}</p>
                
                {metadata.orderLocation && (
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{metadata.orderLocation.address || `${metadata.orderLocation.latitude}, ${metadata.orderLocation.longitude}`}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(notification.createdAt || '').toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {!isExpired && (
                <div className="flex items-center gap-2 mt-3 ml-8">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm"
                    onClick={handleAccept}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    <TranslatedText context="notifications">Accept Order</TranslatedText>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-200"
                    onClick={handleViewOrder}
                  >
                    <TranslatedText context="notifications">View Details</TranslatedText>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {isExpired && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 ml-8 text-slate-500"
                  onClick={handleDismiss}
                >
                  <TranslatedText context="notifications">Dismiss</TranslatedText>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generic notification
  return (
    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">{notification.title}</h4>
            <p className="text-sm text-slate-700">{notification.message}</p>
            <p className="text-xs text-slate-500 mt-2">
              {new Date(notification.createdAt || '').toLocaleString()}
            </p>
          </div>
          {!notification.read && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => markReadMutation.mutate()}
            >
              <Check className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
