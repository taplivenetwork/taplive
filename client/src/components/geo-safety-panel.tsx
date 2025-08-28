import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, AlertTriangle, Shield, Zap, Cloud } from "lucide-react";
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

export function GeoSafetyPanel() {
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [locationRisk, setLocationRisk] = useState<LocationRisk | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
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
      const response = await fetch('/api/orders/check-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coords)
      });

      if (response.ok) {
        const result = await response.json();
        setLocationRisk(result.data);
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
          <TranslatedText>地理安全与风控系统</TranslatedText>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Check */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">
              <TranslatedText>位置安全检查</TranslatedText>
            </span>
          </div>
          
          <Button 
            onClick={getCurrentLocation}
            disabled={checking}
            className="w-full"
            data-testid="button-check-location"
          >
            {checking ? (
              <TranslatedText>检查中...</TranslatedText>
            ) : (
              <TranslatedText>检查当前位置安全性</TranslatedText>
            )}
          </Button>

          {location.latitude !== 0 && (
            <div className="text-sm text-muted-foreground">
              <TranslatedText>位置</TranslatedText>: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </div>
          )}

          {locationRisk && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>{locationRisk.riskInfo.icon}</span>
                <Badge variant={getRiskBadgeVariant(locationRisk.riskLevel)}>
                  <TranslatedText>{locationRisk.riskInfo.label}</TranslatedText>
                </Badge>
              </div>

              {locationRisk.reasons.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">
                        <TranslatedText>风险因素：</TranslatedText>
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
                        <TranslatedText>安全限制：</TranslatedText>
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
                    <TranslatedText>此位置无法创建订单，请选择其他位置</TranslatedText>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Weather Alerts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              <span className="font-medium">
                <TranslatedText>天气预警</TranslatedText>
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadWeatherAlerts}
              data-testid="button-load-weather"
            >
              <TranslatedText>刷新</TranslatedText>
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
              <TranslatedText>暂无天气预警</TranslatedText>
            </div>
          )}
        </div>

        {/* Safety Features Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm font-medium mb-2">
            <TranslatedText>安全功能</TranslatedText>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>• <TranslatedText>军事基地和禁区自动检测</TranslatedText></div>
            <div>• <TranslatedText>极端环境风险评估</TranslatedText></div>
            <div>• <TranslatedText>天气灾害预警系统</TranslatedText></div>
            <div>• <TranslatedText>内容和语音安全监控</TranslatedText></div>
            <div>• <TranslatedText>违法活动关键词检测</TranslatedText></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}