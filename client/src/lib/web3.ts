import { ethers } from 'ethers';

// PYUSD Contract ABI (simplified for ERC20)
const PYUSD_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

// Contract addresses (you'll need to replace with actual addresses)
const PYUSD_CONTRACT_ADDRESS = import.meta.env.VITE_PYUSD_CONTRACT_ADDRESS || '0x6c3ea903640685200629e0c4c4c4c4c4c4c4c4c4';
const RPC_URL = import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-key';

export class Web3Service {
  private static provider: ethers.Provider | null = null;
  private static signer: ethers.Signer | null = null;

  // Initialize provider
  static async initializeProvider() {
    if (typeof window.ethereum !== 'undefined') {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      return true;
    }
    return false;
  }

  // Connect wallet (MetaMask)
  static async connectWallet(): Promise<string> {
    try {
      if (!this.provider) {
        const initialized = await this.initializeProvider();
        if (!initialized) {
          throw new Error('MetaMask not detected. Please install MetaMask.');
        }
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.signer = await this.provider.getSigner();
      return accounts[0];
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  // Get current account
  static async getCurrentAccount(): Promise<string | null> {
    try {
      if (!this.provider) {
        await this.initializeProvider();
      }
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Failed to get current account:', error);
      return null;
    }
  }

  // Get PYUSD balance
  static async getPYUSDBalance(address: string): Promise<string> {
    try {
      if (!this.provider) {
        await this.initializeProvider();
      }

      const contract = new ethers.Contract(
        PYUSD_CONTRACT_ADDRESS,
        PYUSD_ABI,
        this.provider
      );

      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      
      // Convert from wei to human readable format
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Failed to get PYUSD balance:', error);
      throw error;
    }
  }

  // Send PYUSD
  static async sendPYUSD(to: string, amount: string): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      const contract = new ethers.Contract(
        PYUSD_CONTRACT_ADDRESS,
        PYUSD_ABI,
        this.signer
      );

      // Get decimals to convert amount properly
      const decimals = await contract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      // Send transaction
      const tx = await contract.transfer(to, amountWei);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (error) {
      console.error('Failed to send PYUSD:', error);
      throw error;
    }
  }

  // Get transaction details
  static async getTransactionDetails(txHash: string) {
    try {
      if (!this.provider) {
        await this.initializeProvider();
      }

      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      return {
        hash: txHash,
        from: tx?.from,
        to: tx?.to,
        value: tx?.value?.toString(),
        gasUsed: receipt?.gasUsed?.toString(),
        gasPrice: tx?.gasPrice?.toString(),
        status: receipt?.status,
        blockNumber: receipt?.blockNumber
      };
    } catch (error) {
      console.error('Failed to get transaction details:', error);
      throw error;
    }
  }

  // Check if wallet is connected
  static async isWalletConnected(): Promise<boolean> {
    const account = await this.getCurrentAccount();
    return account !== null;
  }

  // Disconnect wallet
  static disconnectWallet() {
    this.signer = null;
    this.provider = null;
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}
