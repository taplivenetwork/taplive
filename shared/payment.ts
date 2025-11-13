// Payment processing utilities and interfaces

export interface PaymentProvider {
  name: string;
  processPayment(params: PaymentParams): Promise<PaymentResult>;
  verifyPayment(paymentId: string): Promise<PaymentVerification>;
}

export interface PaymentParams {
  amount: number;
  currency: string;
  orderId: string;
  payerId: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionHash?: string;
  errorMessage?: string;
  gatewayResponse?: any;
}

export interface PaymentVerification {
  verified: boolean;
  status: 'pending' | 'completed' | 'failed';
  amount?: number;
  currency?: string;
}

export interface PayoutParams {
  amount: number;
  currency: string;
  recipientWallet: string;
  orderId: string;
  paymentId: string;
  metadata?: Record<string, any>;
}

export interface PayoutResult {
  success: boolean;
  payoutId?: string;
  transactionHash?: string;
  errorMessage?: string;
  gatewayResponse?: any;
}

// Platform commission calculation
export function calculateCommission(totalAmount: number, platformFeePercentage: number = 20) {
  const platformFee = (totalAmount * platformFeePercentage) / 100;
  const providerEarnings = totalAmount - platformFee;
  
  return {
    totalAmount,
    platformFee,
    providerEarnings,
    platformFeePercentage
  };
}

// Payment method configurations
export const PAYMENT_METHODS = {
  STRIPE: {
    name: 'Stripe',
    type: 'fiat',
    currencies: ['USD'],
    icon: '💳',
    description: 'Credit/Debit Card'
  },
  PAYPAL: {
    name: 'PayPal',
    type: 'fiat',
    currencies: ['USD'],
    icon: '🏦',
    description: 'PayPal Account'
// Payment method configurations (Web3 only)
export const PAYMENT_METHODS = {
  PYUSD: {
    name: 'PYUSD',
    type: 'web3',
    currencies: ['PYUSD'],
    icon: '₮',
    description: 'PayPal USD (Ethereum)',
    requiresWallet: true
  },
  USDT_TRC20: {
    name: 'USDT (TRC20)',
    type: 'crypto',
    currencies: ['USDT'],
    icon: '₮',
    description: 'Tether (TRON Network)'
    description: 'Tether (TRON Network)',
    requiresWallet: true
  },
  USDT_ERC20: {
    name: 'USDT (ERC20)',
    type: 'crypto',
    currencies: ['USDT'],
    icon: '₮',
    description: 'Tether (Ethereum Network)'
    description: 'Tether (Ethereum Network)',
    requiresWallet: true
  },
  BITCOIN: {
    name: 'Bitcoin',
    type: 'crypto',
    currencies: ['BTC'],
    icon: '₿',
    description: 'Bitcoin Network'
    description: 'Bitcoin Network',
    requiresWallet: true
  },
  ETHEREUM: {
    name: 'Ethereum',
    type: 'crypto',
    currencies: ['ETH'],
    icon: 'Ξ',
    description: 'Ethereum Network'
    description: 'Ethereum Network',
    requiresWallet: true
  },
  YELLOW_SWAP: {
    name: 'Yellow Network Swap',
    type: 'swap',
    currencies: ['PYUSD', 'USDT', 'USDC', 'DAI'],
    icon: '🔄',
    description: 'Swap any token to PYUSD via Yellow Network',
    requiresWallet: true
  }
} as const;

// Payment status helpers
export function getPaymentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending Payment',
    processing: 'Processing Payment',
    completed: 'Payment Completed',
    failed: 'Payment Failed',
    refunded: 'Payment Refunded'
  };
  return statusMap[status] || status;
}

export function getPaymentStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'text-yellow-600',
    processing: 'text-blue-600',
    completed: 'text-green-600',
    failed: 'text-red-600',
    refunded: 'text-gray-600'
  };
  return colorMap[status] || 'text-gray-600';
}