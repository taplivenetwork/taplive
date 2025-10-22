import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserRating } from "@/components/user-rating";
import { RatingModal } from "@/components/rating-modal";
import { PaymentModal } from "@/components/payment-modal";
import { MapPin, Clock, Users, DollarSign, Star, CreditCard, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Fetch creator user info if available
  const { data: creatorData } = useQuery({
    queryKey: [`/api/users/${order.creatorId}`],
    queryFn: () => fetch(`/api/users/${order.creatorId}`).then(res => res.json()),
    enabled: !!order.creatorId,
  });

  const creator = creatorData?.data;
  
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
            {order.title}
          </h4>
          <p className="text-sm text-muted-foreground" data-testid="order-description">
            {order.description}
          </p>
        </div>
        <Badge 
          className={getStatusColor(order.status)} 
          data-testid="order-status"
        >
          {isLive && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />}
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground" data-testid="order-location">
          <MapPin className="w-4 h-4" />
          <span>{order.address || `${order.latitude}, ${order.longitude}`}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground" data-testid="order-schedule">
          <Clock className="w-4 h-4" />
          <span>{formatScheduledTime(scheduledDate)} • {order.duration}min</span>
        </div>
        {order.type === 'group' && (
          <div className="flex items-center gap-2 text-muted-foreground" data-testid="order-participants">
            <Users className="w-4 h-4" />
            <span>{order.currentParticipants}/{order.maxParticipants} participants</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {creator && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                {creator.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">
                  {creator.name}
                </span>
                {creator.rating > 0 && (
                  <UserRating 
                    rating={parseFloat(creator.rating)} 
                    totalRatings={creator.totalRatings}
                    className="text-xs"
                  />
                )}
              </div>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-lg font-bold text-primary" data-testid="order-price">
            <DollarSign className="w-4 h-4" />
            {order.price} {order.currency}
          </div>
          <div className="text-xs text-muted-foreground">
            {order.type === 'group' ? 'Total Pool' : 'Price'}
            {order.isPaid && (
              <span className="ml-2 text-green-600 font-medium">
                • Paid
              </span>
            )}
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
              Join Stream
            </Button>
          ) : order.status === 'open' || order.status === 'pending' ? (
            <>
              <Button 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
                onClick={() => onAccept?.(order.id)}
                data-testid="button-accept-order"
              >
                Accept Order
              </Button>
              {!order.isPaid && (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setPaymentModalOpen(true)}
                  data-testid="button-pay-order"
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Pay
                </Button>
              )}
            </>
          ) : (order.status === 'accepted') && order.isPaid && !completing ? (
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handleSubmitForApproval()}
              data-testid="button-submit-for-approval"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Submit for Approval
            </Button>
          ) : order.status === 'awaiting_approval' && order.creatorId === 'demo-customer-id' ? (
            <div className="flex gap-2 flex-1">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleApproveOrder()}
                data-testid="button-approve-order"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleDispute()}
                data-testid="button-dispute-order"
              >
                Dispute
              </Button>
            </div>
          ) : order.status === 'disputed' ? (
            <Button 
              variant="outline" 
              className="flex-1" 
              disabled
              data-testid="button-order-disputed"
            >
              Under Review
            </Button>
          ) : order.status === 'done' ? (
            <div className="flex gap-2 flex-1">
              <Button 
                variant="outline" 
                className="flex-1" 
                disabled
                data-testid="button-order-completed"
              >
                Completed
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setRatingModalOpen(true)}
                data-testid="button-rate-order"
              >
                <Star className="w-4 h-4 mr-1" />
                Rate
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="flex-1" 
              disabled
              data-testid="button-order-unavailable"
            >
              Unavailable
            </Button>
          )}
        </div>
      )}

      {/* Rating Modal */}
      {order.status === 'done' && creator && (
        <RatingModal
          open={ratingModalOpen}
          onOpenChange={setRatingModalOpen}
          order={order}
          reviewType="creator_to_provider" // This would depend on user role
          revieweeId={creator.id}
          revieweeName={creator.name}
        />
      )}
      
      {/* Payment Modal */}
      <PaymentModal
        order={order}
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          setPaymentModalOpen(false);
          // Order list will refresh automatically via React Query
        }}
      />
    </div>
  );

  // Handle submitting order for customer approval
  async function handleSubmitForApproval() {
    try {
      setCompleting(true);
      const response = await fetch(`/api/orders/${order.id}/submit-for-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          providerId: 'demo-provider-id',
          deliveryNote: 'Service completed as requested'
        }),
      });
      
      if (response.ok) {
        alert('Order submitted for customer approval!');
        // Order list will refresh automatically via React Query
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit order');
      }
    } catch (error) {
      alert('Failed to submit order');
    } finally {
      setCompleting(false);
    }
  }

  // Handle customer approving order
  async function handleApproveOrder() {
    try {
      const response = await fetch(`/api/orders/${order.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: 'demo-customer-id',
          customerRating: 5,
          customerFeedback: 'Excellent service!'
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.data.realTimePayoutProcessed) {
          alert(`Order approved! Provider earned $${result.data.commission.providerEarnings.toFixed(2)} commission (paid instantly)`);
        } else {
          alert('Order approved successfully!');
        }
        // Order list will refresh automatically via React Query
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to approve order');
      }
    } catch (error) {
      alert('Failed to approve order');
    }
  }

  // Handle dispute submission
  async function handleDispute() {
    const reason = prompt('Please describe the issue with this order:');
    if (!reason || reason.trim().length < 20) {
      alert('Please provide a detailed description (at least 20 characters)');
      return;
    }

    try {
      const response = await fetch(`/api/orders/${order.id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: order.id,
          disputeType: 'quality_issue',
          title: 'Service Quality Issue',
          description: reason
        }),
      });
      
      if (response.ok) {
        alert('Dispute submitted successfully. Our team will review it shortly.');
        // Order list will refresh automatically via React Query
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit dispute');
      }
    } catch (error) {
      alert('Failed to submit dispute');
    }
  }
}
