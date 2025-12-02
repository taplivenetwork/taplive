import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/translated-text';
import { Users, Volume2, VolumeX, Maximize, Minimize, RefreshCw, Play } from 'lucide-react';

// Handle global for simple-peer
if (typeof global === 'undefined') {
  (window as any).global = window;
}

import Peer from 'simple-peer';

interface StreamViewerProps {
  streamId: string;
  isLive: boolean;
  onViewerCountChange?: (count: number) => void;
}

export function StreamViewer({ streamId, isLive, onViewerCountChange }: StreamViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [needsUserClick, setNeedsUserClick] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const connectingRef = useRef(false);
  const viewerIdRef = useRef<string | null>(null);

  const connectToStream = () => {
    if (!isLive) return;
    
    // Prevent duplicate connections
    if (connectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('📺 Already connected or connecting, skipping...');
      return;
    }
    
    connectingRef.current = true;

    console.log('📺 Connecting to stream...');
    setConnectionError(null);

    // WebSocket connection with enhanced error handling
    // Connect directly to backend server on port 5000
    const wsUrl = 'ws://localhost:5000/ws';
    const websocket = new WebSocket(wsUrl);
    wsRef.current = websocket;

    websocket.onopen = () => {
      console.log('📡 WebSocket connected for viewer');
      setWs(websocket);
      connectingRef.current = false;
      
      // Join the stream room
      websocket.send(JSON.stringify({
        type: 'join-stream',
        streamId
      }));
      setRetryCount(0);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 Viewer received message:', message.type);
        
        switch (message.type) {
          case 'webrtc-offer':
            console.log('📞 Received WebRTC offer from broadcaster, viewerId:', message.viewerId);
            // Store our viewer ID
            if (message.viewerId) {
              viewerIdRef.current = message.viewerId;
            }
            // Only handle if we don't already have an active peer
            if (!peerRef.current || peerRef.current.connectionState === 'closed' || peerRef.current.connectionState === 'failed') {
              handleWebRTCOffer(message.offer, websocket);
            } else {
              console.log('⏭️ Already have active peer connection, ignoring offer');
            }
            break;
          case 'webrtc-ice-candidate':
            console.log('🧊 Received ICE candidate');
            const pc = peerRef.current;
            if (pc && message.candidate && pc.signalingState !== 'closed' && pc.remoteDescription) {
              pc.addIceCandidate(new RTCIceCandidate(message.candidate))
                .then(() => console.log('✅ ICE candidate added'))
                .catch(err => console.error('❌ Failed to add ICE candidate:', err));
            } else {
              console.log('⏭️ Skipping ICE candidate - connection not ready or closed');
            }
            break;
          case 'stream-started':
            console.log('✅ Stream started signal received');
            setIsConnected(true);
            break;
          case 'broadcaster-ready-signal':
            console.log('✅ Broadcaster is ready');
            break;
          case 'user-joined':
            setViewerCount(prev => Math.max(1, prev + 1));
            break;
          case 'viewer-count':
            console.log('👥 Viewer count update:', message.count);
            setViewerCount(message.count || 1);
            break;
        }
      } catch (error) {
        console.error('❌ Message parsing error:', error);
      }
    };

    websocket.onclose = (event) => {
      console.log('❌ WebSocket connection closed:', event.code, event.reason);
      wsRef.current = null;
      setWs(null);
      setIsConnected(false);
      connectingRef.current = false;
      
      // Don't auto-retry if deliberately closed or too many retries
      if (event.code !== 1000 && retryCount < 3 && isLive) {
        console.log(`🔄 Retrying connection in 3s... (${retryCount + 1}/3)`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connectToStream();
        }, 3000);
      } else if (retryCount >= 3) {
        setConnectionError('连接已断开。请刷新页面重试。');
      }
    };

    websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionError('连接失败，正在重试...');
    };

    return websocket;
  };

  useEffect(() => {
    connectToStream();
    
    return () => {
      console.log('🧹 Cleaning up viewer connections');
      connectingRef.current = false;
      
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
        setPeer(null);
      }
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
        setWs(null);
      }
    };
  }, [streamId, isLive]);

  const handleWebRTCOffer = (offer: RTCSessionDescriptionInit, websocket: WebSocket) => {
    console.log('📞 Handling WebRTC offer from broadcaster');
    
    // Clean up existing peer
    if (peer) {
      const pc = peer as any as RTCPeerConnection;
      if (pc.close) {
        pc.close();
      } else if ((peer as any).destroy) {
        (peer as any).destroy();
      }
      setPeer(null);
    }

    try {
      // Create native RTCPeerConnection (matching broadcaster)
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Handle incoming stream
      pc.ontrack = (event) => {
        console.log('📺 Received track:', event.track.kind, 'readyState:', event.track.readyState);
        console.log('📺 Event streams:', event.streams.length);
        if (videoRef.current && event.streams[0]) {
          const stream = event.streams[0];
          console.log('📺 Stream tracks:', stream.getTracks().map(t => `${t.kind} (${t.readyState})`));
          console.log('📺 Setting video srcObject');
          videoRef.current.srcObject = stream;
          
          // Force play - handle autoplay blocking
          setTimeout(() => {
            if (videoRef.current) {
              console.log('🎬 Attempting to play video...');
              videoRef.current.play()
                .then(() => {
                  console.log('▶️ Video play successful');
                  setNeedsUserClick(false);
                  setIsConnected(true);
                })
                .catch(err => {
                  console.error('❌ Video play failed:', err.name, err.message);
                  if (err.name === 'NotAllowedError' || err.name === 'NotSupportedError') {
                    console.log('🎯 Autoplay blocked - requiring user click');
                    setNeedsUserClick(true);
                    setIsConnected(true); // Still connected, just needs click
                  }
                });
            }
          }, 500);
          
          setIsConnected(true);
          setConnectionError(null);
        } else {
          console.warn('⚠️ No video element or stream!', {
            hasVideoRef: !!videoRef.current,
            streamCount: event.streams.length
          });
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && websocket.readyState === WebSocket.OPEN) {
          console.log('📡 Sending ICE candidate to broadcaster');
          websocket.send(JSON.stringify({
            type: 'webrtc-ice-candidate',
            candidate: event.candidate,
            streamId,
            viewerId: viewerIdRef.current
          }));
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('📊 Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          setConnectionError(null);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setIsConnected(false);
          setConnectionError('Connection lost');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', pc.iceConnectionState);
      };

      // Set remote description (offer from broadcaster)
      pc.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
          console.log('✅ Remote description set');
          // Create answer
          return pc.createAnswer();
        })
        .then((answer) => {
          console.log('📡 Created answer, setting local description');
          return pc.setLocalDescription(answer);
        })
        .then(() => {
          console.log('📡 Sending answer to broadcaster');
          websocket.send(JSON.stringify({
            type: 'webrtc-answer',
            answer: pc.localDescription,
            streamId,
            viewerId: viewerIdRef.current
          }));
        })
        .catch((error) => {
          console.error('❌ Failed to process offer:', error);
          setConnectionError(`连接错误: ${error.message}`);
        });

      // Store peer connection
      setPeer(pc as any);
      peerRef.current = pc;

    } catch (error) {
      console.error('❌ Failed to create peer connection:', error);
      setConnectionError('处理连接信号失败');
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = async () => {
    if (!videoRef.current) return;

    try {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          await videoRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('❌ Fullscreen error:', error);
    }
  };

  const retryConnection = () => {
    setRetryCount(0);
    setConnectionError(null);
    connectToStream();
  };

  const handleUserClickToPlay = async () => {
    console.log('👆 User clicked to play video');
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        console.log('▶️ Video started after user click');
        setNeedsUserClick(false);
      } catch (error) {
        console.error('❌ Failed to play after user click:', error);
        setConnectionError('Playback failed, please try again');
      }
    }
  };

  useEffect(() => {
    onViewerCountChange?.(viewerCount);
  }, [viewerCount, onViewerCountChange]);

  if (!isLive) {
    return (
      <Card className="w-full aspect-video bg-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground text-lg">
            <TranslatedText>直播尚未开始</TranslatedText>
          </div>
          <Badge variant="secondary">
            <TranslatedText>等待中</TranslatedText>
          </Badge>
          <p className="text-sm text-muted-foreground max-w-xs">
            <TranslatedText>服务提供者还没有开始直播，请耐心等待</TranslatedText>
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            controls
            className="w-full h-full object-cover"
            data-testid="stream-video"
            onLoadedMetadata={() => console.log('📺 Video metadata loaded')}
            onPlay={() => console.log('▶️ Video playing')}
            onPause={() => console.log('⏸️ Video paused')}
            onError={(e) => console.error('❌ Video error:', e)}
          />
          
          {/* Live indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Badge className="bg-red-500 text-white">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              <TranslatedText>直播中</TranslatedText>
            </Badge>
            <Badge className="bg-black/70 text-white">
              <Users className="w-3 h-3 mr-1" />
              {viewerCount}
            </Badge>
          </div>

        {/* User click required overlay (for autoplay blocking) */}
        {needsUserClick && (
          <div className="absolute inset-0 bg-blue-600/90 flex items-center justify-center z-20">
            <div className="text-white text-center space-y-4">
              <Play className="w-16 h-16 mx-auto" />
              <div className="text-xl font-semibold">
                <TranslatedText>点击观看直播</TranslatedText>
              </div>
              <Button
                onClick={handleUserClickToPlay}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Play className="w-5 h-5 mr-2" />
                <TranslatedText>立即播放</TranslatedText>
              </Button>
            </div>
          </div>
        )}

        {/* Connection status and errors */}
        {(!isConnected || connectionError) && !needsUserClick && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center space-y-4">
              {connectionError ? (
                <>
                  <div className="text-lg">⚠️</div>
                  <div>{connectionError}</div>
                  <Button 
                    onClick={retryConnection}
                    variant="outline"
                    size="sm"
                    className="text-white border-white hover:bg-white/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    <TranslatedText>重试连接</TranslatedText>
                  </Button>
                </>
              ) : (
                <>
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto" />
                  <div>
                    <TranslatedText>正在连接直播...</TranslatedText>
                  </div>
                  {retryCount > 0 && (
                    <div className="text-sm opacity-75">
                      <TranslatedText>{`重试中... (${retryCount}/3)`}</TranslatedText>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="absolute top-16 left-4 bg-black/80 text-white text-xs p-2 rounded space-y-1">
          <div>WebSocket: {ws ? '✅ Connected' : '❌ Disconnected'}</div>
          <div>Peer: {peer ? '✅ Created' : '❌ None'}</div>
          <div>Video srcObject: {videoRef.current?.srcObject ? '✅ Set' : '❌ None'}</div>
          <div>Video paused: {videoRef.current?.paused ? '⏸️ Yes' : '▶️ No'}</div>
          <div>Connection: {isConnected ? '✅ Connected' : '⏳ Waiting'}</div>
        </div>          {/* Controls */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={toggleMute}
              data-testid="mute-button"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={toggleFullscreen}
              data-testid="fullscreen-button"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Status info */}
        {isConnected && !connectionError && (
          <div className="p-3 bg-green-50 border-t">
            <p className="text-sm text-green-700 text-center">
              <TranslatedText>✅ 已连接到直播流</TranslatedText>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}