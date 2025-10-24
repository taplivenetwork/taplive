import { SmartContractService } from './smart-contracts';
import { LighthouseService } from './lighthouse';

export interface StreamQualityAnalysis {
  videoQuality: number;        // 0-100
  audioQuality: number;        // 0-100
  duration: number;            // Actual vs expected
  contentRelevance: number;    // 0-100
  technicalIssues: string[];   // List of issues
  overallScore: number;        // 0-100
  isFakeStream: boolean;       // Detected fake stream
  locationVerified: boolean;   // Location verification
  timeVerified: boolean;       // Time verification
}

export interface DisputeResolution {
  decision: 'PAY_PROVIDER' | 'PARTIAL_PAYMENT' | 'REFUND_CUSTOMER' | 'TECHNICAL_ISSUE';
  reason: string;
  providerAmount: number;
  refundAmount: number;
  platformFee: number;
  evidence: StreamQualityAnalysis;
}

export interface DisputeEvidence {
  screenshots: string[];
  videoClips: string[];
  description: string;
  expectedQuality: number;
  actualQuality: number;
  technicalLogs?: string[];
}

export class DisputeResolutionService {
  
  /**
   * Analyze stream quality using AI
   */
  static async analyzeStreamQuality(videoHash: string, expectedDuration: number): Promise<StreamQualityAnalysis> {
    try {
      // 1. Download video from IPFS
      const videoBlob = await LighthouseService.getFile(videoHash);
      
      // 2. Analyze video quality
      const videoQuality = await this.analyzeVideoQuality(videoBlob);
      
      // 3. Analyze audio quality
      const audioQuality = await this.analyzeAudioQuality(videoBlob);
      
      // 4. Check duration
      const duration = await this.getVideoDuration(videoBlob);
      const durationScore = this.calculateDurationScore(duration, expectedDuration);
      
      // 5. Analyze content relevance
      const contentRelevance = await this.analyzeContentRelevance(videoBlob);
      
      // 6. Detect technical issues
      const technicalIssues = await this.detectTechnicalIssues(videoBlob);
      
      // 7. Detect fake streams
      const isFakeStream = await this.detectFakeStream(videoBlob);
      
      // 8. Verify location (mock implementation)
      const locationVerified = await this.verifyLocation(videoHash);
      
      // 9. Verify timing (mock implementation)
      const timeVerified = await this.verifyStreamTime(videoHash);
      
      const overallScore = (videoQuality + audioQuality + contentRelevance + durationScore) / 4;
      
      return {
        videoQuality,
        audioQuality,
        duration,
        contentRelevance,
        technicalIssues,
        overallScore,
        isFakeStream,
        locationVerified,
        timeVerified
      };
    } catch (error) {
      console.error('Failed to analyze stream quality:', error);
      throw error;
    }
  }
  
  /**
   * Resolve dispute automatically
   */
  static async resolveDispute(
    orderId: string,
    disputeReason: string,
    evidence: DisputeEvidence
  ): Promise<DisputeResolution> {
    try {
      // Get order details
      const order = await SmartContractService.getOrder(orderId);
      
      // Analyze stream quality
      const analysis = await this.analyzeStreamQuality(
        order.videoHash || '', 
        order.expectedDuration || 1800
      );
      
      // Make decision based on analysis
      const resolution = this.makeDecision(analysis, evidence, order.amount);
      
      return resolution;
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      throw error;
    }
  }
  
  /**
   * Make dispute decision based on analysis
   */
  private static makeDecision(
    analysis: StreamQualityAnalysis,
    evidence: DisputeEvidence,
    totalAmount: number
  ): DisputeResolution {
    
    // Check for fraud
    if (analysis.isFakeStream || !analysis.locationVerified || !analysis.timeVerified) {
      return {
        decision: 'REFUND_CUSTOMER',
        reason: 'Fraud detected: Fake stream, location mismatch, or timing issues',
        providerAmount: 0,
        refundAmount: totalAmount,
        platformFee: 0,
        evidence: analysis
      };
    }
    
    // Check for technical issues
    if (analysis.technicalIssues.length > 3) {
      return {
        decision: 'TECHNICAL_ISSUE',
        reason: 'Multiple technical issues detected',
        providerAmount: 0,
        refundAmount: totalAmount,
        platformFee: 0,
        evidence: analysis
      };
    }
    
    // Quality-based decisions
    if (analysis.overallScore >= 80) {
      return {
        decision: 'PAY_PROVIDER',
        reason: 'Stream quality meets excellent standards',
        providerAmount: totalAmount * 0.9, // 90% to provider
        refundAmount: 0,
        platformFee: totalAmount * 0.1, // 10% platform fee
        evidence: analysis
      };
    } else if (analysis.overallScore >= 60) {
      return {
        decision: 'PARTIAL_PAYMENT',
        reason: 'Stream quality is acceptable but not excellent',
        providerAmount: totalAmount * 0.7, // 70% to provider
        refundAmount: totalAmount * 0.3,   // 30% refund
        platformFee: 0,
        evidence: analysis
      };
    } else if (analysis.overallScore >= 40) {
      return {
        decision: 'PARTIAL_PAYMENT',
        reason: 'Stream quality is below standards but not terrible',
        providerAmount: totalAmount * 0.4, // 40% to provider
        refundAmount: totalAmount * 0.6,   // 60% refund
        platformFee: 0,
        evidence: analysis
      };
    } else {
      return {
        decision: 'REFUND_CUSTOMER',
        reason: 'Stream quality is below acceptable standards',
        providerAmount: 0,
        refundAmount: totalAmount,
        platformFee: 0,
        evidence: analysis
      };
    }
  }
  
