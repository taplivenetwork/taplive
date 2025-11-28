import React, { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Loader2, 
  Video, 
  MapPin, 
  Clock, 
  Calendar,
  DollarSign,
  XCircle,
  CheckCircle2
} from "lucide-react";
import { useQuery, useMutation } from '@tanstack/react-query';
import { invalidateOrders, authFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/payment/:orderId");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();
  
  const orderId = params?.orderId;

  // Fetch order details
  const { data: order, isLoading: orderLoading, error: orderError } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    queryFn: () => authFetch(`/api/orders/${orderId}`).then(res => res.json()),
    enabled: !!orderId
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await authFetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel order');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order Cancelled",
        description: data.message || `Refund: $${data.refundAmount?.toFixed(2) || '0'}`,
      });
      invalidateOrders();
      setLocation('/orders');
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCancelOrder = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelOrder = () => {
    cancelOrderMutation.mutate();
    setShowCancelDialog(false);
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Payment Link</h2>
            <p className="text-gray-600 mb-6">The payment link you're trying to access is invalid.</p>
            <Button onClick={() => setLocation('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-700 font-medium">Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
            <Button onClick={() => setLocation('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract order data from the response
  const orderData = (order as any)?.data || order;

  // Debug: Log order data to console
  console.log('Order data:', orderData);
  console.log('Full response:', order);

  // Check if scheduled date has arrived
  const scheduledDate = orderData.scheduledAt ? new Date(orderData.scheduledAt) : null;
  const canEnterRoom = scheduledDate ? scheduledDate <= new Date() : true;

  // This page shows payment success (since payment is mocked in the order creation modal)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-2 border-green-200">
          <CardHeader className="text-center bg-green-50 border-b border-green-200">
            <div className="flex justify-center mb-3">
              <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">Payment Successful!</CardTitle>
            <CardDescription className="text-green-600">
              Your order has been confirmed and payment processed.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Order Details */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-600" />
                Order Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 text-sm">Title:</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[60%]">{orderData.title}</span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 text-sm flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Location:
                  </span>
                  <span className="text-gray-900 text-sm text-right max-w-[60%]">{orderData.address}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Duration:
                  </span>
                  <span className="text-gray-900 text-sm">{orderData.duration} minutes</span>
                </div>
                
                {scheduledDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Scheduled:
                    </span>
                    <span className="text-gray-900 text-sm">
                      {scheduledDate.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 border-t border-blue-300">
                  <span className="font-semibold text-gray-900 flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Total Paid:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {orderData.currency} {typeof orderData.price === 'string' ? parseFloat(orderData.price).toFixed(2) : orderData.price?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                ✓ Payment Confirmed
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {(orderData.status === 'pending' || orderData.status === 'accepted' || orderData.status === 'open') ? (
                <>
                  {canEnterRoom ? (
                    <Button 
                      onClick={() => setLocation(`/live-stream/${orderId}?mode=viewer&payment=paid`)} 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base"
                    >
                      <Video className="mr-2 h-5 w-5" />
                      Enter Stream Room
                    </Button>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                      <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm text-orange-800 font-medium">
                        Stream room will be available at scheduled time
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {scheduledDate?.toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  )}

                  {(orderData.status === 'pending' || orderData.status === 'open') && (
                    <Button 
                      onClick={handleCancelOrder}
                      variant="outline" 
                      className="w-full h-11 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                      disabled={cancelOrderMutation.isPending}
                    >
                      {cancelOrderMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Order (Free)
                        </>
                      )}
                    </Button>
                  )}

                  {orderData.status === 'accepted' && (
                    <Button 
                      onClick={handleCancelOrder}
                      variant="outline" 
                      className="w-full h-11 border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-medium"
                      disabled={cancelOrderMutation.isPending}
                    >
                      {cancelOrderMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Order (5-15% fee)
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">
                    Order Status: <span className="font-semibold text-gray-900">{orderData.status}</span>
                  </p>
                </div>
              )}

              <Button 
                onClick={() => setLocation('/orders')} 
                variant="outline" 
                className="w-full h-11"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              {orderData.status === 'pending' || orderData.status === 'open' ? (
                <span>You can cancel this order for free since no provider has accepted yet. You'll receive a full refund.</span>
              ) : (
                <span>Cancelling after provider acceptance will incur a 5-15% penalty fee. The remaining amount will be refunded.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-900">Keep Order</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancelOrder}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
