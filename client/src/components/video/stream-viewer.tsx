import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/translated-text';
import { Users, Volume2, VolumeX, Maximize, Minimize, RefreshCw } from 'lucide-react';

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

  const connectToStream = () => {
    if (!isLive) return;

    console.log('📺 Connecting to stream...');
    setConnectionError(null);

    // WebSocket connection with enhanced error handling
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('📡 WebSocket connected for viewer');
      setWs(websocket);
      
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
        
        switch (message.type) {
          case 'webrtc-offer':
            handleWebRTCOffer(message.offer, websocket);
            break;
          case 'webrtc-ice-candidate':
            if (peer && message.candidate) {
              peer.signal(message.candidate);
            }
            break;
          case 'stream-started':
            console.log('✅ Stream started signal received');
            setIsConnected(true);
            break;
          case 'user-joined':
            setViewerCount(prev => Math.max(1, prev + 1));
            break;
          case 'viewer-count':
            setViewerCount(message.count || 1);
            break;
        }
      } catch (error) {
        console.error('❌ Message parsing error:', error);
      }
    };

    websocket.onclose = (event) => {
      console.log('❌ WebSocket connection closed:', event.code, event.reason);
      setWs(null);
      setIsConnected(false);
      
      // Auto-retry connection
      if (retryCount < 3 && isLive) {
        console.log(`🔄 Retrying connection in 3s... (${retryCount + 1}/3)`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connectToStream();
        }, 3000);
      } else {
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
    const websocket = connectToStream();
    
    return () => {
      if (peer) {
        console.log('🧹 Cleaning up peer connection');
        peer.destroy();
        setPeer(null);
      }
      if (websocket) {
        websocket.close();
      }
    };
  }, [streamId, isLive, retryCount]);

  const handleWebRTCOffer = (offer: RTCSessionDescriptionInit, websocket: WebSocket) => {
    console.log('📞 Handling WebRTC offer');
    
    // Clean up existing peer
    if (peer) {
      peer.destroy();
    }

    const newPeer = new Peer({
      initiator: false,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    newPeer.on('signal', (data) => {
      console.log('📡 Sending WebRTC answer');
      websocket.send(JSON.stringify({
        type: 'webrtc-answer',
        answer: data,
        streamId
      }));
    });

    newPeer.on('stream', (stream) => {
      console.log('📺 Received stream');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsConnected(true);
        setConnectionError(null);
      }
    });

    newPeer.on('connect', () => {
      console.log('✅ Peer connected');
      setIsConnected(true);
    });

    newPeer.on('error', (err) => {
      console.error('❌ Peer error:', err);
      setConnectionError(`连接错误: ${err.message}`);
      setIsConnected(false);
    });

    newPeer.on('close', () => {
      console.log('❌ Peer connection closed');
      setIsConnected(false);
    });

    try {
      newPeer.signal(offer);
      setPeer(newPeer);
    } catch (error) {
      console.error('❌ Failed to process offer:', error);
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
            className="w-full h-full object-cover"
            data-testid="stream-video"
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

          {/* Connection status and errors */}
          {(!isConnected || connectionError) && (
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

          {/* Controls */}
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