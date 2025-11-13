"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import { formatBalance } from "@polkadot/util";

interface WalletConnectionProps {
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({
  onWalletConnected,
  onWalletDisconnected,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0.00");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [api, setApi] = useState<ApiPromise | null>(null);
  const { toast } = useToast();

  const fetchBalance = async (address: string, apiInstance: ApiPromise) => {
    try {
      setIsLoadingBalance(true);

      const accountInfo = await apiInstance.query.system.account(address);
      const accountData = (accountInfo as any).data;

      // Format balance (Polkadot uses 10 decimals)
      const formattedBalance = formatBalance(accountData.free, {
        decimals: 10,
        withUnit: "DOT",
        forceUnit: "-",
      });

      setBalance(formattedBalance);
      console.log("Balance:", formattedBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("Error");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    try {
      const extensions = await web3Enable("TapLive");
      if (extensions.length === 0) {
        toast({
          title: "Extension Not Found",
          description: "Please install Polkadot.js extension",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }

      const wsProvider = new WsProvider("wss://rpc.polkadot.io");
      const apiInstance = await ApiPromise.create({ provider: wsProvider });
      await apiInstance.isReady;

      const allAccounts = await web3Accounts();

      if (allAccounts.length === 0) {
        toast({
          title: "No Accounts",
          description: "Please create an account in your wallet.",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }

      const account = allAccounts[0];
      setApi(apiInstance);
      setWalletAddress(account.address);
      setIsConnected(true);

      // Fetch balance after setting address
      await fetchBalance(account.address, apiInstance);

      onWalletConnected?.(account.address);

      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Polkadot wallet",
      });

      console.log("Connected:", account.address);
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast({
        title: "Connection Failed",
        description:
          error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWalletDisconnect = async () => {
    try {
      if (api) {
        await api.disconnect();
        setApi(null);
      }

      setWalletAddress(null);
      setBalance("0.00");
      setIsConnected(false);

      onWalletDisconnected?.();

      toast({
        title: "Wallet Disconnected",
        description: "Wallet has been disconnected",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  const handleRefreshBalance = async () => {
    if (walletAddress && api) {
      await fetchBalance(walletAddress, api);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (api) {
        api.disconnect();
      }
    };
  }, [api]);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const formatAddress = (address: string | null) => {
    if (!address) return "";
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
            Connect your wallet to access Web3 features and make payments with
            DOT
          </p>
          <Button
            onClick={handleWalletConnect}
            disabled={isConnecting}
            className="w-full"
            type="button"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Don't have a wallet?{" "}
            <a
              href="https://polkadot.js.org/extension/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Install Polkadot.js
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
            <Button
              size="sm"
              variant="outline"
              onClick={handleWalletDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">DOT Balance</p>
            {isLoadingBalance ? (
              <p className="text-lg font-bold">Loading...</p>
            ) : (
              <p className="text-lg font-bold text-green-600">{balance}</p>
            )}
            <button
              onClick={handleRefreshBalance}
              className="text-xs text-blue-600 hover:underline mt-1"
              disabled={isLoadingBalance}
            >
              Refresh Balance
            </button>
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
