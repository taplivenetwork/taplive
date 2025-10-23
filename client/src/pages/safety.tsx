import { GeoSafetyPanel } from "@/components/geo-safety-panel";
import { AAGroupPanel } from "@/components/aa-group-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, AlertTriangle, MapPin, Eye, MessageCircle } from "lucide-react";

export function SafetyPage() {
  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-4xl font-bold">
            Geographic Safety & Risk Control System
          </h1>
        </div>
        <p className="text-muted-foreground">
          Comprehensive safety features and risk management for secure streaming
        </p>
      </div>

      {/* Safety Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-700 dark:text-green-400">
                  Geographic Risk Control
                </div>
                <div className="text-base text-green-600 dark:text-green-300">
                  Military Base Detection
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-700 dark:text-blue-400">
                  Weather Warnings
                </div>
                <div className="text-base text-blue-600 dark:text-blue-300">
                  Natural Disaster Prevention
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-700 dark:text-orange-400">
                  Content Moderation
                </div>
                <div className="text-base text-orange-600 dark:text-orange-300">
                  Keyword Detection
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-purple-700 dark:text-purple-400">
                  Real-time Voice Detection
                </div>
                <div className="text-base text-purple-600 dark:text-purple-300">
                  Real-time Voice Detection
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="geo-safety" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="geo-safety" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Geographic Risk Control
          </TabsTrigger>
          <TabsTrigger value="aa-group" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            AA Group Buying
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geo-safety" className="mt-6">
          <div className="space-y-6">
            {/* Feature Overview */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Safety Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                  <div className="space-y-2">
                    <div className="font-medium">
                      Geographic Risk Control
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Auto Military Detection</li>
                      <li>• Extreme Environment Assessment</li>
                      <li>• Geofence Boundary Detection</li>
                      <li>• Auto Timezone Recognition</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">
                      Weather Warnings
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Storm Warning</li>
                      <li>• Earthquake Monitoring</li>
                      <li>• Avalanche Assessment</li>
                      <li>• Auto Cancel Dangerous</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Geo Safety Panel */}
            <GeoSafetyPanel />

            {/* Content Safety Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-orange-600" />
                  Content Moderation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive" className="text-base">
                          High Risk
                        </Badge>
                      </div>
                      <div className="text-base font-medium mb-1">
                        Illegal Activity Detection
                      </div>
                      <div className="text-base text-muted-foreground">
                        Drug/Weapon Trafficking
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-base border-orange-300">
                          Medium Risk
                        </Badge>
                      </div>
                      <div className="text-base font-medium mb-1">
                        Privacy Violation
                      </div>
                      <div className="text-base text-muted-foreground">
                        Unauthorized Recording
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-base">
                          Real-time Monitoring
                        </Badge>
                      </div>
                      <div className="text-base font-medium mb-1">
                        Real-time Voice Detection
                      </div>
                      <div className="text-base text-muted-foreground">
                        Emergency Threat Detection
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-base font-medium mb-2">
                    AI Detection Process
                  </div>
                  <div className="flex items-center gap-2 text-base text-muted-foreground">
                    <span>1. Real-time Keyword Detection</span>
                    <span>→</span>
                    <span>2. AI Confidence Assessment</span>
                    <span>→</span>
                    <span>3. Auto or Manual Review</span>
                    <span>→</span>
                    <span>4. Order Warning/Termination</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="aa-group" className="mt-6">
          <div className="space-y-6">
            {/* AA Group Overview */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  AA Group Buying
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                  <div className="space-y-2">
                    <div className="font-medium">
                      Intelligent Split Payment
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Support Cost Sharing</li>
                      <li>• Auto Calculate Amount</li>
                      <li>• Unified Payment (Full)</li>
                      <li>• Auto Refund Protection</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">
                      Social Sharing
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Generate Invite Link</li>
                      <li>• QR Scan Join</li>
                      <li>• Real-time Progress Display</li>
                      <li>• Flexible Time Limit</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AA Group Panel */}
            <AAGroupPanel />

            {/* Payment Flow */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Secure Payment Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-blue-600 font-bold">1</span>
                      </div>
                      <div className="text-base font-medium">
                        Create Group
                      </div>
                      <div className="text-base text-muted-foreground">
                        Set Participants
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-green-600 font-bold">2</span>
                      </div>
                      <div className="text-base font-medium">
                        Join Group
                      </div>
                      <div className="text-base text-muted-foreground">
                        Share Link
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-orange-600 font-bold">3</span>
                      </div>
                      <div className="text-base font-medium">
                        Confirm Payment
                      </div>
                      <div className="text-base text-muted-foreground">
                        Unified Payment (Full)
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-purple-600 font-bold">4</span>
                      </div>
                      <div className="text-base font-medium">
                        Service Complete
                      </div>
                      <div className="text-base text-muted-foreground">
                        Auto Payout
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-800 dark:text-yellow-400">
                          Risk Protection
                        </div>
                        <div className="text-base text-yellow-700 dark:text-yellow-300 mt-1">
                          Group Fail = Auto Refund
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SafetyPage;
