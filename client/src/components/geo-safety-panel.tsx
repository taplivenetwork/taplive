import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, AlertTriangle, Shield, Zap, Cloud, Clock, Globe, Fence } from "lucide-react";
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

interface WeatherAlert {
  id: string;
  weatherCondition: string;
  severity: string;
  message: string;
  startTime: string;
  endTime?: string;
}

interface GeofenceResult {
  isInside: boolean;
  geofenceId?: string;
  geofenceName?: string;
  action: 'block' | 'warn' | 'allow' | 'restrict_time';
  priority: number;
  message?: string;
}

interface TimezoneInfo {
  timezone: string;
  utcOffset: number;
  isDst: boolean;
  localTime: Date;
  isAllowedTime: boolean;
  restrictionReason?: string;
}

interface LocationCheckResult {
  location: { latitude: number; longitude: number };
  timestamp: string;
  timezone: TimezoneInfo;
  geofences: GeofenceResult[];
  decision: 'allow' | 'block' | 'warn' | 'restrict_time';
  messages: string[];
  isAllowed: boolean;
  hasTimeRestrictions: boolean;
}

export function GeoSafetyPanel() {
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [locationRisk, setLocationRisk] = useState<LocationRisk | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [locationCheck, setLocationCheck] = useState<LocationCheckResult | null>(null);
  const [checking, setChecking] = useState(false);

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
          // Use demo coordinates (San Francisco)
          const demoLocation = { latitude: 37.7749, longitude: -122.4194 };
          setLocation(demoLocation);
          checkLocationSafety(demoLocation);
        }
      );
    } else {
      // Use demo coordinates
      const demoLocation = { latitude: 37.7749, longitude: -122.4194 };
      setLocation(demoLocation);
      checkLocationSafety(demoLocation);
    }
  };

  const checkLocationSafety = async (coords: { latitude: number; longitude: number }) => {
    try {
      // Check traditional location risk
      const riskResponse = await fetch('/api/orders/check-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coords)
      });

      if (riskResponse.ok) {
        const riskResult = await riskResponse.json();
        setLocationRisk(riskResult.data);
      }

      // Check geofencing and timezone
      const geofenceResponse = await fetch('/api/check-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: new Date().toISOString()
        })
      });

      if (geofenceResponse.ok) {
        const geofenceResult = await geofenceResponse.json();
        setLocationCheck(geofenceResult.data);
      }
    } catch (error) {
      console.error('Failed to check location safety:', error);
    }
    setChecking(false);
  };

  const loadWeatherAlerts = async () => {
    try {
      const response = await fetch('/api/weather/alerts');
      if (response.ok) {
        const result = await response.json();
        setWeatherAlerts(result.data);
      }
    } catch (error) {
      console.error('Failed to load weather alerts:', error);
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe': return 'default';
      case 'low': return 'secondary';
      case 'medium': return 'outline';
      case 'high': return 'destructive';
      case 'extreme': return 'destructive';
      case 'forbidden': return 'destructive';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'minor': return <Cloud className="w-4 h-4" />;
      case 'moderate': return <Zap className="w-4 h-4" />;
      case 'severe': return <AlertTriangle className="w-4 h-4" />;
      case 'extreme': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Cloud className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 shadow-xl">
      <CardHeader className="border-b border-blue-100 dark:border-blue-900/50 pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <TranslatedText context="safety">Geo Safety & Risk Control System</TranslatedText>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Check */}
        <div className="space-y-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-md">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-semibold text-lg">
              <TranslatedText context="safety">Location Safety Check</TranslatedText>
            </span>
          </div>
          
          <Button 
            onClick={getCurrentLocation}
            disabled={checking}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
            data-testid="button-check-location"
          >
            {checking ? (
              <TranslatedText context="safety">Checking...</TranslatedText>
            ) : (
              <TranslatedText context="safety">Check Current Location Safety</TranslatedText>
            )}
          </Button>

          {location.latitude !== 0 && (
            <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md">
              <span className="font-medium"><TranslatedText context="safety">Position</TranslatedText>:</span> {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </div>
          )}

          {locationRisk && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/30 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="text-2xl">{locationRisk.riskInfo.icon}</span>
                <Badge variant={getRiskBadgeVariant(locationRisk.riskLevel)} className="text-sm px-3 py-1 font-semibold">
                  <TranslatedText context="safety">{locationRisk.riskInfo.label}</TranslatedText>
                </Badge>
              </div>

              {locationRisk.reasons.length > 0 && (
                <Alert className="border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold text-orange-900 dark:text-orange-200">
                        <TranslatedText context="safety">Risk Factors:</TranslatedText>
                      </div>
                      {locationRisk.reasons.map((reason, index) => (
                        <div key={index} className="text-sm">• {reason}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {locationRisk.restrictions.length > 0 && (
                <Alert className="border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20">
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold text-blue-900 dark:text-blue-200">
                        <TranslatedText context="safety">Safety Restrictions:</TranslatedText>
                      </div>
                      {locationRisk.restrictions.map((restriction, index) => (
                        <div key={index} className="text-sm">• {restriction}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {!locationRisk.canProceed && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <TranslatedText context="safety">Cannot create order at this location, please choose another location</TranslatedText>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Geofence and Timezone Check */}
        {locationCheck && (
          <div className="space-y-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-md">
                  <Fence className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-semibold text-lg">
                  <TranslatedText context="safety">Geofence & Timezone Check</TranslatedText>
                </span>
              </div>
              <Badge variant={locationCheck.isAllowed ? 'default' : 'destructive'} className="px-3 py-1 text-sm font-semibold">
                {locationCheck.isAllowed ? '✓ Allowed' : '✗ Restricted'}
              </Badge>
            </div>

            {locationCheck.messages.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {locationCheck.messages.map((msg, idx) => (
                      <div key={idx} className="text-sm">• {msg}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Timezone Info */}
            {locationCheck.timezone && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-900 dark:text-blue-200">Timezone Information</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/60 dark:bg-gray-800/60 p-2 rounded">
                    <span className="text-xs text-muted-foreground font-medium">Timezone:</span>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{locationCheck.timezone.timezone}</div>
                  </div>
                  <div className="bg-white/60 dark:bg-gray-800/60 p-2 rounded">
                    <span className="text-xs text-muted-foreground font-medium">UTC Offset:</span>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {locationCheck.timezone.utcOffset > 0 ? '+' : ''}{Math.floor(locationCheck.timezone.utcOffset / 60)}h
                    </div>
                  </div>
                </div>
                {!locationCheck.timezone.isAllowedTime && (
                  <div className="mt-2 text-orange-700 dark:text-orange-300 text-sm">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {locationCheck.timezone.restrictionReason}
                  </div>
                )}
              </div>
            )}

            {/* Active Geofences */}
            {locationCheck.geofences.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active Geofences:</div>
                {locationCheck.geofences.map((geofence, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{geofence.geofenceName}</div>
                      <div className="text-xs text-muted-foreground mt-1">Priority: {geofence.priority}</div>
                    </div>
                    <Badge variant={geofence.action === 'block' ? 'destructive' : 'secondary'} className="px-3 py-1 font-semibold">
                      {geofence.action}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Weather Alerts */}
        <div className="space-y-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-100 dark:bg-sky-900/50 rounded-md">
                <Cloud className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="font-semibold text-lg">
                <TranslatedText context="safety">Weather Alerts</TranslatedText>
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadWeatherAlerts}
              data-testid="button-load-weather"
              className="hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
            >
              <TranslatedText context="safety">Refresh</TranslatedText>
            </Button>
          </div>

          {weatherAlerts.length > 0 ? (
            <div className="space-y-3">
              {weatherAlerts.map((alert) => (
                <Alert key={alert.id} variant={alert.severity === 'extreme' ? 'destructive' : 'default'} className="border-l-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-base">
                        {alert.weatherCondition} <span className="text-xs uppercase px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{alert.severity}</span>
                      </div>
                      <div className="text-sm mt-2 text-gray-700 dark:text-gray-300">{alert.message}</div>
                      <div className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.startTime).toLocaleString()}
                        {alert.endTime && ` - ${new Date(alert.endTime).toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              <TranslatedText context="safety">No Weather Alerts</TranslatedText>
            </div>
          )}
        </div>

        {/* Safety Features Summary */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div className="text-base font-semibold text-green-900 dark:text-green-200">
              <TranslatedText context="safety">Safety Features</TranslatedText>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <div>• <TranslatedText context="safety">Automatic detection of military bases and restricted zones</TranslatedText></div>
            <div>• <TranslatedText context="safety">Extreme environment risk assessment</TranslatedText></div>
            <div>• <TranslatedText context="safety">Weather disaster warning system</TranslatedText></div>
            <div>• <TranslatedText context="safety">Content and voice safety monitoring</TranslatedText></div>
            <div>• <TranslatedText context="safety">Illegal activity keyword detection</TranslatedText></div>
            <div>• <TranslatedText context="safety">Geofence boundary detection</TranslatedText></div>
            <div>• <TranslatedText context="safety">Global timezone automatic recognition</TranslatedText></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}