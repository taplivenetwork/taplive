import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SmartContractService } from '@/lib/smart-contracts';
import { Web3Service } from '@/lib/web3';
import { DecentralizedStreamingService } from '@/lib/decentralized-streaming';
import { DecentralizedStorage } from './decentralized-storage';
import { FairPaymentDemo } from './fair-payment-demo';
import { 
  Wallet, 
  Shield, 
  Trophy, 
  MapPin, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Web3IntegrationProps {
  orderId?: string;
  userAddress?: string;
  onOrderUpdate?: (orderId: string, status: string) => void;
}

export function Web3Integration({ orderId, userAddress, onOrderUpdate }: Web3IntegrationProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Initialize Web3 connection
  useEffect(() => {
    initializeWeb3();
  }, []);

  const initializeWeb3 = async () => {
    try {
      const connected = await SmartContractService.initialize();
      if (connected) {
        setIsConnected(true);
        const address = await SmartContractService.getCurrentAddress();
        setCurrentAddress(address);
        
        // Load user data
        await loadUserData(address);
      }
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
    }
  };

  const loadUserData = async (address: string) => {
    try {
      // Load user NFTs
      const nfts = await SmartContractService.getUserNFTs(address);
      setUserNFTs(nfts);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };


  const connectWallet = async () => {
    try {
      setLoading(true);
      const address = await Web3Service.connectWallet();
      setCurrentAddress(address);
      setIsConnected(true);
      await loadUserData(address);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderAction = async (action: string) => {
    if (!orderId) return;

    try {
      setLoading(true);
      let tx;

      switch (action) {
        case 'accept':
          tx = await SmartContractService.acceptOrder(orderId);
          break;
        case 'complete':
          tx = await SmartContractService.completeStreaming(orderId);
          break;
        case 'confirm':
          tx = await SmartContractService.confirmCompletion(orderId);
          break;
        case 'dispute':
          tx = await SmartContractService.createDispute(orderId, 'Quality issue');
          break;
      }

      toast({
        title: "Transaction Successful",
        description: `Transaction hash: ${tx.hash}`,
      });

      if (onOrderUpdate) {
        onOrderUpdate(orderId, action);
      }
    } catch (error: any) {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const mintAchievementNFT = async () => {
    try {
      setLoading(true);
      const tx = await SmartContractService.mintProviderBadge(
        currentAddress,
        "First Stream Achievement",
        "Successfully completed your first live stream",
        "https://example.com/achievement.png",
        0 // ProviderBadge type
      );

      toast({
        title: "Achievement Minted",
        description: "You've earned a new NFT badge!",
      });
    } catch (error: any) {
      toast({
        title: "Minting Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Web3 Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Connect your wallet to access Web3 features like escrow payments, 
            NFT achievements, and DAO governance.
          </p>
          <Button 
            onClick={connectWallet} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Web3 Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Web3 Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Wallet Address</p>
              <p className="font-mono text-sm">{currentAddress}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="escrow" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="escrow">Escrow</TabsTrigger>
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="ai-demo">AI Demo</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Escrow Tab */}
        <TabsContent value="escrow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Smart Contract Escrow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderId && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Order ID: {orderId}</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleOrderAction('accept')}
                      disabled={loading}
                      size="sm"
                    >
                      Accept Order
                    </Button>
                    <Button 
                      onClick={() => handleOrderAction('complete')}
                      disabled={loading}
                      size="sm"
                      variant="outline"
                    >
                      Complete Stream
                    </Button>
                    <Button 
                      onClick={() => handleOrderAction('confirm')}
                      disabled={loading}
                      size="sm"
                      variant="outline"
                    >
                      Confirm Completion
                    </Button>
                    <Button 
                      onClick={() => handleOrderAction('dispute')}
                      disabled={loading}
                      size="sm"
                      variant="destructive"
                    >
                      Create Dispute
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NFTs Tab */}
        <TabsContent value="nfts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Your NFTs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userNFTs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userNFTs.map((nft, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <Badge variant="secondary">Token #{nft}</Badge>
                        <p className="text-sm text-muted-foreground">
                          View on OpenSea or your wallet
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No NFTs yet. Complete streams to earn achievements!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-4">
          <DecentralizedStorage 
            streamId={orderId}
            onUploadComplete={(fileInfo) => {
              toast({
                title: "File Uploaded to IPFS",
                description: `File stored with hash: ${fileInfo.hash.slice(0, 10)}...`,
              });
            }}
          />
        </TabsContent>

        {/* AI Demo Tab */}
        <TabsContent value="ai-demo" className="space-y-4">
          <FairPaymentDemo />
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold">First Stream</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complete your first live stream
                    </p>
                    <Button 
                      size="sm" 
                      onClick={mintAchievementNFT}
                      disabled={loading}
                    >
                      Mint Achievement
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold">Location Explorer</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Stream from 10 different locations
                    </p>
                    <Button size="sm" variant="outline" disabled>
                      In Progress (3/10)
                    </Button>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
