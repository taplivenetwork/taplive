import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';

interface WalletConnectionProps {
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({
  onWalletConnected,
  onWalletDisconnected,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0.00');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Check if already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setBalance('1,250.50'); // Mock balance
            setIsConnected(true);
            onWalletConnected?.(accounts[0]);
          }
        } catch (error) {
          console.log('No existing connection');
        }
      }
    };

    checkConnection();
  }, [onWalletConnected]);

  // Real MetaMask connection using ethers.js
  const connectWallet = async () => {
    console.log('Connect wallet clicked');
    setIsConnecting(true);
    
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        console.log('MetaMask not found');
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to continue",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }

      console.log('MetaMask found, connecting...');

      // Create provider and request connection
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // This will trigger MetaMask popup
      const accounts = await provider.send("eth_requestAccounts", []);
      
      console.log('Accounts received:', accounts);

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      console.log('Setting wallet address:', address);
      setWalletAddress(address);
      
      // Get balance (mock for demo)
      const balance = await getPYUSDBalance(address);
      setBalance(balance);
      
      setIsConnected(true);
      setIsConnecting(false);
      
      onWalletConnected?.(address);
      
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to MetaMask",
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setIsConnecting(false);
      
      // Handle user rejection
      if (error instanceof Error && (
        error.message.includes('User rejected') || 
        error.message.includes('user rejected') ||
        error.message.includes('User denied')
      )) {
        toast({
          title: "Connection Cancelled",
          description: "Wallet connection was cancelled",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "Failed to connect wallet",
          variant: "destructive",
        });
      }
    }
  };

  // Get PYUSD balance (mock for demo)
  const getPYUSDBalance = async (address: string): Promise<string> => {
    // For demo purposes, return a mock balance
    // In production, you would call the PYUSD contract
    return '1,250.50';
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    setBalance('0.00');
    onWalletDisconnected?.();
    
    toast({
      title: "Wallet Disconnected",
      description: "Wallet has been disconnected",
    });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your wallet to access Web3 features and make payments with PYUSD
          </p>
          <Button 
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full"
            type="button"
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Don't have MetaMask?{' '}
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Install MetaMask
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Connected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Address</p>
            <p className="text-sm text-muted-foreground font-mono">
              {formatAddress(walletAddress)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copyAddress}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={disconnectWallet}>
              Disconnect
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">PYUSD Balance</p>
            <p className="text-lg font-bold text-green-600">
              ${balance}
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Connected
          </Badge>
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Ready for Web3 payments and smart contract interactions
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletConnection;