  /**
   * Analyze video quality (mock implementation)
   */
  private static async analyzeVideoQuality(videoBlob: Blob): Promise<number> {
    // In real implementation, this would use computer vision
    // For now, return a mock score based on file size
    const sizeInMB = videoBlob.size / (1024 * 1024);
    
    if (sizeInMB > 100) return 90; // Large file = good quality
    if (sizeInMB > 50) return 75;   // Medium file = decent quality
    if (sizeInMB > 20) return 60;   // Small file = poor quality
    return 30; // Very small file = very poor quality
  }
  
  /**
   * Analyze audio quality (mock implementation)
   */
  private static async analyzeAudioQuality(videoBlob: Blob): Promise<number> {
    // In real implementation, this would analyze audio
    // For now, return a mock score
    return Math.floor(Math.random() * 40) + 60; // 60-100
  }
  
  /**
   * Get video duration (mock implementation)
   */
  private static async getVideoDuration(videoBlob: Blob): Promise<number> {
    // In real implementation, this would extract duration from video
    // For now, return a mock duration
    return Math.floor(Math.random() * 3600) + 300; // 5-65 minutes
  }
  
  /**
   * Calculate duration score
   */
  private static calculateDurationScore(actual: number, expected: number): number {
    const ratio = actual / expected;
    if (ratio >= 0.9 && ratio <= 1.1) return 100; // Perfect duration
    if (ratio >= 0.8 && ratio <= 1.2) return 80;  // Good duration
    if (ratio >= 0.7 && ratio <= 1.3) return 60;  // Acceptable duration
    return 40; // Poor duration
  }
  
  /**
   * Analyze content relevance (mock implementation)
   */
  private static async analyzeContentRelevance(videoBlob: Blob): Promise<number> {
    // In real implementation, this would analyze video content
    // For now, return a mock score
    return Math.floor(Math.random() * 30) + 70; // 70-100
  }
  
  /**
   * Detect technical issues (mock implementation)
   */
  private static async detectTechnicalIssues(videoBlob: Blob): Promise<string[]> {
    // In real implementation, this would detect technical issues
    // For now, return mock issues
    const issues = [];
    if (Math.random() > 0.7) issues.push('Audio sync issues');
    if (Math.random() > 0.8) issues.push('Video stuttering');
    if (Math.random() > 0.9) issues.push('Poor lighting');
    return issues;
  }
  
  /**
   * Detect fake streams (mock implementation)
   */
  private static async detectFakeStream(videoBlob: Blob): Promise<boolean> {
    // In real implementation, this would detect fake streams
    // For now, return false (no fake streams detected)
    return false;
  }
  
  /**
   * Verify location (mock implementation)
   */
  private static async verifyLocation(videoHash: string): Promise<boolean> {
    // In real implementation, this would verify GPS coordinates
    // For now, return true (location verified)
    return true;
  }
  
  /**
   * Verify stream timing (mock implementation)
   */
  private static async verifyStreamTime(videoHash: string): Promise<boolean> {
    // In real implementation, this would verify stream timing
    // For now, return true (time verified)
    return true;
  }
  
  /**
   * Create dispute on smart contract
   */
  static async createDispute(orderId: string, reason: string): Promise<void> {
    try {
      await SmartContractService.createDispute(orderId, reason);
    } catch (error) {
      console.error('Failed to create dispute:', error);
      throw error;
    }
  }
  
  /**
   * Resolve dispute on smart contract
   */
  static async resolveDisputeOnChain(
    orderId: string,
    resolution: DisputeResolution
  ): Promise<void> {
    try {
      // Convert amounts to wei (assuming 18 decimals)
      const providerAmountWei = Math.floor(resolution.providerAmount * 1e18);
      const refundAmountWei = Math.floor(resolution.refundAmount * 1e18);
      
      // Call smart contract to resolve dispute
      await SmartContractService.resolveDispute(
        orderId,
        resolution.decision === 'PAY_PROVIDER' || resolution.decision === 'PARTIAL_PAYMENT',
        providerAmountWei,
        refundAmountWei
      );
    } catch (error) {
      console.error('Failed to resolve dispute on chain:', error);
      throw error;
    }
  }
  
  /**
   * Get dispute statistics
   */
  static async getDisputeStatistics(): Promise<{
    totalDisputes: number;
    resolvedDisputes: number;
    averageResolutionTime: number;
    customerSatisfaction: number;
  }> {
    // Mock statistics
    return {
      totalDisputes: 150,
      resolvedDisputes: 142,
      averageResolutionTime: 2.5, // days
      customerSatisfaction: 92 // percentage
    };
  }
}
