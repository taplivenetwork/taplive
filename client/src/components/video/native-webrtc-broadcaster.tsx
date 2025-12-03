import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/translated-text';
import { Play, Square, Camera, Wifi, WifiOff, RefreshCw, Users } from 'lucide-react';

interface NativeWebRTCBroadcasterProps {
  orderId: string;
  onStreamStart: () => void;
  onStreamEnd: () => void;
  canStartBroadcast?: boolean;
}

export function NativeWebRTCBroadcaster({ orderId, onStreamStart, onStreamEnd, canStartBroadcast = true }: NativeWebRTCBroadcasterProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [needsUserClick, setNeedsUserClick] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // WebSocket connection
  useEffect(() => {
    // Connect directly to backend server on port 5000
    const wsUrl = 'ws://localhost:5000/ws';
    console.log('[Broadcaster] Connecting to WebSocket:', wsUrl);
    
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('[Broadcaster] ✅ WebSocket connected successfully!');
      setIsConnected(true);
      setWs(socket);
      wsRef.current = socket;
    };

    socket.onerror = (error) => {
      console.error('[Broadcaster] ❌ WebSocket error:', error);
      setError('WebSocket connection failed. Please refresh the page.');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Broadcaster] Received message:', message.type);
        
        if (message.type === 'viewer-joined') {
          console.log('[Broadcaster] 👤 Viewer joined:', message.viewerId);
          handleViewerJoined(message.viewerId);
        } else if (message.type === 'viewer-count') {
          console.log('[Broadcaster] 👥 Viewer count:', message.count);
          setViewerCount(message.count);
        } else if (message.type === 'webrtc-answer') {
          console.log(`[Broadcaster] Received WebRTC answer from viewer ${message.viewerId}`);
          const pc = peerConnectionsRef.current.get(message.viewerId);
          if (pc && message.answer) {
            // Check if we can accept the answer
            if (pc.signalingState === 'have-local-offer') {
              pc.setRemoteDescription(new RTCSessionDescription(message.answer))
                .then(() => console.log(`[Broadcaster] Remote description set for ${message.viewerId}`))
                .catch(err => console.error(`[Broadcaster] Failed to set remote description for ${message.viewerId}:`, err));
            } else {
              console.log(`[Broadcaster] Ignoring answer from ${message.viewerId} - wrong signaling state:`, pc.signalingState);
            }
          } else {
            console.warn(`[Broadcaster] No peer connection found for viewer ${message.viewerId}`);
          }
        } else if (message.type === 'webrtc-ice-candidate' || message.type === 'ice-candidate') {
          console.log(`[Broadcaster] Received ICE candidate from viewer ${message.viewerId}`);
          const pc = peerConnectionsRef.current.get(message.viewerId);
          if (pc && message.candidate && pc.signalingState !== 'closed' && pc.remoteDescription) {
            pc.addIceCandidate(new RTCIceCandidate(message.candidate))
              .then(() => console.log(`[Broadcaster] ICE candidate added for ${message.viewerId}`))
              .catch(err => console.error(`[Broadcaster] Failed to add ICE candidate for ${message.viewerId}:`, err));
          } else {
            console.log(`[Broadcaster] Skipping ICE candidate for ${message.viewerId} - connection not ready or closed`);
          }
        }
      } catch (error) {
        console.error('[Broadcaster] Message parsing error:', error);
      }
    };

    socket.onclose = (event) => {
      console.log('[Broadcaster] WebSocket disconnected', { code: event.code, reason: event.reason });
      setIsConnected(false);
      setWs(null);
      wsRef.current = null;
      
      if (event.code === 1006) {
        setError('WebSocket connection lost. Backend server may not be running.');
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleViewerJoined = async (viewerId: string) => {
    const currentStream = streamRef.current;
    const currentWs = wsRef.current;
    
    if (!currentStream || !currentWs) {
      console.warn('[Broadcaster] No stream or WebSocket available for viewer');
      return;
    }

    // Create unique ID for this viewer
    console.log(`[Broadcaster] Viewer joined: ${viewerId}, creating new peer connection`);

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
    currentStream.getTracks().forEach(track => {
      console.log(`[Broadcaster] Adding ${track.kind} track to peer connection`);
      pc.addTrack(track, currentStream);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && currentWs.readyState === WebSocket.OPEN) {
        console.log(`[Broadcaster] Sending ICE candidate for ${viewerId}`);
        currentWs.send(JSON.stringify({
          type: 'webrtc-ice-candidate',
          candidate: event.candidate,
          streamId: orderId,
          viewerId
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[Broadcaster] Connection state:', pc.connectionState);
    };

    try {
      // Create offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });
      
      await pc.setLocalDescription(offer);
      console.log(`[Broadcaster] Sending offer to ${viewerId}`);
      
      // Send offer via WebSocket
      currentWs.send(JSON.stringify({
        type: 'webrtc-offer',
        offer: offer,
        streamId: orderId,
        viewerId
      }));

      // Store this peer connection
      peerConnectionsRef.current.set(viewerId, pc);
    } catch (error) {
      console.error('[Broadcaster] Failed to create offer:', error);
      pc.close();
    }
  };

  const startBroadcast = async () => {
    try {
      setError(null);
      setNeedsUserClick(false);
      console.log('[Broadcaster] Starting native WebRTC broadcast');

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
      console.log('[Broadcaster] MediaStream obtained:', {
        id: mediaStream.id,
        videoTracks: mediaStream.getVideoTracks().length,
        audioTracks: mediaStream.getAudioTracks().length
      });

      setStream(mediaStream);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.muted = true;
        video.playsInline = true;
        
        // Handle video events
        video.onloadedmetadata = () => {
          console.log('[Broadcaster] Video metadata loaded');
        };

        video.onplay = () => {
          console.log('[Broadcaster] Video started playing');
        };

        video.onpause = () => {
          console.log('[Broadcaster] Video paused - requiring user click');
          setNeedsUserClick(true);
        };

        // Try to play
        try {
          await video.play();
          console.log('[Broadcaster] Video playing successfully');
          
          // Check if it got paused immediately
          setTimeout(() => {
            if (video.paused) {
              console.log('[Broadcaster] Video auto-paused - setting needsUserClick');
              setNeedsUserClick(true);
            }
          }, 1000);
          
        } catch (playError: any) {
          console.log('[Broadcaster] Autoplay blocked, requiring user interaction');
          setNeedsUserClick(true);
        }
        
        // Additional check for paused video - ENHANCED
        const checkVideoState = () => {
          if (video.paused && video.srcObject) {
            console.log('[Broadcaster] FORCE: Video is paused, setting needsUserClick = TRUE');
            setNeedsUserClick(true);
          } else if (video.paused && !video.srcObject) {
            console.log('[Broadcaster] CRITICAL: Video has no source and is paused, setting needsUserClick = TRUE');
            setNeedsUserClick(true);
          }
        };
        
        // Check immediately and repeatedly
        setTimeout(checkVideoState, 1000);
        setTimeout(checkVideoState, 2000);
        setTimeout(checkVideoState, 3000);
      }

      // Notify WebSocket that broadcaster is ready
      const currentWs = wsRef.current;
      if (currentWs && currentWs.readyState === WebSocket.OPEN) {
        currentWs.send(JSON.stringify({
          type: 'broadcaster-ready',
          streamId: orderId
        }));
      }

      setIsStreaming(true);
      onStreamStart();
      console.log('[Broadcaster] Native WebRTC broadcast started!');

    } catch (err: any) {
      console.error('Broadcast start failed:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission required. Please allow access and try again.');
      } else {
        setError(`Failed to start: ${err.message}`);
      }
    }
  };

  const stopBroadcast = () => {
    console.log('[Broadcaster] Stopping native WebRTC broadcast');
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      streamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc, viewerId) => {
      console.log(`[Broadcaster] Closing connection for ${viewerId}`);
      pc.close();
    });
    peerConnectionsRef.current.clear();

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setNeedsUserClick(false);
    // ONLY call onStreamEnd if user manually stopped
    // Don't auto-end when video has issues
    console.log('[Broadcaster] Broadcast stopped but NOT calling onStreamEnd to prevent status change');
    console.log('[Broadcaster] Native WebRTC broadcast stopped');
  };

  const manualStopBroadcast = () => {
    console.log('[Broadcaster] User manually stopping broadcast');
    stopBroadcast();
    onStreamEnd(); // Only call when user manually ends
  };

  const handleUserClick = async () => {
    console.log('[Broadcaster] User clicked to start video');
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        console.log('[Broadcaster] Video started after user click');
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
          <TranslatedText context="broadcaster">原生WebRTC直播</TranslatedText>
          <div className="flex items-center gap-2">
            {isStreaming && viewerCount > 0 && (
              <Badge variant="outline" className="gap-1 flex items-center">
                <Users className="w-3 h-3" />
                {viewerCount} <TranslatedText context="broadcaster">viewers</TranslatedText>
              </Badge>
            )}
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
              <TranslatedText context="broadcaster">{isConnected ? '已连接' : '连接中'}</TranslatedText>
            </Badge>
            {isStreaming && (
              <Badge variant="destructive">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                <TranslatedText context="broadcaster">直播中</TranslatedText>
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
                  <TranslatedText context="broadcaster">原生WebRTC直播技术</TranslatedText>
                </p>
              </div>
            </div>
          )}

          {/* User Click Required Overlay */}
          {needsUserClick && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-600/90 z-50">
              <div className="text-center text-white space-y-4 p-6 bg-black/80 rounded-lg border-2 border-white">
                <Play className="w-16 h-16 mx-auto animate-bounce" />
                <h3 className="text-xl font-bold">
                  <TranslatedText context="broadcaster">Click to Start Playback</TranslatedText>
                </h3>
                <p className="text-sm opacity-90">
                  <TranslatedText context="broadcaster">Browser requires user interaction to play video</TranslatedText>
                </p>
                <Button 
                  onClick={handleUserClick}
                  className="bg-white text-black hover:bg-gray-100 px-6 py-3"
                  data-testid="native-user-click-button"
                >
                  <Play className="w-4 h-4 mr-2" />
                  <TranslatedText context="broadcaster">Play Now</TranslatedText>
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
            <div className="flex-1">
              <Button 
                onClick={startBroadcast}
                disabled={!isConnected || !canStartBroadcast}
                className="w-full"
                data-testid="native-start-broadcast-button"
              >
                <Play className="w-4 h-4 mr-2" />
                <TranslatedText context="broadcaster">开始原生直播</TranslatedText>
              </Button>
              {!isConnected && (
                <p className="text-xs text-orange-600 mt-1 text-center">
                  <TranslatedText context="broadcaster">Connecting to WebSocket server...</TranslatedText>
                </p>
              )}
              {isConnected && !canStartBroadcast && (
                <p className="text-xs text-orange-600 mt-1 text-center">
                  <TranslatedText context="broadcaster">⏰ Waiting for scheduled time...</TranslatedText>
                </p>
              )}
            </div>
          ) : (
            <Button 
              onClick={manualStopBroadcast}
              variant="destructive"
              className="flex-1"
              data-testid="native-stop-broadcast-button"
            >
              <Square className="w-4 h-4 mr-2" />
              <TranslatedText context="broadcaster">结束直播</TranslatedText>
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
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              <TranslatedText context="broadcaster">{`摄像头: ${facingMode === 'user' ? '前置' : '后置'}`}</TranslatedText>
            </p>
          </div>
          
          {/* Debug Status - Futuristic Design */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 border border-slate-700/50 shadow-xl">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
            
            {/* Content */}
            <div className="relative space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                <h4 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  System Status
                </h4>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs text-green-400 font-mono">ACTIVE</span>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Streaming Status */}
                <div className="bg-slate-800/50 rounded-md p-2 border border-slate-700/30">
                  <div className="text-xs text-slate-400 mb-1 font-mono">Streaming</div>
                  <div className={`text-sm font-bold font-mono ${isStreaming ? 'text-green-400' : 'text-slate-500'}`}>
                    {isStreaming ? '● LIVE' : '○ OFF'}
                  </div>
                </div>

                {/* Connection Status */}
                <div className="bg-slate-800/50 rounded-md p-2 border border-slate-700/30">
                  <div className="text-xs text-slate-400 mb-1 font-mono">Connection</div>
                  <div className={`text-sm font-bold font-mono ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isConnected ? '● READY' : '○ WAIT'}
                  </div>
                </div>

                {/* Video Status */}
                <div className="bg-slate-800/50 rounded-md p-2 border border-slate-700/30">
                  <div className="text-xs text-slate-400 mb-1 font-mono">Video</div>
                  <div className={`text-sm font-bold font-mono ${!videoRef.current?.paused ? 'text-green-400' : 'text-red-400'}`}>
                    {!videoRef.current?.paused ? '▶ PLAY' : '⏸ PAUSE'}
                  </div>
                </div>

                {/* Tracks Status */}
                <div className="bg-slate-800/50 rounded-md p-2 border border-slate-700/30">
                  <div className="text-xs text-slate-400 mb-1 font-mono">Tracks</div>
                  <div className="text-sm font-bold text-blue-400 font-mono">
                    {stream?.getTracks().length || 0} / 2
                  </div>
                </div>
              </div>

              {/* User Click Warning */}
              {needsUserClick && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs text-red-400 font-mono uppercase">User Action Required</span>
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <details className="group">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 transition-colors font-mono flex items-center gap-2">
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                  Technical Details
                </summary>
                <div className="mt-2 space-y-1 pl-4 border-l-2 border-slate-700/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-mono">Video Element</span>
                    <span className={`font-mono ${videoRef.current ? 'text-green-400' : 'text-red-400'}`}>
                      {videoRef.current ? 'PRESENT' : 'MISSING'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-mono">Source Object</span>
                    <span className={`font-mono ${videoRef.current?.srcObject ? 'text-green-400' : 'text-red-400'}`}>
                      {videoRef.current?.srcObject ? 'SET' : 'NULL'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-mono">User Click State</span>
                    <span className={`font-mono ${needsUserClick ? 'text-red-400' : 'text-green-400'}`}>
                      {needsUserClick ? 'REQUIRED' : 'NOT NEEDED'}
                    </span>
                  </div>
                </div>
              </details>

              {/* Force Fix Button - Only show if needed */}
              {videoRef.current?.paused && !needsUserClick && (
                <Button 
                  onClick={() => {
                    console.log('[Broadcaster] Manual fix: Setting needsUserClick = TRUE');
                    setNeedsUserClick(true);
                  }}
                  size="sm"
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-red-500/20 font-mono text-xs"
                >
                  <span className="mr-2">⚠</span>
                  FORCE STATE CORRECTION
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}