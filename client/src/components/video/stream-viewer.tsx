import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

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
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!isLive) return;

    // WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected for viewer');
      setWs(websocket);
      
      // Join the stream room
      websocket.send(JSON.stringify({
        type: 'join-stream',
        streamId
      }));
    };

    websocket.onmessage = (event) => {
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
          setIsConnected(true);
          break;
        case 'user-joined':
          setViewerCount(prev => prev + 1);
          break;
      }
    };

    setWs(websocket);

    return () => {
      if (peer) {
        peer.destroy();
      }
      websocket.close();
    };
  }, [streamId, isLive]);

  const handleWebRTCOffer = (offer: RTCSessionDescriptionInit, websocket: WebSocket) => {
    const newPeer = new Peer({
      initiator: false,
      trickle: false
    });

    newPeer.on('signal', (data) => {
      websocket.send(JSON.stringify({
        type: 'webrtc-answer',
        answer: data,
        streamId
      }));
    });

    newPeer.on('stream', (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsConnected(true);
      }
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    newPeer.signal(offer);
    setPeer(newPeer);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    onViewerCountChange?.(viewerCount);
  }, [viewerCount, onViewerCountChange]);

  if (!isLive) {
    return (
      <Card className="w-full aspect-video bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">Stream is not live</div>
          <Badge variant="secondary">Offline</Badge>
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
          />
          
          {/* Live indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Badge className="bg-red-500 text-white">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              LIVE
            </Badge>
            <Badge className="bg-black/70 text-white">
              <Users className="w-3 h-3 mr-1" />
              {viewerCount}
            </Badge>
          </div>

          {/* Connection status */}
          {!isConnected && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                <div>Connecting to stream...</div>
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
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}