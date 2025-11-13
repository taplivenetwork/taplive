import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Brain,
  Camera,
  Mic,
  Clock,
  MapPin,
  Zap
} from 'lucide-react';

interface QualityAnalysis {
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

interface PaymentDecision {
  decision: 'PAY_PROVIDER' | 'PARTIAL_PAYMENT' | 'REFUND_CUSTOMER' | 'TECHNICAL_ISSUE';
  reason: string;
  providerAmount: number;
  refundAmount: number;
  platformFee: number;
}

export function FairPaymentDemo() {
  const { toast } = useToast();
  const [currentScenario, setCurrentScenario] = useState<string>('');
  const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
  const [decision, setDecision] = useState<PaymentDecision | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const scenarios = [
    {
      id: 'bad-quality',
      title: 'Bad Quality Stream (Black Screen)',
      description: 'Provider shows black screen, poor audio, short duration',
      videoQuality: 5,
      audioQuality: 0,
      duration: 300, // 5 minutes instead of 30
      contentRelevance: 0,
      technicalIssues: ['Black screen', 'No audio', 'Short duration'],
      isFakeStream: false,
      locationVerified: true,
      timeVerified: true
    },
    {
      id: 'good-quality',
      title: 'Good Quality Stream',
      description: 'Provider delivers excellent stream, customer refuses to pay',
      videoQuality: 85,
      audioQuality: 90,
      duration: 1800, // 30 minutes as expected
      contentRelevance: 95,
      technicalIssues: [],
      isFakeStream: false,
      locationVerified: true,
      timeVerified: true
    },
    {
      id: 'fake-stream',
      title: 'Fake Stream (Pre-recorded)',
      description: 'Provider shows pre-recorded content, not live',
      videoQuality: 80,
      audioQuality: 85,
      duration: 1800,
      contentRelevance: 60,
      technicalIssues: ['Pre-recorded content'],
      isFakeStream: true,
      locationVerified: false,
      timeVerified: false
    },
    {
      id: 'technical-issues',
      title: 'Technical Issues',
      description: 'Stream has multiple technical problems',
      videoQuality: 30,
      audioQuality: 25,
      duration: 1800,
      contentRelevance: 70,
      technicalIssues: ['Audio sync issues', 'Video stuttering', 'Poor lighting', 'Network problems'],
      isFakeStream: false,
      locationVerified: true,
      timeVerified: true
    }
  ];

  const analyzeStream = async (scenario: any) => {
    setAnalyzing(true);
    setCurrentScenario(scenario.id);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const overallScore = Math.floor(
      (scenario.videoQuality + scenario.audioQuality + scenario.contentRelevance) / 3
    );
    
    const analysis: QualityAnalysis = {
      ...scenario,
      overallScore
    };
    
    setAnalysis(analysis);
    
    // Make decision based on analysis
    const decision = makeDecision(analysis);
    setDecision(decision);
    
    setAnalyzing(false);
    
    toast({
      title: "Analysis Complete",
      description: `Stream quality: ${overallScore}/100`,
    });
  };

  const makeDecision = (analysis: QualityAnalysis): PaymentDecision => {
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
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'PAY_PROVIDER': return 'text-green-600';
      case 'PARTIAL_PAYMENT': return 'text-yellow-600';
      case 'REFUND_CUSTOMER': return 'text-red-600';
      case 'TECHNICAL_ISSUE': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'PAY_PROVIDER': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'PARTIAL_PAYMENT': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'REFUND_CUSTOMER': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'TECHNICAL_ISSUE': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default: return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Fair Payment System Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            See how AI automatically analyzes stream quality and makes fair payment decisions.
            No human bias, no disputes - just objective technical analysis.
          </p>
        </CardContent>
      </Card>

      {/* Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{scenario.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{scenario.description}</p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => analyzeStream(scenario)}
                disabled={analyzing}
                className="w-full"
              >
                {analyzing && currentScenario === scenario.id ? 'Analyzing...' : 'Analyze Stream'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Quality Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Score */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{analysis.overallScore}/100</div>
              <div className="text-sm text-muted-foreground">Overall Quality Score</div>
              <Progress value={analysis.overallScore} className="mt-2" />
            </div>

            {/* Quality Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Camera className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <div className="text-lg font-semibold">{analysis.videoQuality}/100</div>
                <div className="text-xs text-muted-foreground">Video Quality</div>
              </div>
              <div className="text-center">
                <Mic className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <div className="text-lg font-semibold">{analysis.audioQuality}/100</div>
                <div className="text-xs text-muted-foreground">Audio Quality</div>
              </div>
              <div className="text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <div className="text-lg font-semibold">{Math.floor(analysis.duration / 60)}min</div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
              <div className="text-center">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <div className="text-lg font-semibold">{analysis.contentRelevance}/100</div>
                <div className="text-xs text-muted-foreground">Content Relevance</div>
              </div>
            </div>

            {/* Technical Issues */}
            {analysis.technicalIssues.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Technical Issues Detected:</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.technicalIssues.map((issue, index) => (
                    <Badge key={index} variant="destructive">{issue}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Status */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  analysis.locationVerified ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {analysis.locationVerified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="text-xs text-muted-foreground">Location Verified</div>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  analysis.timeVerified ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {analysis.timeVerified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="text-xs text-muted-foreground">Time Verified</div>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  !analysis.isFakeStream ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {!analysis.isFakeStream ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="text-xs text-muted-foreground">Authentic Stream</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Decision */}
      {decision && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getDecisionIcon(decision.decision)}
              <span className={getDecisionColor(decision.decision)}>
                Payment Decision: {decision.decision.replace('_', ' ')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{decision.reason}</p>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{decision.providerAmount}%</div>
                <div className="text-sm text-muted-foreground">Provider Gets</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{decision.refundAmount}%</div>
                <div className="text-sm text-muted-foreground">Customer Refund</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{decision.platformFee}%</div>
                <div className="text-sm text-muted-foreground">Platform Fee</div>
              </div>
            </div>

            <div className="text-center">
              <Badge variant="outline" className="text-sm">
                <Zap className="w-4 h-4 mr-1" />
                Automatic Resolution - No Human Intervention
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Why This System is Fair</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">Customer Protection</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic refunds for poor quality</li>
                <li>• Fraud detection prevents fake streams</li>
                <li>• Location verification ensures real location</li>
                <li>• Objective quality analysis</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">Provider Protection</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic payment for good quality</li>
                <li>• Objective analysis prevents bias</li>
                <li>• Evidence collection supports claims</li>
                <li>• Clear quality standards</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
