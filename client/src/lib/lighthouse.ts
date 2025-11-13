import axios from 'axios';

// Lighthouse API configuration
const LIGHTHOUSE_API_URL = 'https://api.lighthouse.storage';
const LIGHTHOUSE_API_KEY = import.meta.env.VITE_LIGHTHOUSE_API_KEY || '';

export interface UploadResponse {
  data: {
    Name: string;
    Hash: string;
    Size: string;
  };
}

export interface FileInfo {
  hash: string;
  name: string;
  size: number;
  url: string;
}

export class LighthouseService {
  private static apiKey: string = LIGHTHOUSE_API_KEY;

  /**
   * Upload file to IPFS via Lighthouse
   */
  static async uploadFile(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${LIGHTHOUSE_API_URL}/api/v0/add`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Lighthouse upload failed:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  /**
   * Upload video stream to IPFS
   */
  static async uploadVideoStream(videoBlob: Blob, filename: string): Promise<FileInfo> {
    try {
      const file = new File([videoBlob], filename, { type: 'video/webm' });
      const response = await this.uploadFile(file);
      
      return {
        hash: response.data.Hash,
        name: response.data.Name,
        size: parseInt(response.data.Size),
        url: `https://gateway.lighthouse.storage/ipfs/${response.data.Hash}`
      };
    } catch (error) {
      console.error('Video upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload stream metadata to IPFS
   */
  static async uploadStreamMetadata(metadata: {
    title: string;
    description: string;
    location: string;
    duration: number;
    qualityScore: number;
    tags: string[];
    streamer: string;
    timestamp: number;
    videoHash: string;
  }): Promise<FileInfo> {
    try {
      const metadataJson = JSON.stringify(metadata, null, 2);
      const file = new File([metadataJson], 'stream-metadata.json', { 
        type: 'application/json' 
      });
      
      const response = await this.uploadFile(file);
      
      return {
        hash: response.data.Hash,
        name: response.data.Name,
        size: parseInt(response.data.Size),
        url: `https://gateway.lighthouse.storage/ipfs/${response.data.Hash}`
      };
    } catch (error) {
      console.error('Metadata upload failed:', error);
      throw error;
    }
  }

  /**
   * Get file from IPFS
   */
  static async getFile(hash: string): Promise<Blob> {
    try {
      const response = await axios.get(
        `https://gateway.lighthouse.storage/ipfs/${hash}`,
        { responseType: 'blob' }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get file from IPFS:', error);
      throw new Error('Failed to retrieve file from IPFS');
    }
  }

  /**
   * Get file info from IPFS
   */
  static async getFileInfo(hash: string): Promise<FileInfo> {
    try {
      const response = await axios.get(
        `https://gateway.lighthouse.storage/ipfs/${hash}`,
        { responseType: 'blob' }
      );
      
      return {
        hash: hash,
        name: 'Unknown',
        size: response.data.size,
        url: `https://gateway.lighthouse.storage/ipfs/${hash}`
      };
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }

  /**
   * Pin file to IPFS (ensure persistence)
   */
  static async pinFile(hash: string): Promise<boolean> {
    try {
      await axios.post(
        `${LIGHTHOUSE_API_URL}/api/v0/pin/add`,
        null,
        {
          params: { arg: hash },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      
      return true;
    } catch (error) {
      console.error('Failed to pin file:', error);
      return false;
    }
  }

  /**
   * Unpin file from IPFS
   */
  static async unpinFile(hash: string): Promise<boolean> {
    try {
      await axios.post(
        `${LIGHTHOUSE_API_URL}/api/v0/pin/rm`,
        null,
        {
          params: { arg: hash },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      
      return true;
    } catch (error) {
      console.error('Failed to unpin file:', error);
      return false;
    }
  }

  /**
   * Get IPFS gateway URL
   */
  static getGatewayUrl(hash: string): string {
    return `https://gateway.lighthouse.storage/ipfs/${hash}`;
  }

  /**
   * Get multiple gateway URLs for redundancy
   */
  static getMultipleGatewayUrls(hash: string): string[] {
    return [
      `https://gateway.lighthouse.storage/ipfs/${hash}`,
      `https://ipfs.io/ipfs/${hash}`,
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
      `https://dweb.link/ipfs/${hash}`
    ];
  }

  /**
   * Check if file exists on IPFS
   */
  static async fileExists(hash: string): Promise<boolean> {
    try {
      await this.getFile(hash);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Upload stream thumbnail to IPFS
   */
  static async uploadThumbnail(imageBlob: Blob, filename: string): Promise<FileInfo> {
    try {
      const file = new File([imageBlob], filename, { type: 'image/jpeg' });
      const response = await this.uploadFile(file);
      
      return {
        hash: response.data.Hash,
        name: response.data.Name,
        size: parseInt(response.data.Size),
        url: `https://gateway.lighthouse.storage/ipfs/${response.data.Hash}`
      };
    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      throw error;
    }
  }

  /**
   * Create decentralized stream record
   */
  static async createDecentralizedStreamRecord(streamData: {
    videoHash: string;
    metadataHash: string;
    thumbnailHash: string;
    streamer: string;
    location: string;
    timestamp: number;
    duration: number;
    qualityScore: number;
  }): Promise<FileInfo> {
    try {
      const record = {
        ...streamData,
        type: 'decentralized_stream_record',
        version: '1.0',
        created: new Date().toISOString(),
        network: 'ipfs'
      };
      
      const recordJson = JSON.stringify(record, null, 2);
      const file = new File([recordJson], 'stream-record.json', { 
        type: 'application/json' 
      });
      
      const response = await this.uploadFile(file);
      
      return {
        hash: response.data.Hash,
        name: response.data.Name,
        size: parseInt(response.data.Size),
        url: `https://gateway.lighthouse.storage/ipfs/${response.data.Hash}`
      };
    } catch (error) {
      console.error('Stream record creation failed:', error);
      throw error;
    }
  }
}
