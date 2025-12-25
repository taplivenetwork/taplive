import { GeoSafetyModal } from "@/components/geo-safety-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, MapPin, Eye, MessageCircle, Activity } from "lucide-react";
import { useState } from "react";

export function SafetyPage() {
  const [showGeoModal, setShowGeoModal] = useState(false);

  return (
    <div className="container mx-auto px-4 py-6 pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            Safety & Risk Control
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered protection and risk assessment system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowGeoModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Launch Safety Analysis
          </Button>
          <Badge variant="secondary" className="hidden md:flex">
            <Activity className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
      </div>

      {/* Main Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowGeoModal(true)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <CardTitle className="text-lg">Geographic Safety</CardTitle>
            <p className="text-sm text-muted-foreground">
              Location risk assessment with weather and terrain analysis
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <CardTitle className="text-lg">Content Monitoring</CardTitle>
            <p className="text-sm text-muted-foreground mb-3">
              Real-time content screening with threat detection
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Keywords Detected</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span>Alerts Today</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <MessageCircle className="w-5 h-5 text-orange-600" />
              </div>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <CardTitle className="text-lg">Voice Safety</CardTitle>
            <p className="text-sm text-muted-foreground mb-3">
              Audio analysis for emergency keywords
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Streams Monitored</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span>Response Time</span>
                <span className="font-semibold">&lt;2s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <CardTitle className="text-lg">Weather Alerts</CardTitle>
            <p className="text-sm text-muted-foreground mb-3">
              Severe weather warnings and risk evaluation
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Active Alerts</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span>Coverage</span>
                <span className="font-semibold">Global</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Assessments</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Safe Locations</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Alerts Prevented</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geo Safety Modal */}
      <GeoSafetyModal open={showGeoModal} onOpenChange={setShowGeoModal} />
    </div>
  );
}

export default SafetyPage;