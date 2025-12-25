import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TranslatedText } from '@/components/translated-text';
import { Brain, CheckCircle, AlertTriangle, Star, X, FileAudio, MessageSquare, Shield, Zap } from 'lucide-react';

interface AISummaryData {
  orderId: string;
  transcription: string;
  aiSummary: string;
  keyPoints: string[];
  credibilityReport: {
    trustIndicators: string[];
    riskFactors: string[];
    credibilityScore: number;
    recommendations: string[];
  };
  generatedAt: string;
  recordingUrl?: string;
}

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData?: AISummaryData;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function AISummaryModal({ isOpen, onClose, summaryData, isLoading, error, onRetry }: AISummaryModalProps) {
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = [
    { text: "Analyzing audio recording...", icon: FileAudio, color: "text-blue-600" },
    { text: "Transcribing conversation...", icon: MessageSquare, color: "text-green-600" },
    { text: "Processing with AI intelligence...", icon: Brain, color: "text-purple-600" },
    { text: "Assessing credibility factors...", icon: Shield, color: "text-orange-600" },
    { text: "Generating comprehensive report...", icon: Zap, color: "text-red-600" },
    { text: "Finalizing analysis...", icon: CheckCircle, color: "text-indigo-600" }
  ];

  // Cycle through loading messages
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(interval);
  }, [isLoading, loadingMessages.length]);

  const getCredibilityColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCredibilityIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="w-4 h-4" />;
    if (score >= 6) return <AlertTriangle className="w-4 h-4" />;
    return <X className="w-4 h-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-lg">
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Brain className="w-6 h-6 text-purple-600" />
            <TranslatedText>AI Collaboration Summary & Credibility Report</TranslatedText>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
            {/* Animated brain icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-20"></div>
              <div className="relative bg-gradient-to-br from-purple-500 to-blue-600 p-4 rounded-full shadow-lg">
                <Brain className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>

            {/* Current loading message with icon */}
            <div className="flex items-center gap-3 mb-4">
              {(() => {
                const currentMessage = loadingMessages[loadingMessageIndex];
                const IconComponent = currentMessage.icon;
                return (
                  <>
                    <div className={`p-2 rounded-full bg-white shadow-md ${currentMessage.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-semibold text-gray-900 dark:text-white">
                      <TranslatedText>{currentMessage.text}</TranslatedText>
                    </span>
                  </>
                );
              })()}
            </div>

            {/* Progress dots animation */}
            <div className="flex gap-1 mb-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-in-out"
                style={{
                  width: `${((loadingMessageIndex + 1) / loadingMessages.length) * 100}%`
                }}
              />
            </div>

            {/* Estimated time */}
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              <TranslatedText>This may take 20-30 seconds depending on recording length</TranslatedText>
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <X className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
              <TranslatedText>Generation Failed</TranslatedText>
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 text-center mb-4">
              {error.message || <TranslatedText>Failed to generate AI summary. Please try again.</TranslatedText>}
            </p>
            <div className="flex gap-2">
              <Button onClick={onClose} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                <TranslatedText>Close</TranslatedText>
              </Button>
              {onRetry && (
                <Button 
                  onClick={onRetry}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <TranslatedText>Try Again</TranslatedText>
                </Button>
              )}
            </div>
          </div>
        ) : summaryData ? (
          <div className="space-y-6">
            {/* Video Recording */}
            {summaryData.recordingUrl && (
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-purple-200 dark:border-purple-800">
                <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <TranslatedText>Session Recording</TranslatedText>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      src={summaryData.recordingUrl}
                      controls
                      className="w-full h-full"
                      preload="metadata"
                    >
                      <TranslatedText>Your browser does not support video playback.</TranslatedText>
                    </video>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      <TranslatedText>Review the recorded session for reference</TranslatedText>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(summaryData.recordingUrl, '_blank')}
                    >
                      <TranslatedText>Download Recording</TranslatedText>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Overview */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                <CardTitle className="text-gray-900 dark:text-white">
                  <TranslatedText>Session Summary</TranslatedText>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <TranslatedText>Generated on</TranslatedText> {new Date(summaryData.generatedAt).toLocaleString()}
                </p>
                <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">{summaryData.aiSummary}</p>
              </CardContent>
            </Card>

            {/* Key Points */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-900/20">
                <CardTitle className="text-gray-900 dark:text-white">
                  <TranslatedText>Key Discussion Points</TranslatedText>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {summaryData.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                      <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Credibility Report */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-yellow-200 dark:border-yellow-800">
              <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <TranslatedText>Credibility Assessment</TranslatedText>
                  <Badge className={`flex items-center gap-1 ${getCredibilityColor(summaryData.credibilityReport.credibilityScore)}`}>
                    {getCredibilityIcon(summaryData.credibilityReport.credibilityScore)}
                    Score: {summaryData.credibilityReport.credibilityScore}/10
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trust Indicators */}
                <div>
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <TranslatedText>Trust Indicators</TranslatedText>
                  </h4>
                  <ul className="space-y-1">
                    {summaryData.credibilityReport.trustIndicators.map((indicator, index) => (
                      <li key={index} className="text-sm text-green-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                        {indicator}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk Factors */}
                {summaryData.credibilityReport.riskFactors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <TranslatedText>Risk Factors</TranslatedText>
                    </h4>
                    <ul className="space-y-1">
                      {summaryData.credibilityReport.riskFactors.map((risk, index) => (
                        <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <TranslatedText>Recommendations</TranslatedText>
                  </h4>
                  <ul className="space-y-1">
                    {summaryData.credibilityReport.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Transcription Preview */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-gray-300 dark:border-gray-700">
              <CardHeader className="bg-gray-50 dark:bg-gray-900/20">
                <CardTitle className="text-gray-900 dark:text-white">
                  <TranslatedText>Transcription Preview</TranslatedText>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  {summaryData.transcription}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">
              <TranslatedText>No summary data available</TranslatedText>
            </p>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="outline">
            <TranslatedText>Close</TranslatedText>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}