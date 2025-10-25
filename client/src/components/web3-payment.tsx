import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Web3PaymentProps {
  amount: string;
  orderId: string;
  onPaymentComplete?: (txHash: string) => void;
  onPaymentFailed?: (error: string) => void;
}

export const Web3Payment: React.FC<Web3PaymentProps> = ({
  amount,
  orderId,
  onPaymentComplete,
  onPaymentFailed,
}) => {
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'processing' | 'success' | 'failed'>('confirm');
  const [txHash, setTxHash] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const mockPaymentProcess = async () => {
    setPaymentStep('processing');
    setProgress(0);

    // Simulate payment steps
    const steps = [
      { step: 'Approving PYUSD...', progress: 20 },
      { step: 'Creating escrow contract...', progress: 40 },
      { step: 'Transferring funds...', progress: 60 },
      { step: 'Confirming transaction...', progress: 80 },
      { step: 'Payment secured!', progress: 100 },
    ];

    for (const { step, progress: stepProgress } of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(stepProgress);
    }

    // Mock transaction hash
    const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
    setTxHash(mockTxHash);
    setPaymentStep('success');
    
    onPaymentComplete?.(mockTxHash);
    
    toast({
      title: "Payment Successful",
      description: `Payment of $${amount} secured in escrow`,
    });
  };

  const handlePayment = () => {
    mockPaymentProcess();
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'confirm':
        return <DollarSign className="h-5 w-5" />;
      case 'processing':
        return <Clock className="h-5 w-5 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getStepTitle = () => {
    switch (paymentStep) {
      case 'confirm':
        return 'Confirm Payment';
      case 'processing':
        return 'Processing Payment';
      case 'success':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Web3 Payment';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStepIcon(paymentStep)}
          {getStepTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentStep === 'confirm' && (
          <>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Amount:</span>
                <span className="font-semibold">${amount} PYUSD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Order ID:</span>
                <span className="font-mono text-xs">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Network:</span>
                <span className="text-sm">Ethereum Mainnet</span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Secure Escrow Payment</p>
                  <p className="text-blue-700">
                    Your payment will be held in a smart contract until the stream is completed.
                  </p>
                </div>
              </div>
            </div>
            
            <Button onClick={handlePayment} className="w-full">
              Pay with PYUSD
            </Button>
          </>
        )}

        {paymentStep === 'processing' && (
          <>
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Processing your payment...
              </p>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Please don't close this window while the transaction is processing.
                </p>
              </div>
            </div>
          </>
        )}

        {paymentStep === 'success' && (
          <>
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold text-green-700">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Your payment has been secured in the escrow smart contract.
                </p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-green-900">Transaction Details</p>
                <p className="text-xs text-green-700 font-mono break-all">
                  {txHash}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Amount:</span>
                  <span className="font-semibold">${amount} PYUSD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Secured in Escrow
                  </Badge>
                </div>
              </div>
            </div>
          </>
        )}

        {paymentStep === 'failed' && (
          <>
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <h3 className="font-semibold text-red-700">Payment Failed</h3>
              <p className="text-sm text-muted-foreground">
                There was an issue processing your payment.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Web3Payment;
