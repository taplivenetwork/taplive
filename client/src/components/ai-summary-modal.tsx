import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TranslatedText } from '@/components/translated-text';
import { Brain, CheckCircle, AlertTriangle, Star, X } from 'lucide-react';

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
}

export function AISummaryModal({ isOpen, onClose, summaryData, isLoading }: AISummaryModalProps) {
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
          <div className="flex items-center justify-center py-8 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mr-4" />
            <span className="text-lg text-gray-900 dark:text-white">
              <TranslatedText>Generating AI analysis...</TranslatedText>
            </span>
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