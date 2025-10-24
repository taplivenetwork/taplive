export interface QualityAnalysis {
  videoQuality: number;
  audioQuality: number;
  duration: number;
  contentRelevance: number;
  technicalIssues: string[];
  overallScore: number;
  isFakeStream: boolean;
  locationVerified: boolean;
  timeVerified: boolean;
}

export interface PaymentDecision {
  decision: 'PAY_PROVIDER' | 'PARTIAL_PAYMENT' | 'REFUND_CUSTOMER' | 'TECHNICAL_ISSUE';
  reason: string;
  providerAmount: number;
  refundAmount: number;
  platformFee: number;
}

export class MockAIAnalysis {
  
  /**
   * Mock AI analysis for hackathon demo
   */
  static async analyzeStream(scenario: string): Promise<QualityAnalysis> {
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const scenarios = {
      'bad-quality': {
        videoQuality: 5,
        audioQuality: 0,
        duration: 300, // 5 minutes
        contentRelevance: 0,
        technicalIssues: ['Black screen', 'No audio', 'Short duration'],
        isFakeStream: false,
        locationVerified: true,
        timeVerified: true
      },
      'good-quality': {
        videoQuality: 85,
        audioQuality: 90,
        duration: 1800, // 30 minutes
        contentRelevance: 95,
        technicalIssues: [],
        isFakeStream: false,
        locationVerified: true,
        timeVerified: true
      },
      'fake-stream': {
        videoQuality: 80,
        audioQuality: 85,
        duration: 1800,
        contentRelevance: 60,
        technicalIssues: ['Pre-recorded content'],
        isFakeStream: true,
        locationVerified: false,
        timeVerified: false
      },
      'technical-issues': {
        videoQuality: 30,
        audioQuality: 25,
        duration: 1800,
        contentRelevance: 70,
        technicalIssues: ['Audio sync issues', 'Video stuttering', 'Poor lighting', 'Network problems'],
        isFakeStream: false,
        locationVerified: true,
        timeVerified: true
      },
      'partial-quality': {
        videoQuality: 65,
        audioQuality: 70,
        duration: 1500, // 25 minutes
        contentRelevance: 75,
        technicalIssues: ['Minor audio issues'],
        isFakeStream: false,
        locationVerified: true,
        timeVerified: true
      }
    };
    
    const data = scenarios[scenario] || scenarios['good-quality'];
    const overallScore = Math.floor(
      (data.videoQuality + data.audioQuality + data.contentRelevance) / 3
    );
    
    return { ...data, overallScore };
  }
  
  /**
   * Make payment decision based on analysis
   */
  static makeDecision(analysis: QualityAnalysis): PaymentDecision {
    // Check for fraud
    if (analysis.isFakeStream || !analysis.locationVerified || !analysis.timeVerified) {
      return {
        decision: 'REFUND_CUSTOMER',
        reason: 'Fraud detected: Fake stream, location mismatch, or timing issues',
        providerAmount: 0,
        refundAmount: 100,
        platformFee: 0
      };
    }
    
    // Check for technical issues
    if (analysis.technicalIssues.length > 3) {
      return {
        decision: 'TECHNICAL_ISSUE',
        reason: 'Multiple technical issues detected',
        providerAmount: 0,
        refundAmount: 100,
        platformFee: 0
      };
    }
    
    // Quality-based decisions
    if (analysis.overallScore >= 80) {
      return {
        decision: 'PAY_PROVIDER',
        reason: 'Stream quality meets excellent standards',
        providerAmount: 90,
        refundAmount: 0,
        platformFee: 10
      };
    } else if (analysis.overallScore >= 60) {
      return {
        decision: 'PARTIAL_PAYMENT',
        reason: 'Stream quality is acceptable but not excellent',
        providerAmount: 70,
        refundAmount: 30,
        platformFee: 0
      };
    } else if (analysis.overallScore >= 40) {
      return {
        decision: 'PARTIAL_PAYMENT',
        reason: 'Stream quality is below standards but not terrible',
        providerAmount: 40,
        refundAmount: 60,
        platformFee: 0
      };
    } else {
      return {
        decision: 'REFUND_CUSTOMER',
        reason: 'Stream quality is below acceptable standards',
        providerAmount: 0,
        refundAmount: 100,
        platformFee: 0
      };
    }
  }
  
  /**
   * Get all available scenarios
   */
  static getScenarios() {
    return [
      {
        id: 'bad-quality',
        title: 'Bad Quality Stream (Black Screen)',
        description: 'Provider shows black screen, poor audio, short duration',
        expectedOutcome: 'REFUND_CUSTOMER'
      },
      {
        id: 'good-quality',
        title: 'Good Quality Stream',
        description: 'Provider delivers excellent stream, customer refuses to pay',
        expectedOutcome: 'PAY_PROVIDER'
      },
      {
        id: 'fake-stream',
        title: 'Fake Stream (Pre-recorded)',
        description: 'Provider shows pre-recorded content, not live',
        expectedOutcome: 'REFUND_CUSTOMER'
      },
      {
        id: 'technical-issues',
        title: 'Technical Issues',
        description: 'Stream has multiple technical problems',
        expectedOutcome: 'TECHNICAL_ISSUE'
      },
      {
        id: 'partial-quality',
        title: 'Partial Quality Stream',
        description: 'Stream is acceptable but not excellent',
        expectedOutcome: 'PARTIAL_PAYMENT'
      }
    ];
  }
  
  /**
   * Get decision explanation
   */
  static getDecisionExplanation(decision: string): string {
    const explanations = {
      'PAY_PROVIDER': 'Provider delivered excellent quality stream and gets full payment',
      'PARTIAL_PAYMENT': 'Provider delivered acceptable quality stream and gets partial payment',
      'REFUND_CUSTOMER': 'Stream quality was below standards, customer gets full refund',
      'TECHNICAL_ISSUE': 'Multiple technical issues detected, customer gets full refund'
    };
    
    return explanations[decision] || 'Decision made based on AI analysis';
  }
  
  /**
   * Get quality score explanation
   */
  static getQualityScoreExplanation(score: number): string {
    if (score >= 80) return 'Excellent quality - HD video, clear audio, perfect content';
    if (score >= 60) return 'Good quality - Decent video, good audio, relevant content';
    if (score >= 40) return 'Acceptable quality - Poor video, acceptable audio, some content';
    return 'Poor quality - Very poor video, bad audio, irrelevant content';
  }
}
