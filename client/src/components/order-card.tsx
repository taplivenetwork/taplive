import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TranslatedText } from "@/components/translated-text";
import { MapPin, Clock, Users, DollarSign } from "lucide-react";
import type { Order } from "@shared/schema";

interface OrderCardProps {
  order: Order;
  onAccept?: (orderId: string) => void;
  onJoin?: (orderId: string) => void;
  showActions?: boolean;
}

export function OrderCard({ order, onAccept, onJoin, showActions = true }: OrderCardProps) {
  const scheduledDate = new Date(order.scheduledAt);
  const isLive = order.status === 'live';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-accent/20 text-accent';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'accepted': return 'bg-blue-500/20 text-blue-400';
      case 'live': return 'bg-red-500/20 text-red-400';
      case 'done': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatScheduledTime = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
    } else if (diffHours > 0) {
      return `In ${diffHours}h`;
    } else if (diffMs > 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `In ${diffMins}m`;
    } else {
      return 'Now';
    }
  };

  return (
    <div className="solid-card rounded-xl p-4 space-y-3 order-card" data-testid={`order-card-${order.id}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1" data-testid="order-title">
            <TranslatedText>{order.title}</TranslatedText>
          </h4>
          <p className="text-sm text-muted-foreground" data-testid="order-description">
            <TranslatedText>{order.description}</TranslatedText>
          </p>
        </div>
        <Badge 
          className={getStatusColor(order.status)} 
          data-testid="order-status"
        >
          {isLive && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />}
          <TranslatedText>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</TranslatedText>
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground" data-testid="order-location">
          <MapPin className="w-4 h-4" />
          <TranslatedText>{order.address}</TranslatedText>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground" data-testid="order-schedule">
          <Clock className="w-4 h-4" />
          <span><TranslatedText>{formatScheduledTime(scheduledDate)}</TranslatedText> • {order.duration}<TranslatedText>min</TranslatedText></span>
        </div>
        {order.type === 'group' && (
          <div className="flex items-center gap-2 text-muted-foreground" data-testid="order-participants">
            <Users className="w-4 h-4" />
            <span>{order.currentParticipants}/{order.maxParticipants} <TranslatedText>participants</TranslatedText></span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {order.creatorId && (
            <>
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                U
              </div>
              <span className="text-sm font-medium">
                <TranslatedText>Creator</TranslatedText>
              </span>
            </>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-lg font-bold text-primary" data-testid="order-price">
            <DollarSign className="w-4 h-4" />
            {order.price}
          </div>
          <div className="text-xs text-muted-foreground">
            <TranslatedText>{order.type === 'group' ? 'Total Pool' : 'Price'}</TranslatedText>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2 pt-2">
          {order.status === 'live' ? (
            <Button 
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" 
              onClick={() => onJoin?.(order.id)}
              data-testid="button-join-stream"
            >
              <TranslatedText>Join Stream</TranslatedText>
            </Button>
          ) : order.status === 'open' || order.status === 'pending' ? (
            <Button 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
              onClick={() => onAccept?.(order.id)}
              data-testid="button-accept-order"
            >
              <TranslatedText>Accept Order</TranslatedText>
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="flex-1" 
              disabled
              data-testid="button-order-unavailable"
            >
              <TranslatedText>{order.status === 'done' ? 'Completed' : 'Unavailable'}</TranslatedText>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
