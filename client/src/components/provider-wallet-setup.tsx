import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { Web3Service } from '@/lib/web3';
import { useToast } from '@/hooks/use-toast';

interface ProviderWalletSetupProps {
  onWalletConnected: (address: string) => void;
  currentWallet?: string;
}

export function ProviderWalletSetup({ onWalletConnected, currentWallet }: ProviderWalletSetupProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState(currentWallet || '');
  const [isConnected, setIsConnected] = useState(false);
  const [pyusdBalance, setPyusdBalance] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const connected = await Web3Service.isWalletConnected();
      if (connected) {
        const address = await Web3Service.getCurrentAccount();
        if (address) {
          setWalletAddress(address);
          setIsConnected(true);
          await loadBalance(address);
        }
      }
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
    }
  };

  const loadBalance = async (address: string) => {
    try {
      const balance = await Web3Service.getPYUSDBalance(address);
      setPyusdBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const address = await Web3Service.connectWallet();
      setWalletAddress(address);
      setIsConnected(true);
      await loadBalance(address);
      
      onWalletConnected(address);
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
      toast({
        title: "Connection Failed",
        description: error.message || 'Failed to connect wallet',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    Web3Service.disconnectWallet();
    setWalletAddress('');
    setIsConnected(false);
    setPyusdBalance('0');
    setError(null);
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const openEtherscan = () => {
    window.open(`https://etherscan.io/address/${walletAddress}`, '_blank');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Provider Wallet Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your MetaMask wallet to receive PYUSD payments from customers.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
            </Button>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Connected
              </Badge>
              <Button variant="outline" size="sm" onClick={disconnectWallet}>
                Disconnect
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={walletAddress} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="sm" onClick={copyAddress}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={openEtherscan}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>PYUSD Balance</Label>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-mono text-lg">{pyusdBalance}</span>
                <Badge variant="secondary">PYUSD</Badge>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You're ready to receive PYUSD payments! Customers can now pay you directly to this wallet address.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
