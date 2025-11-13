import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
<<<<<<< HEAD
import { CreditCard, Smartphone, Bitcoin, DollarSign, Loader2, CheckCircle, AlertCircle } from "lucide-react";
=======
import { CreditCard, Smartphone, Bitcoin, DollarSign, Loader2, CheckCircle, AlertCircle, Wallet } from "lucide-react";
import { Web3Service } from "@/lib/web3";
import { YellowNetworkService } from "@/lib/yellow-network";
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
import type { Order } from "@shared/schema";

interface PaymentModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
<<<<<<< HEAD
  type: 'fiat' | 'crypto';
  icon: string;
  description: string;
  currencies: string[];
=======
  type: 'fiat' | 'crypto' | 'web3' | 'swap';
  icon: string;
  description: string;
  currencies: string[];
  requiresWallet?: boolean;
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
}

export function PaymentModal({ order, isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentStep, setPaymentStep] = useState<'select' | 'details' | 'processing' | 'success'>('select');
  const [cryptoHash, setCryptoHash] = useState('');
  const [senderWallet, setSenderWallet] = useState('');
<<<<<<< HEAD
=======
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [pyusdBalance, setPyusdBalance] = useState('0');
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available payment methods
  const { data: paymentMethods } = useQuery({
    queryKey: ['/api/payment/methods'],
    queryFn: () => fetch('/api/payment/methods').then(res => res.json()),
  });

  // Fetch commission preview
  const { data: commissionData } = useQuery({
    queryKey: [`/api/payment/commission/${order.price}`],
    queryFn: () => fetch(`/api/payment/commission/${order.price}`).then(res => res.json()),
    enabled: !!order.price,
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch(`/api/orders/${order.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) throw new Error('Failed to create payment');
      return response.json();
    },
    onSuccess: (data) => {
      const selectedMethodData = methods?.find(m => m.id === selectedMethod);
      if (selectedMethodData?.type === 'crypto') {
        setPaymentStep('details');
      } else {
        // For fiat payments, simulate immediate completion
        setTimeout(() => completeFiatPayment(data.data.id), 1000);
        setPaymentStep('processing');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment",
        variant: "destructive",
      });
    },
  });

  // Process crypto payment mutation
  const processCryptoMutation = useMutation({
    mutationFn: async ({ paymentId, cryptoData }: any) => {
      const response = await fetch(`/api/payments/${paymentId}/crypto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cryptoData),
      });
      if (!response.ok) throw new Error('Failed to process crypto payment');
      return response.json();
    },
    onSuccess: () => {
      setPaymentStep('processing');
      // Check payment status after a delay
      setTimeout(() => checkPaymentStatus(), 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Crypto Payment Error",
        description: error.message || "Failed to process crypto payment",
        variant: "destructive",
      });
    },
  });

  // Complete fiat payment
  const completeFiatPayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalPaymentId: `demo_${Date.now()}`,
          gateway: selectedMethod,
        }),
      });
      
      if (response.ok) {
        setPaymentStep('success');
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        onSuccess?.();
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Payment could not be completed",
        variant: "destructive",
      });
      setPaymentStep('select');
    }
  };

  // Check payment status
  const checkPaymentStatus = async () => {
    // This would check the actual payment status in a real app
    setPaymentStep('success');
    queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    onSuccess?.();
  };

<<<<<<< HEAD
=======
  // Web3 payment methods
  const web3Methods: PaymentMethod[] = [
    {
      id: 'pyusd',
      name: 'PYUSD',
      type: 'web3',
      icon: '₮',
      description: 'PayPal USD (Ethereum)',
      currencies: ['PYUSD'],
      requiresWallet: true
    },
    {
      id: 'yellow_swap',
      name: 'Yellow Network Swap',
      type: 'swap',
      icon: '🔄',
      description: 'Swap any token to PYUSD',
      currencies: ['PYUSD', 'USDT', 'USDC', 'DAI'],
      requiresWallet: true
    }
  ];

