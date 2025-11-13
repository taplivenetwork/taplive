import { ethers } from 'ethers';

// Contract ABIs (simplified for demo)
const ESCROW_ABI = [
  "function createOrder(bytes32 orderId, address provider, uint256 amount, string calldata location, string calldata description) external",
  "function acceptOrder(bytes32 orderId) external",
  "function completeStreaming(bytes32 orderId) external",
  "function confirmCompletion(bytes32 orderId) external",
  "function createDispute(bytes32 orderId, string calldata reason) external",
  "function getOrder(bytes32 orderId) external view returns (tuple(bytes32 id, address creator, address provider, uint256 amount, uint256 platformFee, uint256 providerAmount, uint8 status, uint256 createdAt, uint256 completedAt, string location, string description, bool creatorConfirmed, bool providerConfirmed))",
  "event OrderCreated(bytes32 indexed orderId, address indexed creator, address indexed provider, uint256 amount, string location)",
  "event PaymentReleased(bytes32 indexed orderId, address indexed provider, uint256 amount)"
];

const NFT_ABI = [
  "function mintStreamCertificate(address to, string calldata title, string calldata description, string calldata imageURI, string calldata location, uint256 duration, uint256 qualityScore, string[] calldata tags) external returns (uint256)",
  "function mintProviderBadge(address to, string calldata title, string calldata description, string calldata imageURI, uint8 badgeType) external returns (uint256)",
  "function mintLocationNFT(address to, string calldata title, string calldata description, string calldata imageURI, string calldata location) external returns (uint256)",
  "function getNFTMetadata(uint256 tokenId) external view returns (tuple(uint8 nftType, string title, string description, string imageURI, string location, uint256 timestamp, uint256 duration, uint256 qualityScore, string[] tags, bool isRare))",
  "function getUserNFTs(address user) external view returns (uint256[] memory)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)"
];


// Contract addresses (replace with actual deployed addresses)
const CONTRACT_ADDRESSES = {
  escrow: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '0x...',
  nft: import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '0x...',
  pyusd: import.meta.env.VITE_PYUSD_CONTRACT_ADDRESS || '0x...'
};

export class SmartContractService {
  private static provider: ethers.Provider | null = null;
  private static signer: ethers.Signer | null = null;

  // Initialize provider and signer
  static async initialize() {
    if (typeof window.ethereum !== 'undefined') {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      return true;
    }
    return false;
  }

  // Get contract instances
  static getEscrowContract() {
    if (!this.signer) throw new Error('Signer not initialized');
    return new ethers.Contract(CONTRACT_ADDRESSES.escrow, ESCROW_ABI, this.signer);
  }

  static getNFTContract() {
    if (!this.signer) throw new Error('Signer not initialized');
    return new ethers.Contract(CONTRACT_ADDRESSES.nft, NFT_ABI, this.signer);
  }


  // Escrow functions
  static async createOrder(
    orderId: string,
    providerAddress: string,
    amount: string,
    location: string,
    description: string
  ) {
    const escrowContract = this.getEscrowContract();
    const orderIdBytes32 = ethers.id(orderId);
    
    const tx = await escrowContract.createOrder(
      orderIdBytes32,
      providerAddress,
      ethers.parseEther(amount),
      location,
      description
    );
    
    return await tx.wait();
  }

  static async acceptOrder(orderId: string) {
    const escrowContract = this.getEscrowContract();
    const orderIdBytes32 = ethers.id(orderId);
    
    const tx = await escrowContract.acceptOrder(orderIdBytes32);
    return await tx.wait();
  }

  static async completeStreaming(orderId: string) {
    const escrowContract = this.getEscrowContract();
    const orderIdBytes32 = ethers.id(orderId);
    
    const tx = await escrowContract.completeStreaming(orderIdBytes32);
    return await tx.wait();
  }

  static async confirmCompletion(orderId: string) {
    const escrowContract = this.getEscrowContract();
    const orderIdBytes32 = ethers.id(orderId);
    
    const tx = await escrowContract.confirmCompletion(orderIdBytes32);
    return await tx.wait();
  }

  static async createDispute(orderId: string, reason: string) {
    const escrowContract = this.getEscrowContract();
    const orderIdBytes32 = ethers.id(orderId);
    
    const tx = await escrowContract.createDispute(orderIdBytes32, reason);
    return await tx.wait();
  }

  static async getOrder(orderId: string) {
    const escrowContract = this.getEscrowContract();
    const orderIdBytes32 = ethers.id(orderId);
    
    return await escrowContract.getOrder(orderIdBytes32);
  }

  // NFT functions
  static async mintStreamCertificate(
    to: string,
    title: string,
    description: string,
    imageURI: string,
    location: string,
    duration: number,
    qualityScore: number,
    tags: string[]
  ) {
    const nftContract = this.getNFTContract();
    
    const tx = await nftContract.mintStreamCertificate(
      to,
      title,
      description,
      imageURI,
      location,
      duration,
      qualityScore,
      tags
    );
    
    return await tx.wait();
  }

  static async mintProviderBadge(
    to: string,
    title: string,
    description: string,
    imageURI: string,
    badgeType: number
  ) {
    const nftContract = this.getNFTContract();
    
    const tx = await nftContract.mintProviderBadge(
      to,
      title,
      description,
      imageURI,
      badgeType
    );
    
    return await tx.wait();
  }

  static async mintLocationNFT(
    to: string,
    title: string,
    description: string,
    imageURI: string,
    location: string
  ) {
    const nftContract = this.getNFTContract();
    
    const tx = await nftContract.mintLocationNFT(
      to,
      title,
      description,
      imageURI,
      location
    );
    
    return await tx.wait();
  }

  static async getUserNFTs(userAddress: string) {
    const nftContract = this.getNFTContract();
    return await nftContract.getUserNFTs(userAddress);
  }

  static async getNFTMetadata(tokenId: number) {
    const nftContract = this.getNFTContract();
    return await nftContract.getNFTMetadata(tokenId);
  }


  // Utility functions
  static async getCurrentAddress(): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized');
    return await this.signer.getAddress();
  }

  static async getNetwork() {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getNetwork();
  }

  // Event listeners
  static async listenToOrderEvents(callback: (event: any) => void) {
    const escrowContract = this.getEscrowContract();
    
    escrowContract.on('OrderCreated', callback);
    escrowContract.on('PaymentReleased', callback);
  }
}
