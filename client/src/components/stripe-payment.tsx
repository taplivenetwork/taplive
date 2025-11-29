import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutFormProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ orderId, amount, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !isReady) {
      setErrorMessage('Payment form is still loading. Please wait...');
      return;
    }

    if (!isComplete) {
      setErrorMessage('Please complete your payment information.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Submit the form to validate
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || 'Payment validation failed');
        onError(submitError.message || 'Payment validation failed');
        setIsProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      console.log('Payment confirmation result:', { error, paymentIntent });

      if (error) {
        console.error('Payment error:', error);
        setErrorMessage(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent) {
        console.log('PaymentIntent status:', paymentIntent.status);
        if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
          console.log('Payment authorized successfully!');
          
          // Update payment status on backend
          try {
            console.log('Updating payment status on backend...');
            const updateResponse = await fetch(`/api/payments/${paymentIntent.id}/confirm`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: paymentIntent.status,
                orderId: orderId
              }),
            });
            
            if (updateResponse.ok) {
              console.log('✅ Payment status updated in database');
            } else {
              console.warn('⚠️ Failed to update payment status:', await updateResponse.text());
            }
          } catch (updateError) {
            console.error('Failed to update payment status:', updateError);
            // Don't fail the payment flow if backend update fails
          }
          
          // Call onSuccess regardless of backend update status
          console.log('Calling onSuccess...');
          onSuccess();
        } else if (paymentIntent.status === 'requires_action') {
          // Handle 3D Secure or other additional actions
          console.log('Payment requires action:', paymentIntent.next_action);
          setErrorMessage('Additional authentication required. Please check your payment method.');
          onError('Additional authentication required');
        } else if (paymentIntent.status === 'processing') {
          // Payment is being processed
          console.log('Payment is processing');
          setErrorMessage('Payment is being processed. Please wait...');
          onError('Payment is being processed');
        } else if (paymentIntent.status === 'requires_payment_method') {
          console.log('PaymentIntent still requires payment method');
          setErrorMessage('Please complete your payment information and try again.');
          onError('Payment method not collected');
        } else {
          console.log('Unknown payment status:', paymentIntent.status);
          setErrorMessage(`Payment status: ${paymentIntent.status}`);
          onError(`Payment status: ${paymentIntent.status}`);
        }
      } else {
        console.log('No paymentIntent returned');
        setErrorMessage('Payment processing incomplete');
        onError('Payment processing incomplete');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        onReady={() => setIsReady(true)}
        onChange={(event) => {
          console.log('PaymentElement change:', event);
          setIsComplete(event.complete);
        }}
        options={{
          layout: 'tabs'
        }}
      />
      
      {errorMessage && (
        <div className="p-3 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing || !isReady || !isComplete}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : !isReady ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : !isComplete ? (
          'Complete Payment Details'
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}

interface StripePaymentProps {
  orderId: string;
  amount: number;
  userId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripePayment({
  orderId,
  amount,
  userId,
  onSuccess,
  onError
}: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    stripePromise.then(() => setStripeReady(true));
  }, []);

  const createPayment = async () => {
    setIsCreatingPayment(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payerId: userId,
          amount: amount,
          currency: 'USD',
          paymentMethod: 'stripe',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment');
      }

      const payment = await response.json();
      setClientSecret(payment.data.clientSecret);
      return payment.data.clientSecret;
    } catch (error) {
      console.error('Error creating payment:', error);
      onError(error instanceof Error ? error.message : 'Failed to create payment');
      return null;
    } finally {
      setIsCreatingPayment(false);
    }
  };

  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Payment Configuration Error</CardTitle>
          <CardDescription>
            Stripe is not configured. Please contact support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!stripeReady) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ready to Pay</CardTitle>
          <CardDescription>
            Click below to securely process your payment of ${amount.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={createPayment}
            disabled={isCreatingPayment}
            className="w-full"
          >
            {isCreatingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up payment...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0070f3',
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>
          Securely pay ${amount.toFixed(2)} using Stripe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm
            orderId={orderId}
            amount={amount}
            onSuccess={onSuccess}
            onError={onError}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}
