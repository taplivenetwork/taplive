import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CheckoutFormProps {
  orderId: string;
  orderTitle: string;
  amount: number;
  currency: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function CheckoutForm({ orderId, orderTitle, amount, currency, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'succeeded' | 'failed'>('pending');

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest('POST', `/api/orders/${orderId}/payment`, {
          payerId: 'current-user-id' // In real app, get from auth context
        });
        
        if (response.ok) {
          const data = await response.json();
          setClientSecret(data.data.clientSecret);
        } else {
          const errorData = await response.json();
          onError?.(errorData.message || 'Failed to initialize payment');
        }
      } catch (error) {
        console.error('Error creating payment intent:', error);
        onError?.('Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [orderId, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setPaymentStatus('processing');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?order=${orderId}`,
      },
      redirect: 'if_required'
    });

    setIsLoading(false);

    if (error) {
      setPaymentStatus('failed');
      const errorMessage = error.message || 'Payment failed';
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(errorMessage);
    } else {
      setPaymentStatus('succeeded');
      toast({
        title: "Payment Successful",
        description: "Your order payment has been processed successfully!",
      });
      onSuccess?.();
    }
  };

  if (!clientSecret) {
    return (
      <Card className="tech-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Initializing payment...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="tech-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Payment for Order</span>
        </CardTitle>
        <CardDescription>
          {orderTitle} • {currency} {amount.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement 
            options={{
              layout: "tabs"
            }}
          />
          
          {paymentStatus === 'succeeded' && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <Check className="h-4 w-4" />
              <span>Payment successful!</span>
            </div>
          )}
          
          {paymentStatus === 'failed' && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>Payment failed. Please try again.</span>
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={!stripe || isLoading || paymentStatus === 'succeeded'}
            className="w-full btn-gradient"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : paymentStatus === 'succeeded' ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Payment Complete
              </>
            ) : (
              `Pay ${currency} ${amount.toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}