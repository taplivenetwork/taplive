import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Send,
  Radio,
  Activity,
  CheckCircle,
  Clock,
  MapPin,
  Loader2,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  Wifi,
  WifiOff,
  Play,
  Pause,
  Globe,
  Users,
  Eye,
  Timer,
} from "lucide-react";
import { TranslatedText } from "@/components/translated-text";

// Simulated live streams with NYC and global locations
const LIVE_STREAMS = [
  { id: "nyc-times-sq", name: "Times Square NYC", lat: 40.758, lng: -73.9855, viewers: 1247, status: "live" as const },
  { id: "nyc-central-park", name: "Central Park NYC", lat: 40.7829, lng: -73.9654, viewers: 892, status: "live" as const },
  { id: "cairo-tahrir", name: "Tahrir Square Cairo", lat: 30.0444, lng: 31.2357, viewers: 634, status: "live" as const },
  { id: "dubai-marina", name: "Dubai Marina", lat: 25.0805, lng: 55.1403, viewers: 428, status: "buffering" as const },
  { id: "tokyo-shibuya", name: "Shibuya Crossing Tokyo", lat: 35.6595, lng: 139.7004, viewers: 1856, status: "live" as const },
];

interface StreamMetrics {
  streamId: string;
  latency: number;
  bitrate: number;
  packetLoss: number;
  bufferHealth: number;
  timestamp: Date;
}

interface AIAnalysisResult {
  presence_confidence: number;
  threat_level: string;
  recommended_action: string;
  key_observations: string[];
  context_summary: string;
  stream_quality: string;
  latency_assessment: string;
}

interface ConfluentEvent {
  id: string;
  topic: string;
  partition: number;
  offset: number;
  timestamp: Date;
  payload: {
    stream_id: string;
    event_type: string;
    location: { lat: number; lng: number };
  };
  status: "pending" | "processing" | "analyzed";
}

// Declare Leaflet on window
declare global {
  interface Window {
    L: any;
  }
}

