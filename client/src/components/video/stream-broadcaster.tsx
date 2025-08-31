import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VideoIcon, VideoOff, Mic, MicOff, Phone, PhoneOff, RotateCcw } from 'lucide-react';

// Handle global for simple-peer
if (typeof global === 'undefined') {
  (window as any).global = window;
}

import Peer from 'simple-peer';

interface StreamBroadcasterProps {
  orderId: string;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

export function StreamBroadcaster({ orderId, onStreamStart, onStreamEnd }: StreamBroadcasterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // Start with rear camera

  useEffect(() => {
    // Global error handlers to prevent stream termination
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection in video component:', event.reason);
      event.preventDefault(); // Prevent default behavior (which might stop the stream)
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected for broadcaster');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'user-joined':
            // A viewer joined, we should send our stream to them
            // Use a ref or callback to avoid dependency on stream state
            console.log('User joined, checking for stream...');
            break;
          case 'webrtc-answer':
            console.log('Received WebRTC answer');
            break;
          case 'webrtc-ice-candidate':
            console.log('Received ICE candidate');
            break;
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    setWs(websocket);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      websocket.close();
    };
  }, [orderId]); // Only depend on orderId

  // Don't auto-cleanup stream on state changes - only manual cleanup

  const initiateConnection = (websocket: WebSocket, mediaStream: MediaStream) => {
    try {
      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream: mediaStream
      });

      newPeer.on('signal', (data: any) => {
        try {
          websocket.send(JSON.stringify({
            type: 'webrtc-offer',
            offer: data,
            streamId: orderId
          }));
        } catch (err) {
          console.error('Error sending WebRTC signal:', err);
        }
      });

      newPeer.on('error', (err: any) => {
        console.error('Peer error:', err);
        setError('WebRTC连接错误，请重试');
        // Don't stop the stream on peer errors, just log them
      });

      newPeer.on('close', () => {
        console.log('Peer connection closed');
      });

      setPeer(newPeer);
    } catch (err) {
      console.error('Error creating peer connection:', err);
      setError('无法创建视频连接');
    }
  };

  const startStream = async () => {
    try {
      setError(null);
      console.log('Starting stream with facingMode:', facingMode);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      console.log('MediaStream obtained:', mediaStream.id);
      console.log('Video tracks:', mediaStream.getVideoTracks().length);
      console.log('Audio tracks:', mediaStream.getAudioTracks().length);

      // Prevent the stream from being stopped by adding event listeners
      mediaStream.getTracks().forEach((track, index) => {
        console.log(`Track ${index}: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
        
        track.addEventListener('ended', () => {
          console.error(`❌ Track ${track.kind} ended unexpectedly!`);
          console.error('Track details:', {
            id: track.id,
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted
          });
          setError(`${track.kind} track ended unexpectedly. Please restart the stream.`);
        });

        track.addEventListener('mute', () => {
          console.warn(`⚠️ Track ${track.kind} was muted`);
        });

        track.addEventListener('unmute', () => {
          console.log(`🔊 Track ${track.kind} was unmuted`);
        });
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('✅ Video element srcObject set');
        
        // Add video element event listeners
        videoRef.current.addEventListener('pause', () => {
          console.warn('⏸️ Video element paused');
        });
        
        videoRef.current.addEventListener('ended', () => {
          console.error('❌ Video element ended');
        });
        
        videoRef.current.addEventListener('emptied', () => {
          console.error('❌ Video element emptied (srcObject removed)');
        });
        
        videoRef.current.addEventListener('abort', () => {
          console.error('❌ Video element aborted');
        });
        
        // Force video play
        try {
          await videoRef.current.play();
          console.log('✅ Video element playing successfully');
          
          // Check status after a short delay
          setTimeout(() => {
            if (videoRef.current) {
              console.log('🔍 Video status check:', {
                paused: videoRef.current.paused,
                ended: videoRef.current.ended,
                readyState: videoRef.current.readyState,
                srcObject: videoRef.current.srcObject ? 'present' : 'null'
              });
            }
          }, 1000);
          
        } catch (playError) {
          console.error('❌ Video play error:', playError);
        }
      }

      if (ws && ws.readyState === WebSocket.OPEN) {
        // Join the stream room as broadcaster
        ws.send(JSON.stringify({
          type: 'join-stream',
          streamId: orderId
        }));

        // Notify that streaming has started
        ws.send(JSON.stringify({
          type: 'start-streaming',
          orderId
        }));
        
        console.log('WebSocket messages sent');
      }

      setIsStreaming(true);
      console.log('Stream started successfully');
      onStreamStart?.();
    } catch (err) {
      console.error('Error starting stream:', err);
      setError('摄像头权限被拒绝。请在手机浏览器中打开项目网址测试摄像头功能。Replit移动应用环境限制了摄像头访问。');
      setIsStreaming(false);
    }
  };

  const stopStream = () => {
    console.log('Stopping stream...');
    
    if (stream) {
      console.log('Stopping stream tracks...');
      stream.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track`);
        track.stop();
      });
      setStream(null);
    }
    
    if (peer) {
      console.log('Destroying peer connection...');
      peer.destroy();
      setPeer(null);
    }

    if (videoRef.current) {
      console.log('Clearing video element...');
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    console.log('Stream stopped');
    onStreamEnd?.();
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const switchCamera = async () => {
    if (stream && isStreaming) {
      try {
        // Stop current tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Switch facing mode
        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacingMode);
        
        // Get new stream with different camera
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: newFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        });

        setStream(newStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }

        // Update peer with new stream if connected
        if (peer) {
          const videoTrack = newStream.getVideoTracks()[0];
          const audioTrack = newStream.getAudioTracks()[0];
          
          if (videoTrack) {
            const sender = (peer as any)._pc?.getSenders().find((s: any) => s.track?.kind === 'video');
            if (sender) {
              try {
                await sender.replaceTrack(videoTrack);
              } catch (err) {
                console.error('Error replacing video track:', err);
              }
            }
          }
          
          if (audioTrack) {
            const sender = (peer as any)._pc?.getSenders().find((s: any) => s.track?.kind === 'audio');
            if (sender) {
              try {
                await sender.replaceTrack(audioTrack);
              } catch (err) {
                console.error('Error replacing audio track:', err);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error switching camera:', err);
        setError('Failed to switch camera. Make sure you have multiple cameras available.');
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live Stream Control</span>
          {isStreaming && (
            <Badge className="bg-red-500 text-white">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              Broadcasting
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {!isStreaming && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <VideoIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <div>Click Start Stream to begin</div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-700">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isStreaming ? (
            <Button 
              onClick={startStream} 
              className="bg-green-600 hover:bg-green-700"
              data-testid="start-stream-button"
            >
              <VideoIcon className="w-4 h-4 mr-2" />
              Start Stream
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleVideo}
                className={!isVideoEnabled ? 'bg-red-100 text-red-600' : ''}
              >
                {isVideoEnabled ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={toggleAudio}
                className={!isAudioEnabled ? 'bg-red-100 text-red-600' : ''}
              >
                {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={switchCamera}
                title={`Switch to ${facingMode === 'user' ? 'rear' : 'front'} camera`}
                data-testid="button-switch-camera"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button 
                onClick={stopStream}
                variant="destructive"
                data-testid="stop-stream-button"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Stream
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}