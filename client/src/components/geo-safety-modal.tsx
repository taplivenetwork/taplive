import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Shield, Globe, Cloud, TrendingUp, AlertTriangle, CheckCircle, XCircle, Loader2, Info, Target, Clock, Gauge } from "lucide-react";
import { TranslatedText } from "./translated-text";

interface LocationRisk {
  riskLevel: string;
  reasons: string[];
  restrictions: string[];
  canProceed: boolean;
  riskInfo: {
    color: string;
    label: string;
    icon: string;
  };
}

interface GisRiskAssessment {
  context: {
    task_context: {
      task: string;
      location: string;
      time_window: string;
    };
    gis: {
      area_type: string;
      risk_notes: string;
    };
    weather: {
      temperature: number;
      wind_speed: number;
      rain_risk: string;
    };
    user_preferences: {
      risk_tolerance: string;
      mission_criticality: string;
      asset_sensitivity: string;
    };
  };
  ai_decision: string;
  formatted_context: string;
}

interface GeoSafetyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GeoSafetyModal({ open, onOpenChange }: GeoSafetyModalProps) {
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [locationRisk, setLocationRisk] = useState<LocationRisk | null>(null);
  const [gisAssessment, setGisAssessment] = useState<GisRiskAssessment | null>(null);
  const [checking, setChecking] = useState(false);
  const [task, setTask] = useState("Outdoor drone inspection");
  const [timeWindow, setTimeWindow] = useState("Next 2 hours");
  const [riskTolerance, setRiskTolerance] = useState("medium");
  const [missionCriticality, setMissionCriticality] = useState("routine");
  const [assetSensitivity, setAssetSensitivity] = useState("medium");

