import { LighthouseService, FileInfo } from './lighthouse';
import { SmartContractService } from './smart-contracts';

export interface DecentralizedStream {
  id: string;
  title: string;
  description: string;
  location: string;
  streamer: string;
  timestamp: number;
  duration: number;
  qualityScore: number;
  tags: string[];
  
  // IPFS hashes
  videoHash: string;
  metadataHash: string;
  thumbnailHash: string;
  recordHash: string;
  
  // IPFS URLs
  videoUrl: string;
  metadataUrl: string;
  thumbnailUrl: string;
  recordUrl: string;
  
  // Smart contract data
  orderId: string;
  paymentHash: string;
  nftTokenId?: number;
}

export class DecentralizedStreamingService {
  
  /**
   * Create a fully decentralized stream record
   */
  static async createDecentralizedStream(streamData: {
    id: string;
    title: string;
    description: string;
    location: string;
    streamer: string;
    duration: number;
    qualityScore: number;
    tags: string[];
    videoBlob: Blob;
    thumbnailBlob: Blob;
    orderId: string;
  }): Promise<DecentralizedStream> {
    
    try {
      // 1. Upload video to IPFS
      const videoFileInfo = await LighthouseService.uploadVideoStream(
        streamData.videoBlob,
        `${streamData.id}-video.webm`
      );
      
      // 2. Upload thumbnail to IPFS
      const thumbnailFileInfo = await LighthouseService.uploadThumbnail(
        streamData.thumbnailBlob,
        `${streamData.id}-thumbnail.jpg`
      );
      
      // 3. Create and upload metadata
      const metadata = {
        title: streamData.title,
        description: streamData.description,
        location: streamData.location,
        duration: streamData.duration,
        qualityScore: streamData.qualityScore,
        tags: streamData.tags,
        streamer: streamData.streamer,
        timestamp: Date.now(),
        videoHash: videoFileInfo.hash
      };
      
      const metadataFileInfo = await LighthouseService.uploadStreamMetadata(metadata);
      
      // 4. Create decentralized stream record
      const streamRecord = {
        videoHash: videoFileInfo.hash,
        metadataHash: metadataFileInfo.hash,
        thumbnailHash: thumbnailFileInfo.hash,
        streamer: streamData.streamer,
        location: streamData.location,
        timestamp: Date.now(),
        duration: streamData.duration,
        qualityScore: streamData.qualityScore
      };
      
      const recordFileInfo = await LighthouseService.createDecentralizedStreamRecord(streamRecord);
      
      // 5. Mint NFT achievement (if smart contract is available)
      let nftTokenId: number | undefined;
      try {
        const nftTx = await SmartContractService.mintStreamCertificate(
          streamData.streamer,
          streamData.title,
          streamData.description,
          thumbnailFileInfo.url,
          streamData.location,
          streamData.duration,
          streamData.qualityScore,
          streamData.tags
        );
        
        // Extract token ID from transaction (simplified)
        nftTokenId = Math.floor(Math.random() * 1000000); // Mock token ID
      } catch (error) {
        console.warn('NFT minting failed:', error);
      }
      
      // 6. Create decentralized stream object
      const decentralizedStream: DecentralizedStream = {
        id: streamData.id,
        title: streamData.title,
        description: streamData.description,
        location: streamData.location,
        streamer: streamData.streamer,
        timestamp: Date.now(),
        duration: streamData.duration,
        qualityScore: streamData.qualityScore,
        tags: streamData.tags,
        
        // IPFS hashes
        videoHash: videoFileInfo.hash,
        metadataHash: metadataFileInfo.hash,
        thumbnailHash: thumbnailFileInfo.hash,
        recordHash: recordFileInfo.hash,
        
        // IPFS URLs
        videoUrl: videoFileInfo.url,
        metadataUrl: metadataFileInfo.url,
        thumbnailUrl: thumbnailFileInfo.url,
        recordUrl: recordFileInfo.url,
        
        // Smart contract data
        orderId: streamData.orderId,
        paymentHash: '', // Would be filled from smart contract
        nftTokenId
      };
      
      return decentralizedStream;
      
    } catch (error) {
      console.error('Failed to create decentralized stream:', error);
      throw error;
    }
  }
  
