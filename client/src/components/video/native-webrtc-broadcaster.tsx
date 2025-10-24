import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Camera, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface NativeWebRTCBroadcasterProps {
  orderId: string;
  onStreamStart: () => void;
  onStreamEnd: () => void;
}

export function NativeWebRTCBroadcaster({ orderId, onStreamStart, onStreamEnd }: NativeWebRTCBroadcasterProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [needsUserClick, setNeedsUserClick] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//localhost:5000/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('📡 Native WebRTC WebSocket connected');
      setIsConnected(true);
      setWs(socket);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 Received message:', message.type);
        
        if (message.type === 'viewer-joined') {
          handleViewerJoined();
        }
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setWs(null);
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleViewerJoined = async () => {
    if (!stream || !ws) {
      console.warn('⚠️ No stream or WebSocket available for viewer');
      return;
    }

    console.log('👥 Viewer joined, creating peer connection');

    // Create RTCPeerConnection with better configuration
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    });

    // Add stream tracks
    stream.getTracks().forEach(track => {
      console.log(`📡 Adding ${track.kind} track to peer connection`);
      pc.addTrack(track, stream);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        console.log('🧊 Sending ICE candidate');
        ws.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          streamId: orderId
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
    };

    try {
      // Create offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });
      
      await pc.setLocalDescription(offer);
      console.log('📤 Sending offer to viewer');
      
      // Send offer via WebSocket
      ws.send(JSON.stringify({
        type: 'webrtc-offer',
        offer: offer,
        streamId: orderId
      }));

      setPeerConnection(pc);
    } catch (error) {
      console.error('❌ Failed to create offer:', error);
      pc.close();
    }
  };

  const startBroadcast = async () => {
    try {
      setError(null);
      setNeedsUserClick(false);
      console.log('🎬 Starting native WebRTC broadcast');

      // Get user media with optimal settings
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 15, ideal: 30, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('MediaStream obtained:', {
        id: mediaStream.id,
        videoTracks: mediaStream.getVideoTracks().length,
        audioTracks: mediaStream.getAudioTracks().length
      });

      setStream(mediaStream);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.muted = true;
        video.playsInline = true;
        
        // Handle video events
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded');
        };

        video.onplay = () => {
          console.log('Video started playing');
        };

        video.onpause = () => {
          console.log('Video paused - requiring user click');
          setNeedsUserClick(true);
        };

        // Try to play
        try {
          await video.play();
          console.log('Video playing successfully');
          
          // Check if it got paused immediately
          setTimeout(() => {
            if (video.paused) {
              console.log('Video auto-paused - setting needsUserClick');
              setNeedsUserClick(true);
            }
          }, 1000);
          
        } catch (playError: any) {
          console.log('Autoplay blocked, requiring user interaction');
          setNeedsUserClick(true);
        }
        
        // Additional check for paused video - ENHANCED
        const checkVideoState = () => {
          if (video.paused && video.srcObject) {
            console.log('🚨 FORCE: Video is paused, setting needsUserClick = TRUE');
            setNeedsUserClick(true);
          } else if (video.paused && !video.srcObject) {
            console.log('🚨 CRITICAL: Video has no source and is paused, setting needsUserClick = TRUE');
            setNeedsUserClick(true);
          }
        };
        
        // Check immediately and repeatedly
        setTimeout(checkVideoState, 1000);
        setTimeout(checkVideoState, 2000);
        setTimeout(checkVideoState, 3000);
      }

      // Notify WebSocket that broadcaster is ready
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'broadcaster-ready',
          streamId: orderId
        }));
      }

      setIsStreaming(true);
      onStreamStart();
      console.log('Native WebRTC broadcast started!');

    } catch (err: any) {
      console.error('Broadcast start failed:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission required. Please allow access and try again.');
      } else {
        setError(`Start failed: ${err.message}`);
      }
    }
  };

  const stopBroadcast = () => {
    console.log('Stopping native WebRTC broadcast');
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setNeedsUserClick(false);
    // ONLY call onStreamEnd if user manually stopped
    // Don't auto-end when video has issues
    console.log('Broadcast stopped but NOT calling onStreamEnd to prevent status change');
    console.log('Native WebRTC broadcast stopped');
  };

  const manualStopBroadcast = () => {
    console.log('User manually stopping broadcast');
    stopBroadcast();
    onStreamEnd(); // Only call when user manually ends
  };

  const handleUserClick = async () => {
    console.log('User clicked to start video');
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        console.log('Video started after user click');
        setNeedsUserClick(false);
      } catch (error) {
        console.error('Failed to play after user click:', error);
        setError('Playback failed, please try again');
      }
    }
  };

  const switchCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isStreaming) {
      stopBroadcast();
      setTimeout(() => startBroadcast(), 1000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Live Stream Broadcaster
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
              {isConnected ? 'Connected' : 'Connecting'}
            </Badge>
            {isStreaming && (
              <Badge variant="destructive">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                Live
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-75">
                  Start Your Live Stream
                </p>
              </div>
            </div>
          )}

          {/* User Click Required Overlay */}
          {needsUserClick && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-600/90 z-50">
              <div className="text-center text-white space-y-4 p-6 bg-black/80 rounded-lg border-2 border-white">
                <div className="text-5xl animate-bounce">📹</div>
                <h3 className="text-xl font-bold">
                  Click to Start Playback
                </h3>
                <p className="text-sm opacity-90">
                  Browser requires user interaction to play video
                </p>
                <Button 
                  onClick={handleUserClick}
                  className="bg-white text-black hover:bg-gray-100 px-6 py-3"
                  data-testid="native-user-click-button"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play Now
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isStreaming ? (
            <Button 
              onClick={startBroadcast}
              disabled={!isConnected}
              className="flex-1"
              data-testid="native-start-broadcast-button"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Broadcasting
            </Button>
          ) : (
            <Button 
              onClick={manualStopBroadcast}
              variant="destructive"
              className="flex-1"
              data-testid="native-stop-broadcast-button"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Broadcasting
            </Button>
          )}
          
          <Button 
            onClick={switchCamera}
            variant="outline"
            disabled={!isConnected}
            data-testid="native-switch-camera-button"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>

        {/* Status */}
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            {`Camera: ${facingMode === 'user' ? 'Front' : 'Rear'}`}
          </p>
          
          {/* Debug Status */}
          <div className="text-xs space-y-1 mt-2 p-2 bg-blue-50 rounded border">
            <p className="font-semibold">Stream Status:</p>
            <p className={needsUserClick ? 'text-red-600 font-bold' : ''}>
              needsUserClick: {needsUserClick ? 'TRUE' : 'FALSE'}
              {videoRef.current?.paused && !needsUserClick && ' Status Error!'}
            </p>
            <p>isStreaming: {isStreaming ? 'TRUE' : 'FALSE'}</p>
            <p>isConnected: {isConnected ? 'TRUE' : 'FALSE'}</p>
            <p>videoPaused: {videoRef.current?.paused ? 'TRUE' : 'FALSE'}</p>
            <p>streamTracks: {stream?.getTracks().length || 0}</p>
            <p>hasVideo: {videoRef.current ? 'YES' : 'NO'}</p>
            <p>videoSrc: {videoRef.current?.srcObject ? 'YES' : 'NO'}</p>
            
            {/* Force Fix Button */}
            {videoRef.current?.paused && !needsUserClick && (
              <Button 
                onClick={() => {
                  console.log('Manual fix: Setting needsUserClick = TRUE');
                  setNeedsUserClick(true);
                }}
                size="sm"
                variant="destructive"
                className="mt-2"
              >
                Force Fix Status
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}