export default function AICommandCenter() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedStream, setSelectedStream] = useState<typeof LIVE_STREAMS[0] | null>(null);
  const [streamMetrics, setStreamMetrics] = useState<Map<string, StreamMetrics>>(new Map());
  const [confluentEvents, setConfluentEvents] = useState<ConfluentEvent[]>([]);
  const [analysisResults, setAnalysisResults] = useState<Map<string, AIAnalysisResult>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [eventThroughput, setEventThroughput] = useState(0);
  const [totalEventsProcessed, setTotalEventsProcessed] = useState(0);
  
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    {
      role: "ai",
      content: "🎯 Welcome to TapLive AI Command Center! I'm monitoring live streams across NYC and globally. I can analyze stream quality, detect anomalies, and provide real-time insights powered by Google Cloud AI and Confluent streaming.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (!window.L || !mapRef.current || mapInstanceRef.current) return;

      // Initialize map centered on Atlantic (to show NYC and global)
      const map = window.L.map(mapRef.current, {
        center: [30, 0],
        zoom: 2,
        zoomControl: false,
        attributionControl: false,
      });
      mapInstanceRef.current = map;

      // Light map tiles (CartoDB Voyager) - matches the app's light theme
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
      }).addTo(map);

      // Add zoom control to top-right
      window.L.control.zoom({ position: 'topright' }).addTo(map);

      // Add stream markers
      LIVE_STREAMS.forEach((stream) => {
        const isLive = stream.status === 'live';
        const color = isLive ? '#22c55e' : '#f59e0b';
        
        const icon = window.L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 rounded-full ${isLive ? 'animate-ping' : ''}" style="background: ${color}30;"></div>
              <div class="w-4 h-4 rounded-full border-2 border-white shadow-lg" style="background: ${color};"></div>
            </div>
          `,
          className: 'custom-stream-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = window.L.marker([stream.lat, stream.lng], { icon }).addTo(map);
        
        marker.bindTooltip(`
          <div class="font-semibold text-slate-900">${stream.name}</div>
          <div class="text-xs text-slate-600">${stream.viewers.toLocaleString()} viewers</div>
        `, { 
          permanent: false,
          className: 'custom-tooltip'
        });

        marker.on('click', () => {
          setSelectedStream(stream);
        });

        markersRef.current.set(stream.id, marker);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker animations based on monitoring state
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    LIVE_STREAMS.forEach((stream) => {
      const marker = markersRef.current.get(stream.id);
      if (!marker) return;

      const isLive = stream.status === 'live';
      const color = isLive ? '#22c55e' : '#f59e0b';
      const isSelected = selectedStream?.id === stream.id;
      
      const icon = window.L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full ${isMonitoring && isLive ? 'animate-ping' : ''}" style="background: ${color}30;"></div>
            <div class="w-${isSelected ? '6' : '4'} h-${isSelected ? '6' : '4'} rounded-full border-2 ${isSelected ? 'border-blue-500' : 'border-white'} shadow-lg" style="background: ${color};"></div>
          </div>
        `,
        className: 'custom-stream-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      
      marker.setIcon(icon);
    });
  }, [isMonitoring, selectedStream]);

  // Simulate Confluent stream events
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      // Generate metrics for each stream
      LIVE_STREAMS.forEach((stream) => {
        const baseLatency = stream.id.includes("nyc") ? 45 : stream.id.includes("tokyo") ? 180 : 120;
        const newMetrics: StreamMetrics = {
          streamId: stream.id,
          latency: baseLatency + Math.random() * 50 - 25,
          bitrate: 2500 + Math.random() * 1500,
          packetLoss: Math.random() * 2,
          bufferHealth: 85 + Math.random() * 15,
          timestamp: new Date(),
        };
        setStreamMetrics((prev) => new Map(prev).set(stream.id, newMetrics));
      });

      // Create a Confluent-style event
      const randomStream = LIVE_STREAMS[Math.floor(Math.random() * LIVE_STREAMS.length)];
      const newEvent: ConfluentEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        topic: "taplive.stream.signals",
        partition: Math.floor(Math.random() * 6),
        offset: totalEventsProcessed + confluentEvents.length,
        timestamp: new Date(),
        payload: {
          stream_id: randomStream.id,
          event_type: ["heartbeat", "quality_change", "viewer_spike", "anomaly_detected"][Math.floor(Math.random() * 4)],
          location: { lat: randomStream.lat, lng: randomStream.lng },
        },
        status: "pending",
      };

      setConfluentEvents((prev) => [newEvent, ...prev].slice(0, 15));
      setTotalEventsProcessed((prev) => prev + 1);
      setEventThroughput((prev) => Math.min(prev + 1, 50));

      // Auto-analyze high-priority events
      if (newEvent.payload.event_type === "anomaly_detected") {
        analyzeEvent(newEvent);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isMonitoring, totalEventsProcessed, confluentEvents.length]);

  // Signal visualization (waveform) - Light theme version
  useEffect(() => {
    if (!isMonitoring || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let offset = 0;
    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear with light background
      ctx.fillStyle = "rgba(248, 250, 252, 0.3)";
      ctx.fillRect(0, 0, width, height);

      // Draw waveforms with blue/purple theme colors
      const colors = ["hsl(221, 83%, 53%)", "hsl(250, 85%, 60%)", "hsl(280, 80%, 60%)", "hsl(200, 90%, 50%)"];
      colors.forEach((color, index) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const amplitude = 12 + index * 4;
        const frequency = 0.015 + index * 0.005;
        const phaseOffset = (offset + index * 50) * 0.03;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * frequency + phaseOffset) * amplitude * (0.8 + Math.random() * 0.4);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      offset++;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isMonitoring]);

  const analyzeEvent = async (event: ConfluentEvent) => {
    setIsAnalyzing(true);
    setConfluentEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, status: "processing" } : e)));

    try {
      const stream = LIVE_STREAMS.find((s) => s.id === event.payload.stream_id);
      const metrics = streamMetrics.get(event.payload.stream_id);

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId: event.id,
          streamId: event.payload.stream_id,
          streamName: stream?.name || "Unknown",
          eventType: event.payload.event_type,
          location: event.payload.location,
          latency: metrics?.latency || 100,
          bitrate: metrics?.bitrate || 2500,
          packetLoss: metrics?.packetLoss || 0,
          timestamp: event.timestamp,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const analysis = result.data as AIAnalysisResult;
        setAnalysisResults((prev) => new Map(prev).set(event.payload.stream_id, analysis));
        setConfluentEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, status: "analyzed" } : e)));
      }
    } catch {
      // Mock analysis if API fails
      const mockAnalysis: AIAnalysisResult = {
        presence_confidence: 0.85 + Math.random() * 0.15,
        threat_level: Math.random() > 0.8 ? "medium" : "low",
        recommended_action: "Continue monitoring",
        key_observations: ["Stream latency within acceptable range", "Viewer engagement stable", "No anomalies detected"],
        context_summary: "Stream operating normally with good quality metrics.",
        stream_quality: "Excellent",
        latency_assessment: "Low latency connection established",
      };
      setAnalysisResults((prev) => new Map(prev).set(event.payload.stream_id, mockAnalysis));
      setConfluentEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, status: "analyzed" } : e)));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    setTimeout(() => {
      let response = "";
      const lowerMsg = userMessage.toLowerCase();
      
      if (lowerMsg.includes("nyc") || lowerMsg.includes("new york")) {
        const nycStreams = LIVE_STREAMS.filter((s) => s.id.includes("nyc"));
        const avgLatency = nycStreams.reduce((acc, s) => {
          const m = streamMetrics.get(s.id);
          return acc + (m?.latency || 50);
        }, 0) / nycStreams.length;
        response = `📍 NYC Stream Status:\n- ${nycStreams.length} active streams\n- Average latency: ${avgLatency.toFixed(1)}ms\n- Total viewers: ${nycStreams.reduce((a, s) => a + s.viewers, 0).toLocaleString()}\n\nAll NYC streams performing optimally.`;
      } else if (lowerMsg.includes("latency") || lowerMsg.includes("delay")) {
        const allLatencies = Array.from(streamMetrics.values()).map((m) => m.latency);
        const avgLatency = allLatencies.reduce((a, b) => a + b, 0) / (allLatencies.length || 1);
        response = `⚡ Global Latency Report:\n- Average: ${avgLatency.toFixed(1)}ms\n- Best: NYC streams (45-70ms)\n- Highest: Tokyo/Asia (150-200ms)\n\nAll streams within acceptable thresholds.`;
      } else if (lowerMsg.includes("confluent") || lowerMsg.includes("stream")) {
        response = `📊 Confluent Streaming Stats:\n- Topic: taplive.stream.signals\n- Partitions: 6\n- Events processed: ${totalEventsProcessed.toLocaleString()}\n- Throughput: ~${eventThroughput} events/min`;
      } else {
        response = `Currently monitoring ${LIVE_STREAMS.length} live streams with ${totalEventsProcessed} events processed. Ask about NYC, latency, or Confluent stats.`;
      }
      setChatMessages((prev) => [...prev, { role: "ai", content: response }]);
    }, 800);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <TranslatedText context="ai">AI Command Center</TranslatedText>
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Google Cloud AI + Confluent
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            <TranslatedText context="ai">Real-time stream monitoring with AI-powered analysis</TranslatedText>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-foreground text-sm">{LIVE_STREAMS.length} Streams</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-foreground text-sm">{LIVE_STREAMS.reduce((a, s) => a + s.viewers, 0).toLocaleString()} Viewers</span>
          </div>
          <Badge variant={isMonitoring ? "default" : "secondary"} className={isMonitoring ? "bg-green-500 text-white animate-pulse" : ""}>
            <Radio className={`w-3 h-3 mr-1 ${isMonitoring ? "animate-ping" : ""}`} />
            {isMonitoring ? "LIVE" : "OFFLINE"}
          </Badge>
          <Button 
            onClick={() => setIsMonitoring(!isMonitoring)} 
            className={isMonitoring ? "bg-red-500 hover:bg-red-600 text-white" : ""}
          >
            {isMonitoring ? <><Pause className="w-4 h-4 mr-2" />Stop</> : <><Play className="w-4 h-4 mr-2" />Start Monitoring</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Map */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <TranslatedText context="ai">Global Stream Network</TranslatedText>
                </h2>
                <div className="flex items-center gap-4 text-xs">
                  {[["Live", "bg-green-500"], ["Buffering", "bg-yellow-500"]].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color}`}></div>
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div ref={mapRef} className="h-64 lg:h-80 w-full bg-slate-100" style={{ zIndex: 1 }} />
            </CardContent>
          </Card>

          {/* Waveform Monitor */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <TranslatedText context="ai">Multi-Stream Signal Monitor</TranslatedText>
                </h2>
                <div className="flex items-center gap-4">
                  {[["NYC", "bg-blue-500"], ["Cairo", "bg-purple-500"], ["Dubai", "bg-indigo-500"], ["Tokyo", "bg-sky-500"]].map(([name, color]) => (
                    <div key={name} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color}`}></div>
                      <span className="text-xs text-muted-foreground">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <canvas ref={canvasRef} width={800} height={100} className="w-full h-24 bg-slate-50 rounded-lg border border-border" />
            </CardContent>
          </Card>

          {/* Live Streams Grid */}
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <TranslatedText context="ai">Live Streams - Latency Monitor</TranslatedText>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {LIVE_STREAMS.map((stream) => {
                  const metrics = streamMetrics.get(stream.id);
                  const analysis = analysisResults.get(stream.id);
                  const isSelected = selectedStream?.id === stream.id;
                  return (
                    <div 
                      key={stream.id} 
                      onClick={() => setSelectedStream(stream)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? "bg-primary/5 border-primary shadow-sm" : "bg-muted/30 border-border hover:border-primary/50"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {stream.status === "live" ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-yellow-500" />}
                          <span className="text-foreground font-medium text-sm truncate">{stream.name}</span>
                        </div>
                        <Badge variant={stream.status === "live" ? "default" : "secondary"} className={`text-xs ${stream.status === "live" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}`}>
                          {stream.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1"><Timer className="w-3 h-3 text-primary" /><span className="text-muted-foreground">{metrics ? `${metrics.latency.toFixed(0)}ms` : "--"}</span></div>
                        <div className="flex items-center gap-1"><Users className="w-3 h-3 text-primary" /><span className="text-muted-foreground">{stream.viewers.toLocaleString()}</span></div>
                      </div>
                      {analysis && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">AI Confidence</span>
                            <span className="text-xs text-green-600 font-medium">{(analysis.presence_confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Confluent Events */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <TranslatedText context="ai">Confluent Stream Events</TranslatedText>
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Topic: <code className="text-primary bg-muted px-1.5 py-0.5 rounded">taplive.stream.signals</code></span>
                  <Badge variant="outline">{totalEventsProcessed.toLocaleString()} events</Badge>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {confluentEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">Start monitoring to see Confluent stream events...</p>
                ) : (
                  confluentEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm border border-border">
                      <div className="flex items-center gap-3">
                        {event.status === "analyzed" ? <CheckCircle className="w-4 h-4 text-green-500" /> : event.status === "processing" ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                        <div><span className="text-foreground">{event.payload.event_type.replace("_", " ")}</span><span className="text-muted-foreground ml-2">• P{event.partition}</span></div>
                      </div>
                      <span className="text-muted-foreground text-xs">{event.timestamp.toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <TranslatedText context="ai">Google Cloud AI Analysis</TranslatedText>
              </h2>
              {selectedStream ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-border">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-medium">{selectedStream.name}</span>
                  </div>
                  {analysisResults.get(selectedStream.id) ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">Presence Confidence</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${(analysisResults.get(selectedStream.id)?.presence_confidence || 0) * 100}%` }} />
                          </div>
                          <span className="text-foreground font-medium text-sm">{((analysisResults.get(selectedStream.id)?.presence_confidence || 0) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div><span className="text-muted-foreground text-sm">Stream Quality</span><p className="text-green-600 mt-1 text-sm font-medium">{analysisResults.get(selectedStream.id)?.stream_quality}</p></div>
                      <div><span className="text-muted-foreground text-sm">Latency Assessment</span><p className="text-primary mt-1 text-sm">{analysisResults.get(selectedStream.id)?.latency_assessment}</p></div>
                      <div>
                        <span className="text-muted-foreground text-sm">Key Observations</span>
                        <ul className="mt-1 space-y-1">{analysisResults.get(selectedStream.id)?.key_observations.map((obs, i) => (<li key={i} className="text-foreground text-xs flex items-start gap-2"><TrendingUp className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />{obs}</li>))}</ul>
                      </div>
                      <Button onClick={() => { const event = confluentEvents.find((e) => e.payload.stream_id === selectedStream.id); if (event) analyzeEvent(event); else { const mockEvent: ConfluentEvent = { id: `manual_${Date.now()}`, topic: "taplive.stream.signals", partition: 0, offset: 0, timestamp: new Date(), payload: { stream_id: selectedStream.id, event_type: "manual_analysis", location: { lat: selectedStream.lat, lng: selectedStream.lng } }, status: "pending" }; analyzeEvent(mockEvent); } }} disabled={isAnalyzing} className="w-full">
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}Re-analyze with AI
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Brain className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm mb-3">No analysis yet</p>
                      <Button onClick={() => { const mockEvent: ConfluentEvent = { id: `manual_${Date.now()}`, topic: "taplive.stream.signals", partition: 0, offset: 0, timestamp: new Date(), payload: { stream_id: selectedStream.id, event_type: "manual_analysis", location: { lat: selectedStream.lat, lng: selectedStream.lng } }, status: "pending" }; analyzeEvent(mockEvent); }} disabled={isAnalyzing} size="sm" variant="outline">Analyze Stream</Button>
                    </div>
                  )}
                </div>
              ) : (<p className="text-muted-foreground text-center py-8">Select a stream to view AI analysis</p>)}
            </CardContent>
          </Card>

          <Card className="h-72 flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <TranslatedText context="ai">AI Assistant</TranslatedText>
              </h2>
              <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                {chatMessages.map((msg, i) => (<div key={i} className={`p-2 rounded-lg text-sm ${msg.role === "ai" ? "bg-muted text-foreground border border-border" : "bg-primary/10 text-foreground ml-4 border border-primary/20"}`}><p className="whitespace-pre-wrap">{msg.content}</p></div>))}
              </div>
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about NYC latency, streams..." className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                <Button type="submit" size="sm"><Send className="w-4 h-4" /></Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