  const getCurrentLocation = () => {
    setChecking(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(newLocation);
          checkLocationSafety(newLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
          const demoLocation = { latitude: 37.7749, longitude: -122.4194 };
          setLocation(demoLocation);
          checkLocationSafety(demoLocation);
        }
      );
    } else {
      const demoLocation = { latitude: 37.7749, longitude: -122.4194 };
      setLocation(demoLocation);
      checkLocationSafety(demoLocation);
    }
  };

  const checkLocationSafety = async (coords: { latitude: number; longitude: number }) => {
    try {
      const riskResponse = await fetch('/api/orders/check-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coords)
      });

      if (riskResponse.ok) {
        const riskResult = await riskResponse.json();
        setLocationRisk(riskResult.data);
      }

      await assessGisRisk(coords);
    } catch (error) {
      console.error('Failed to check location safety:', error);
    }
    setChecking(false);
  };

  const assessGisRisk = async (coords: { latitude: number; longitude: number }) => {
    try {
      const locationName = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;

      console.log("🔍 [FRONTEND] Initiating GIS risk assessment:");
      console.log(`   Location: ${locationName}, Lat: ${coords.latitude}, Lon: ${coords.longitude}`);
      console.log(`   Task: ${task}, Time Window: ${timeWindow}`);

      const response = await fetch('/api/gis-risk-assessment?' + new URLSearchParams({
        location: locationName,
        lat: coords.latitude.toString(),
        lon: coords.longitude.toString(),
        task: task,
        timeWindow: timeWindow,
        riskTolerance: riskTolerance,
        missionCriticality: missionCriticality,
        assetSensitivity: assetSensitivity
      }));

      if (response.ok) {
        const result = await response.json();
        console.log("✅ [FRONTEND] GIS risk assessment successful:", result);
        if (result.success) {
          setGisAssessment(result.data);
        }
      }
    } catch (error) {
      console.error('GIS Risk Assessment error:', error);
    }
  };

  const getDecisionBadge = (decision: string) => {
    if (decision.toUpperCase().includes('PAUSE') || decision.toUpperCase().includes('ABORT')) {
      return { variant: 'destructive' as const, icon: <XCircle className="w-4 h-4" />, label: 'High Risk' };
    } else if (decision.toUpperCase().includes('CAUTION')) {
      return { variant: 'outline' as const, icon: <AlertTriangle className="w-4 h-4" />, label: 'Proceed with Caution' };
    } else {
      return { variant: 'default' as const, icon: <CheckCircle className="w-4 h-4" />, label: 'Clear to Proceed' };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <span>Geographic Safety Analysis</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            Real-time risk assessment combining AI intelligence, weather data, and geographic information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Mission Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Task Type
                    </label>
                    <select
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="Outdoor drone inspection">Outdoor Drone Inspection</option>
                      <option value="Delivery service">Delivery Service</option>
                      <option value="Field survey">Field Survey</option>
                      <option value="Emergency response">Emergency Response</option>
                      <option value="Construction monitoring">Construction Monitoring</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Time Window
                    </label>
                    <select
                      value={timeWindow}
                      onChange={(e) => setTimeWindow(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="Next 30 minutes">Next 30 minutes</option>
                      <option value="Next 1 hour">Next 1 hour</option>
                      <option value="Next 2 hours">Next 2 hours</option>
                      <option value="Next 4 hours">Next 4 hours</option>
                      <option value="Next 24 hours">Next 24 hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Risk Tolerance
                    </label>
                    <select
                      value={riskTolerance}
                      onChange={(e) => setRiskTolerance(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="low">Low - Maximum Safety</option>
                      <option value="medium">Medium - Balanced</option>
                      <option value="high">High - Accept More Risk</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Mission Criticality
                    </label>
                    <select
                      value={missionCriticality}
                      onChange={(e) => setMissionCriticality(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="routine">Routine</option>
                      <option value="important">Important</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>
              </div>

              <Button 
                onClick={getCurrentLocation}
                disabled={checking}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Analyze Current Location
                  </>
                )}
              </Button>

              {location.latitude !== 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 flex items-center gap-3 border border-slate-200 dark:border-slate-700">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Current Position</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                      {location.latitude.toFixed(6)}°N, {location.longitude.toFixed(6)}°E
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Safety Features
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>AI-powered risk evaluation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Real-time weather monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Geographic hazard detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Contextual safety recommendations</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          {gisAssessment && (
            <div className="space-y-4">
              {/* Decision Badge */}
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Risk Assessment Result
                  </h3>
                  <Badge 
                    variant={getDecisionBadge(gisAssessment.ai_decision).variant}
                    className="px-3 py-1 text-xs flex items-center gap-1"
                  >
                    {getDecisionBadge(gisAssessment.ai_decision).icon}
                    {getDecisionBadge(gisAssessment.ai_decision).label}
                  </Badge>
                </div>

                <div className={`p-4 rounded-lg border ${
                  gisAssessment.ai_decision.toUpperCase().includes('PAUSE') 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : gisAssessment.ai_decision.toUpperCase().includes('CAUTION')
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}>
                  <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-slate-700 dark:text-slate-300">
                    {gisAssessment.ai_decision}
                  </pre>
                </div>
              </div>

              {/* Environmental Data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Cloud className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Weather</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Temperature</span>
                      <span className="font-semibold">{gisAssessment.context.weather.temperature}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Wind Speed</span>
                      <span className="font-semibold">{gisAssessment.context.weather.wind_speed} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Rain Risk</span>
                      <span className="font-semibold">{gisAssessment.context.weather.rain_risk}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Geographic</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Area Type</span>
                      <span className="font-semibold">{gisAssessment.context.gis.area_type}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-slate-600 dark:text-slate-400 text-xs">Notes</span>
                      <p className="text-slate-900 dark:text-slate-100 mt-1">{gisAssessment.context.gis.risk_notes}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Mission Profile</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Risk Tolerance</span>
                      <Badge variant="outline" className="text-xs">
                        {gisAssessment.context.user_preferences.risk_tolerance}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Criticality</span>
                      <Badge variant="outline" className="text-xs">
                        {gisAssessment.context.user_preferences.mission_criticality}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Asset</span>
                      <Badge variant="outline" className="text-xs">
                        {gisAssessment.context.user_preferences.asset_sensitivity}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!gisAssessment && !checking && location.latitude === 0 && (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-3">
                <Globe className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Ready to Analyze</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Configure your mission parameters and click "Analyze Current Location" to get started
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
