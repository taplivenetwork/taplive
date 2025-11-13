import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
<<<<<<< HEAD
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutForm } from '@/components/payment/checkout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";

// Load Stripe outside of component render to avoid recreating the object
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
=======
import { PaymentModal } from '@/components/payment-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Wallet } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryclient";
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/payment/:orderId");
  const [paymentComplete, setPaymentComplete] = useState(false);
<<<<<<< HEAD
=======
  const [showPaymentModal, setShowPaymentModal] = useState(false);
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
  
  const orderId = params?.orderId;

  // Fetch order details
  const { data: order, isLoading: orderLoading, error: orderError } = useQuery({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId
  });

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Invalid payment link</p>
            <Button onClick={() => setLocation('/')} className="mt-4">
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
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
            <p>Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderError || !order?.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Order not found</p>
            <Button onClick={() => setLocation('/')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orderData = order.data;

  if (orderData.isPaid || paymentComplete) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto tech-card">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">Payment Complete!</CardTitle>
            <CardDescription>
              Your payment for "{orderData.title}" has been processed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-800">
                <p><strong>Order:</strong> {orderData.title}</p>
                <p><strong>Amount:</strong> {orderData.currency} {parseFloat(orderData.price).toFixed(2)}</p>
                <p><strong>Status:</strong> Paid</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setLocation('/')} variant="outline" className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button onClick={() => setLocation(`/orders/${orderId}`)} className="flex-1">
                View Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

<<<<<<< HEAD
  const stripeOptions = {
    mode: 'payment' as const,
    currency: orderData.currency.toLowerCase(),
    amount: Math.round(parseFloat(orderData.price) * 100),
  };

=======
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
  return (
    <div className="min-h-screen bg-background circuit-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <Button 
              onClick={() => setLocation(`/orders/${orderId}`)} 
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Order
            </Button>
            
            <Card className="glass-card mb-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span className="font-medium">{orderData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{orderData.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span>{orderData.address}</span>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total:</span>
                    <span className="neon-text">{orderData.currency} {parseFloat(orderData.price).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

<<<<<<< HEAD
          <Elements stripe={stripePromise} options={stripeOptions}>
            <CheckoutForm
              orderId={orderId}
              orderTitle={orderData.title}
              amount={parseFloat(orderData.price)}
              currency={orderData.currency}
              onSuccess={() => {
                setPaymentComplete(true);
                setLocation(`/payment/${orderId}/success`);
              }}
              onError={(error) => {
                console.error('Payment error:', error);
              }}
            />
          </Elements>
        </div>
      </div>
=======
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Web3 Payment
              </CardTitle>
              <CardDescription>
                Pay with PYUSD or swap any token using Yellow Network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowPaymentModal(true)}
                className="w-full"
                size="lg"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Pay with Web3
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentModal
        order={orderData}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setPaymentComplete(true);
          setLocation(`/payment/${orderId}/success`);
        }}
      />
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
    </div>
  );
}