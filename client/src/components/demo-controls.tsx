import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TranslatedText } from "@/components/translated-text";
import { DollarSign, PlayCircle, CheckCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DemoControls() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const simulateOrderFlow = async () => {
    try {
      setLoading(true);
      
      // Step 1: Create an order
      toast({
        title: "Step 1: Creating Order",
        description: "Creating a new streaming order...",
      });

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Demo: Live Concert Stream",
          description: "Real-time demo of payment and commission system",
          type: "single",
          latitude: "40.7589",
          longitude: "-73.9851",
          address: "Central Park, NYC",
          price: "25.00",
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          duration: 60,
          category: "music",
          tags: ["demo", "test", "concert"],
          creatorId: "demo-user-id",
        }),
      });

      if (!orderResponse.ok) throw new Error('Failed to create order');
      const order = await orderResponse.json();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Accept order (assign provider)
      toast({
        title: "Step 2: Accepting Order",
        description: "Provider accepting the order...",
      });

      await fetch(`/api/orders/${order.data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'accepted',
          providerId: '890ed15c-d22b-4fde-a6f0-3b5096411d80', // Sample provider ID
        }),
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Process payment
      toast({
        title: "Step 3: Processing Payment",
        description: "Customer paying for the order...",
      });

      const paymentResponse = await fetch(`/api/orders/${order.data.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 25.00,
          currency: 'USD',
          paymentMethod: 'stripe',
          payerId: 'demo-customer-id',
        }),
      });

      if (!paymentResponse.ok) throw new Error('Failed to create payment');
      const payment = await paymentResponse.json();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Complete payment
      toast({
        title: "Step 4: Completing Payment",
        description: "Payment processing completed...",
      });

      await fetch(`/api/payments/${payment.data.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalPaymentId: `demo_${Date.now()}`,
          gateway: 'stripe',
        }),
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 5: Submit for customer approval
      toast({
        title: "Step 5: Submitting for Approval",
        description: "Provider submitting completed service for customer approval...",
      });

      await fetch(`/api/orders/${order.data.id}/submit-for-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: '890ed15c-d22b-4fde-a6f0-3b5096411d80',
          deliveryNote: 'Demo service completed successfully'
        }),
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 6: Customer approves and triggers real-time payout
      toast({
        title: "Step 6: Customer Approval",
        description: "Customer approving service, triggering real-time commission payout...",
      });

      const approveResponse = await fetch(`/api/orders/${order.data.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 'demo-customer-id',
          customerRating: 5,
          customerFeedback: 'Excellent demo service!'
        }),
      });

      if (!approveResponse.ok) throw new Error('Failed to approve order');
      const result = await approveResponse.json();

      // Show success message
      toast({
        title: "✅ Demo Complete!",
        description: result.data.realTimePayoutProcessed 
          ? `Provider earned $${result.data.commission.providerEarnings.toFixed(2)} commission (paid instantly)`
          : "Order completed successfully",
        duration: 5000,
      });

      // Refresh the page to show updated data
      setTimeout(() => window.location.reload(), 2000);

    } catch (error: any) {
      toast({
        title: "Demo Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-primary" />
          <TranslatedText>Real-Time Commission Demo</TranslatedText>
          <Badge variant="secondary">MVP Feature</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <TranslatedText>Test the complete flow: Order → Payment → Service Completion → Customer Approval → Instant Commission Payout (80% to provider)</TranslatedText>
          </p>
          
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded">
              <CreditCard className="w-3 h-3" />
              <span><TranslatedText>Payment Processing</TranslatedText></span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded">
              <DollarSign className="w-3 h-3" />
              <span><TranslatedText>80% Provider Share</TranslatedText></span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded">
              <CheckCircle className="w-3 h-3" />
              <span><TranslatedText>Customer Approval</TranslatedText></span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded">
              <CheckCircle className="w-3 h-3" />
              <span><TranslatedText>Real-Time Payout</TranslatedText></span>
            </div>
          </div>

          <Button 
            onClick={simulateOrderFlow}
            disabled={loading}
            className="w-full"
            data-testid="button-demo-flow"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <TranslatedText>Running Demo...</TranslatedText>
              </div>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                <TranslatedText>Run Complete Demo Flow</TranslatedText>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}