>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
  const methods: PaymentMethod[] = paymentMethods?.data ? Object.entries(paymentMethods.data).map(([key, value]: [string, any]) => ({
    id: key.toLowerCase(),
    name: value.name,
    type: value.type,
    icon: value.icon,
    description: value.description,
    currencies: value.currencies,
<<<<<<< HEAD
  })) : [];
=======
    requiresWallet: value.requiresWallet || false,
  })) : web3Methods;
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417

  const commission = commissionData?.data;
  const selectedMethodData = methods.find(m => m.id === selectedMethod);

<<<<<<< HEAD
  const handleCreatePayment = () => {
    if (!selectedMethod) return;

    const paymentData = {
      orderId: order.id,
      amount: parseFloat(order.price.toString()),
      currency: order.currency,
      paymentMethod: selectedMethod,
      payerId: 'demo-user-id', // This would come from auth
    };

    createPaymentMutation.mutate(paymentData);
=======
  // Web3 payment handlers
  const handleWeb3Payment = async () => {
    if (!selectedMethod) return;

    try {
      // Check if wallet is connected
      if (!isWalletConnected) {
        const address = await Web3Service.connectWallet();
        setWalletAddress(address);
        setIsWalletConnected(true);
        await loadPyusdBalance(address);
      }

      if (selectedMethod === 'pyusd') {
        await handlePYUSDPayment();
      } else if (selectedMethod === 'yellow_swap') {
        await handleYellowSwapPayment();
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process Web3 payment",
        variant: "destructive",
      });
    }
  };

  const handlePYUSDPayment = async () => {
    try {
      setPaymentStep('processing');
      
      // Send PYUSD to provider
      const txHash = await Web3Service.sendPYUSD(
        order.providerId || '', // Provider wallet address
        order.price.toString()
      );

      // Create payment record
      const paymentData = {
        orderId: order.id,
        amount: parseFloat(order.price.toString()),
        currency: 'PYUSD',
        paymentMethod: 'pyusd',
        payerId: walletAddress,
        web3TransactionHash: txHash,
        pyusdAmount: order.price.toString(),
      };

      createPaymentMutation.mutate(paymentData);
    } catch (error: any) {
      throw error;
    }
  };

  const handleYellowSwapPayment = async () => {
    try {
      setPaymentStep('processing');
      
      // Get swap quote
      const quote = await YellowNetworkService.getSwapQuote(
        'USDT', // from token
        'PYUSD', // to token
        order.price.toString()
      );

      // Execute swap
      const swapResult = await YellowNetworkService.executeSwap(
        'USDT',
        'PYUSD',
        order.price.toString(),
        order.providerId || '' // Provider wallet address
      );

      // Create payment record
      const paymentData = {
        orderId: order.id,
        amount: parseFloat(order.price.toString()),
        currency: 'PYUSD',
        paymentMethod: 'yellow_swap',
        payerId: walletAddress,
        web3TransactionHash: swapResult.transactionHash,
        yellowSwapHash: swapResult.transactionHash,
        originalToken: 'USDT',
        originalAmount: quote.fromAmount,
        pyusdAmount: quote.toAmount,
      };

      createPaymentMutation.mutate(paymentData);
    } catch (error: any) {
      throw error;
    }
  };

  const loadPyusdBalance = async (address: string) => {
    try {
      const balance = await Web3Service.getPYUSDBalance(address);
      setPyusdBalance(balance);
    } catch (error) {
      console.error('Failed to load PYUSD balance:', error);
    }
  };

  const handleCreatePayment = () => {
    if (!selectedMethod) return;

    const selectedMethodData = methods.find(m => m.id === selectedMethod);
    
    if (selectedMethodData?.requiresWallet) {
      handleWeb3Payment();
    } else {
      // Traditional payment flow
      const paymentData = {
        orderId: order.id,
        amount: parseFloat(order.price.toString()),
        currency: order.currency,
        paymentMethod: selectedMethod,
        payerId: 'demo-user-id', // This would come from auth
      };

      createPaymentMutation.mutate(paymentData);
    }
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
  };

  const handleCryptoPayment = () => {
    if (!cryptoHash || !senderWallet) {
      toast({
        title: "Missing Information",
        description: "Please provide transaction hash and sender wallet address",
        variant: "destructive",
      });
      return;
    }

    const cryptoData = {
      orderId: order.id,
      amount: parseFloat(order.price.toString()),
      currency: order.currency,
      paymentMethod: selectedMethod,
      senderWallet,
      transactionHash: cryptoHash,
    };

    processCryptoMutation.mutate({
      paymentId: 'demo-payment-id', // This would be stored from create payment response
      cryptoData,
    });
  };

  const resetModal = () => {
    setPaymentStep('select');
    setSelectedMethod('');
    setCryptoHash('');
    setSenderWallet('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method.type) {
      case 'fiat':
        return <CreditCard className="w-5 h-5" />;
      case 'crypto':
        return <Bitcoin className="w-5 h-5" />;
<<<<<<< HEAD
=======
      case 'web3':
        return <Wallet className="w-5 h-5" />;
      case 'swap':
        return <DollarSign className="w-5 h-5" />;
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="payment-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Complete Payment
          </DialogTitle>
        </DialogHeader>

        {/* Order Summary */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{order.title}</span>
              <Badge variant="outline">{order.type}</Badge>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Duration</span>
              <span>{order.duration} minutes</span>
            </div>
            {commission && (
              <div className="space-y-1 pt-2 border-t">
                <div className="flex justify-between">
                  <span>Service Fee</span>
                  <span>${order.price}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Platform Fee ({commission.platformFeePercentage}%)</span>
                  <span>${commission.platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Provider Earnings ({100 - commission.platformFeePercentage}%)</span>
                  <span>${commission.providerEarnings.toFixed(2)}</span>
                </div>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${order.price} {order.currency}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Steps */}
        {paymentStep === 'select' && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">
                Choose Payment Method
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select your preferred payment option
              </p>
            </div>

            <div className="grid gap-3">
              {methods.map((method) => (
                <Card
                  key={method.id}
                  className={`cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                  data-testid={`payment-method-${method.id}`}
                >
                  <CardContent className="flex items-center p-4">
                    <div className="flex items-center gap-3 flex-1">
                      {getMethodIcon(method)}
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-muted-foreground">{method.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={method.type === 'crypto' ? 'secondary' : 'outline'}>
                        {method.type === 'crypto' ? 'Crypto' : 'Fiat'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCreatePayment}
                disabled={!selectedMethod || createPaymentMutation.isPending}
                className="flex-1"
                data-testid="proceed-payment"
              >
                {createPaymentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Proceed to Payment
              </Button>
            </div>
          </div>
        )}

        {paymentStep === 'details' && selectedMethodData?.type === 'crypto' && (
          <div className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Please complete the transaction using your crypto wallet, then provide the details below.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="sender-wallet">
                  Sender Wallet Address
                </Label>
                <Input
                  id="sender-wallet"
                  value={senderWallet}
                  onChange={(e) => setSenderWallet(e.target.value)}
                  placeholder="Your wallet address..."
                  data-testid="input-sender-wallet"
                />
              </div>

              <div>
                <Label htmlFor="crypto-hash">
                  Transaction Hash
                </Label>
                <Input
                  id="crypto-hash"
                  value={cryptoHash}
                  onChange={(e) => setCryptoHash(e.target.value)}
                  placeholder="0x..."
                  data-testid="input-transaction-hash"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setPaymentStep('select')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleCryptoPayment}
                disabled={!cryptoHash || !senderWallet || processCryptoMutation.isPending}
                className="flex-1"
                data-testid="submit-crypto-payment"
              >
                {processCryptoMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Verify Transaction
              </Button>
            </div>
          </div>
        )}

        {paymentStep === 'processing' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">
              Processing Payment
            </h3>
            <p className="text-muted-foreground">
              Please wait while we verify your payment...
            </p>
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="font-semibold mb-2">
              Payment Successful!
            </h3>
            <p className="text-muted-foreground mb-6">
              Your payment has been processed and the provider will receive their payout automatically.
            </p>
            <Button onClick={handleClose} className="w-full" data-testid="payment-success-close">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}