  /**
   * Get decentralized stream by ID
   */
  static async getDecentralizedStream(streamId: string): Promise<DecentralizedStream | null> {
    try {
      // In a real implementation, you'd query your database for the stream record
      // and then fetch the IPFS data
      
      // Mock implementation
      const mockStream: DecentralizedStream = {
        id: streamId,
        title: 'Sample Decentralized Stream',
        description: 'This stream is stored on IPFS',
        location: 'Tokyo, Japan',
        streamer: '0x123...',
        timestamp: Date.now(),
        duration: 1800, // 30 minutes
        qualityScore: 4.8,
        tags: ['travel', 'japan', 'tokyo'],
        
        videoHash: 'QmSampleVideoHash',
        metadataHash: 'QmSampleMetadataHash',
        thumbnailHash: 'QmSampleThumbnailHash',
        recordHash: 'QmSampleRecordHash',
        
        videoUrl: 'https://gateway.lighthouse.storage/ipfs/QmSampleVideoHash',
        metadataUrl: 'https://gateway.lighthouse.storage/ipfs/QmSampleMetadataHash',
        thumbnailUrl: 'https://gateway.lighthouse.storage/ipfs/QmSampleThumbnailHash',
        recordUrl: 'https://gateway.lighthouse.storage/ipfs/QmSampleRecordHash',
        
        orderId: 'order-123',
        paymentHash: '0xPaymentHash',
        nftTokenId: 12345
      };
      
      return mockStream;
    } catch (error) {
      console.error('Failed to get decentralized stream:', error);
      return null;
    }
  }
  
  /**
   * Verify stream integrity
   */
  static async verifyStreamIntegrity(stream: DecentralizedStream): Promise<{
    videoValid: boolean;
    metadataValid: boolean;
    thumbnailValid: boolean;
    recordValid: boolean;
    overallValid: boolean;
  }> {
    try {
      const [videoValid, metadataValid, thumbnailValid, recordValid] = await Promise.all([
        LighthouseService.fileExists(stream.videoHash),
        LighthouseService.fileExists(stream.metadataHash),
        LighthouseService.fileExists(stream.thumbnailHash),
        LighthouseService.fileExists(stream.recordHash)
      ]);
      
      const overallValid = videoValid && metadataValid && thumbnailValid && recordValid;
      
      return {
        videoValid,
        metadataValid,
        thumbnailValid,
        recordValid,
        overallValid
      };
    } catch (error) {
      console.error('Failed to verify stream integrity:', error);
      return {
        videoValid: false,
        metadataValid: false,
        thumbnailValid: false,
        recordValid: false,
        overallValid: false
      };
    }
  }
  
  /**
   * Get stream metadata from IPFS
   */
  static async getStreamMetadata(metadataHash: string): Promise<any> {
    try {
      const metadataBlob = await LighthouseService.getFile(metadataHash);
      const metadataText = await metadataBlob.text();
      return JSON.parse(metadataText);
    } catch (error) {
      console.error('Failed to get stream metadata:', error);
      throw error;
    }
  }
  
  /**
   * Get stream video from IPFS
   */
  static async getStreamVideo(videoHash: string): Promise<Blob> {
    try {
      return await LighthouseService.getFile(videoHash);
    } catch (error) {
      console.error('Failed to get stream video:', error);
      throw error;
    }
  }
  
  /**
   * Get stream thumbnail from IPFS
   */
  static async getStreamThumbnail(thumbnailHash: string): Promise<Blob> {
    try {
      return await LighthouseService.getFile(thumbnailHash);
    } catch (error) {
      console.error('Failed to get stream thumbnail:', error);
      throw error;
    }
  }
  
  /**
   * Pin stream to IPFS (ensure persistence)
   */
  static async pinStream(stream: DecentralizedStream): Promise<boolean> {
    try {
      const results = await Promise.all([
        LighthouseService.pinFile(stream.videoHash),
        LighthouseService.pinFile(stream.metadataHash),
        LighthouseService.pinFile(stream.thumbnailHash),
        LighthouseService.pinFile(stream.recordHash)
      ]);
      
      return results.every(result => result);
    } catch (error) {
      console.error('Failed to pin stream:', error);
      return false;
    }
  }
  
  /**
   * Unpin stream from IPFS
   */
  static async unpinStream(stream: DecentralizedStream): Promise<boolean> {
    try {
      const results = await Promise.all([
        LighthouseService.unpinFile(stream.videoHash),
        LighthouseService.unpinFile(stream.metadataHash),
        LighthouseService.unpinFile(stream.thumbnailHash),
        LighthouseService.unpinFile(stream.recordHash)
      ]);
      
      return results.every(result => result);
    } catch (error) {
      console.error('Failed to unpin stream:', error);
      return false;
    }
  }
  
  /**
   * Get multiple gateway URLs for redundancy
   */
  static getStreamUrls(stream: DecentralizedStream): {
    video: string[];
    metadata: string[];
    thumbnail: string[];
    record: string[];
  } {
    return {
      video: LighthouseService.getMultipleGatewayUrls(stream.videoHash),
      metadata: LighthouseService.getMultipleGatewayUrls(stream.metadataHash),
      thumbnail: LighthouseService.getMultipleGatewayUrls(stream.thumbnailHash),
      record: LighthouseService.getMultipleGatewayUrls(stream.recordHash)
    };
  }
}
