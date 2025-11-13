import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, AlertTriangle, Shield, Zap, Cloud, Clock, Globe, Fence } from "lucide-react";

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
    <Card className="w-full max-w-2xl mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Geographic Safety & Risk Control System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Check */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">
              Location Safety Check
            </span>
          </div>
          
          <Button 
            onClick={getCurrentLocation}
            disabled={checking}
            className="w-full"
            data-testid="button-check-location"
          >
            {checking ? (
              "Checking..."
            ) : (
              "Check Current Location Safety"
            )}
          </Button>

          {location.latitude !== 0 && (
            <div className="text-sm text-muted-foreground">
              Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </div>
          )}

          {locationRisk && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>{locationRisk.riskInfo.icon}</span>
                <Badge variant={getRiskBadgeVariant(locationRisk.riskLevel)}>
                  {locationRisk.riskInfo.label}
                </Badge>
              </div>

              {locationRisk.reasons.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">
                        Risk Factors:
                      </div>
                      {locationRisk.reasons.map((reason, index) => (
                        <div key={index} className="text-sm">• {reason}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {locationRisk.restrictions.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">
                        Safety Restrictions:
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
                    Cannot create order at this location, please select a different location
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Geofence and Timezone Check */}
        {locationCheck && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Fence className="w-4 h-4" />
              <span className="font-medium">
                Geofence & Timezone Check
              </span>
              <Badge variant={locationCheck.isAllowed ? 'default' : 'destructive'}>
                {locationCheck.isAllowed ? 'Allowed' : 'Restricted'}
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
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-300">Timezone Info</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timezone:</span>
                    <div className="font-medium">{locationCheck.timezone.timezone}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">UTC Offset:</span>
                    <div className="font-medium">
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
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Active Geofences:</div>
                {locationCheck.geofences.map((geofence, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <div className="font-medium text-sm">{geofence.geofenceName}</div>
                      <div className="text-xs text-muted-foreground">Priority: {geofence.priority}</div>
                    </div>
                    <Badge variant={geofence.action === 'block' ? 'destructive' : 'secondary'}>
                      {geofence.action}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Weather Alerts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              <span className="font-medium">
                Weather Alerts
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadWeatherAlerts}
              data-testid="button-load-weather"
            >
              Refresh
            </Button>
          </div>

          {weatherAlerts.length > 0 ? (
            <div className="space-y-2">
              {weatherAlerts.map((alert) => (
                <Alert key={alert.id} variant={alert.severity === 'extreme' ? 'destructive' : 'default'}>
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="font-medium">
                        {alert.weatherCondition} - {alert.severity}
                      </div>
                      <div className="text-sm mt-1">{alert.message}</div>
                      <div className="text-xs text-muted-foreground mt-2">
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
              No weather alerts
            </div>
          )}
        </div>

        {/* Safety Features Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm font-medium mb-2">
            Safety Features
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>• Automatic detection of military bases and restricted areas</div>
            <div>• Extreme environment risk assessment</div>
            <div>• Weather disaster warning system</div>
            <div>• Content and voice safety monitoring</div>
            <div>• Illegal activity keyword detection</div>
            <div>• Geofence boundary detection</div>
            <div>• Global timezone auto-recognition</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}