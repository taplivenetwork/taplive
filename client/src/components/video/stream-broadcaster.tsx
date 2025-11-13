import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Camera, Wifi, WifiOff, RefreshCw, RotateCcw } from 'lucide-react';

interface StreamBroadcasterProps {
  orderId: string;
  onStreamStart: () => void;
  onStreamEnd: () => void;
}

export function StreamBroadcaster({ orderId, onStreamStart, onStreamEnd }: StreamBroadcasterProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // WebSocket connection with auto-reconnect
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    
    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('📡 WebSocket connected for broadcaster');
        setIsConnected(true);
        setWs(socket);
        setRetryCount(0);
      };

      socket.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
        setWs(null);
        
        // Auto-reconnect after 3 seconds
        if (retryCount < 5) {
          console.log(`🔄 Reconnecting in 3s... (attempt ${retryCount + 1}/5)`);
          reconnectTimeout = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connectWebSocket();
          }, 3000);
        }
      };

      socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Connection failed - retrying...');
      };

      return () => {
        socket.close();
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
      };
    };

    const cleanup = connectWebSocket();
    return cleanup;
  }, [retryCount]);

  const startStream = async () => {
    try {
      setError(null);
      console.log('🎬 Starting stream with camera:', facingMode);
      
      // Reset user interaction state at start
      console.log('🔄 Resetting needsUserInteraction to FALSE at start');
      setNeedsUserInteraction(false);
      
      // Clean up existing stream
      if (stream) {
        console.log('🧹 Cleaning up existing stream...');
        stream.getTracks().forEach(track => {
          console.log(`⏹️ Stopping ${track.kind} track`);
          track.stop();
        });
        setStream(null);
      }

      // Enhanced camera constraints for better stability
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
          sampleRate: 44100
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ MediaStream obtained:', {
        id: mediaStream.id,
        videoTracks: mediaStream.getVideoTracks().length,
        audioTracks: mediaStream.getAudioTracks().length
      });

      // Monitor tracks for stability
      mediaStream.getTracks().forEach((track, index) => {
        console.log(`🎯 Track ${index}: ${track.kind} - ${track.readyState} - ${track.enabled ? 'enabled' : 'disabled'}`);
        
        // Enhanced track event monitoring
        track.addEventListener('ended', () => {
          console.error(`❌ Track ${track.kind} ended unexpectedly!`);
          setError(`Camera ${track.kind} stopped. Please restart the stream.`);
        });

        track.addEventListener('mute', () => {
          console.warn(`🔇 Track ${track.kind} muted`);
        });

        track.addEventListener('unmute', () => {
          console.log(`🔊 Track ${track.kind} unmuted`);
        });
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        // Enhanced video element setup
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.muted = true; // Critical for autoplay
        video.playsInline = true; // Critical for mobile
        video.autoplay = true;
        
        console.log('📹 Video element configured');
        
        // Enhanced video element monitoring
        const setupVideoEvents = () => {
          video.addEventListener('loadedmetadata', () => {
            console.log('📊 Video metadata loaded:', {
              duration: video.duration,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight
            });
          });

          video.addEventListener('canplay', () => {
            console.log('▶️ Video can play');
          });

          video.addEventListener('playing', () => {
            console.log('✅ Video is playing');
          });

          video.addEventListener('pause', (e) => {
            console.warn('⏸️ Video paused');
            console.log('🚨 IMMEDIATE: Setting needsUserInteraction to TRUE on pause');
            setNeedsUserInteraction(true);
            setError(null);
            
            // Also check after delay for confirmation
            setTimeout(() => {
              if (video.paused && !video.ended && video.srcObject) {
                console.log('🔒 Confirmed: Video auto-paused by browser - requiring user interaction');
                console.log('🚨 DOUBLE CONFIRM: Setting needsUserInteraction to TRUE');
                setNeedsUserInteraction(true);
                setError(null);
              }
            }, 1000);
          });

          video.addEventListener('ended', () => {
            console.error('❌ Video ended');
          });

          video.addEventListener('error', (e) => {
            console.error('❌ Video error:', e);
            setError('Video playback error. Please try again.');
          });
        };

        setupVideoEvents();
        
        // Enhanced play logic with user interaction detection
        const startVideoPlayback = async () => {
          try {
            // Set video properties before play
            video.muted = true; // Essential for autoplay
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            
            await video.play();
            console.log('✅ Video playing successfully');
            
            // Verify it's actually playing after a delay
            setTimeout(() => {
              if (video.paused && !video.ended) {
                console.warn('⚠️ Video auto-paused after start - browser autoplay restriction');
                console.log('🚨 Setting needsUserInteraction to TRUE (from timeout)');
                setNeedsUserInteraction(true);
                setError(null);
              } else {
                console.log('✅ Video confirmed playing');
                setNeedsUserInteraction(false);
              }
            }, 2000);
            
          } catch (playError: any) {
            console.error('❌ Play failed:', playError.name, '-', playError.message);
            
            if (playError.name === 'NotAllowedError') {
              console.log('🔒 需要用户交互才能播放');
              setNeedsUserInteraction(true);
              setError(null); // Clear error since this is expected behavior
            } else {
              setError('视频播放失败。请检查摄像头权限。');
            }
          }
        };

        await startVideoPlayback();
      }

      // WebSocket signaling
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'join',
          role: 'broadcaster',
          streamId: orderId
        }));

        ws.send(JSON.stringify({
          type: 'broadcaster-ready',
          streamId: orderId
        }));
        
        console.log('📡 WebSocket signals sent');
      }

      setIsStreaming(true);
      onStreamStart();
      console.log('🎉 Stream started successfully!');
    } catch (err: any) {
      console.error('❌ Stream start failed:', err);
      
      // Provide specific error messages
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please check your device and try again.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is in use by another application. Please close other apps and try again.');
      } else {
        setError(`Camera error: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const stopStream = () => {
    console.log('⏹️ Stopping stream...');
    
    if (stream) {
      console.log('🧹 Cleaning up MediaStream...');
      stream.getTracks().forEach(track => {
        console.log(`⏹️ Stopping ${track.kind} track`);
        track.stop();
      });
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      console.log('📹 Video element cleared');
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'broadcaster-end',
        streamId: orderId
      }));
    }

    setIsStreaming(false);
    onStreamEnd();
    setError(null);
    // DON'T reset needsUserInteraction here!
    console.log('✅ Stream stopped');
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    console.log(`🔄 Switching camera: ${facingMode} → ${newFacingMode}`);
    setFacingMode(newFacingMode);
    
    if (isStreaming) {
      // Smoothly restart with new camera
      stopStream();
      setTimeout(() => {
        setFacingMode(newFacingMode);
        startStream();
      }, 1000);
    }
  };

  const restartStream = () => {
    console.log('🔄 Restarting stream...');
    stopStream();
    setTimeout(() => startStream(), 2000);
  };

  const handleUserInteraction = async () => {
    console.log('👆 User interaction received');
    if (videoRef.current && stream) {
      try {
        // Force video properties again
        videoRef.current.muted = true;
        videoRef.current.setAttribute('playsinline', 'true');
        
        await videoRef.current.play();
        console.log('✅ Video started after user interaction');
        setNeedsUserInteraction(false);
        setError(null);
        
        // Double check after a delay
        setTimeout(() => {
          if (videoRef.current?.paused) {
            console.warn('⚠️ Video paused again after user interaction');
            setError('视频仍然无法播放。请尝试刷新页面。');
          } else {
            console.log('✅ Video confirmed playing after user interaction');
          }
        }, 1000);
        
      } catch (err: any) {
        console.error('❌ User interaction play failed:', err);
        setError(`播放失败: ${err.message}. 请刷新页面重试。`);
        setNeedsUserInteraction(false);
      }
    } else {
      console.error('❌ No video element or stream available');
      setError('视频未准备好，请重新开始直播');
      setNeedsUserInteraction(false);
    }
  };

  // Monitor video pause state without cleanup interference
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      
      // Direct pause monitoring to avoid event cleanup issues
      const checkVideoPause = () => {
        if (video.paused && !video.ended && video.srcObject) {
          console.log('🚨 FORCE UPDATE: Video is paused, setting needsUserInteraction = TRUE');
          setNeedsUserInteraction(true);
          setError(null);
        }
      };
      
      // Check immediately and then periodically
      checkVideoPause();
      const interval = setInterval(checkVideoPause, 1000);
      
      return () => clearInterval(interval);
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        console.log('🧹 Component cleanup - stopping stream');
        stream.getTracks().forEach(track => track.stop());
      }
      if (ws) {
        ws.close();
      }
      // DON'T reset needsUserInteraction on cleanup
    };
  }, [stream, ws]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Live Broadcast
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
              {isConnected ? '已连接' : '连接中...'}
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
                  Click to start broadcast
                </p>
              </div>
            </div>
          )}
          
          {/* User Interaction Overlay - High Priority */}
          {needsUserInteraction && (
            <div 
              className="fixed inset-0 flex items-center justify-center bg-red-900/90 z-[9999] animate-pulse"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
            >
              <div className="text-center text-white space-y-6 p-8 bg-red-800/80 rounded-lg border-4 border-red-300 shadow-2xl">
                <div className="text-8xl mb-4 animate-bounce">🚨</div>
                <h3 className="text-2xl font-bold text-white animate-pulse">
                  Click to play!
                </h3>
                <p className="text-lg opacity-95 mb-6">
                  Browser blocked autoplay
                </p>
                <Button 
                  onClick={handleUserInteraction}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-10 py-6 text-2xl font-bold animate-bounce"
                  data-testid="user-interaction-play-button"
                >
                  <Play className="w-8 h-8 mr-4" />
                  Play video now
                </Button>
                <p className="text-sm opacity-80 mt-4">
                  Click button above to continue
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Display with Enhanced Guidance */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm mb-3">{error}</p>
            <div className="flex gap-2">
              <Button 
                onClick={restartStream} 
                variant="outline" 
                size="sm"
                data-testid="retry-stream-button"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              {error.includes('permission') && (
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refresh page
                </Button>
              )}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              
                提示: 如果问题持续，请刷新页面或检查摄像头权限
              
            </div>
          </div>
        )}

        {/* Enhanced Controls */}
        <div className="flex gap-2">
          {!isStreaming ? (
            <Button 
              onClick={startStream} 
              disabled={!isConnected}
              className="flex-1"
              data-testid="start-stream-button"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Broadcast
            </Button>
          ) : (
            <Button 
              onClick={stopStream} 
              variant="destructive"
              className="flex-1"
              data-testid="stop-stream-button"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Broadcast
            </Button>
          )}
          
          <Button 
            onClick={switchCamera}
            variant="outline"
            disabled={!isConnected}
            data-testid="switch-camera-button"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            
              {`摄像头: ${facingMode === 'user' ? '前置' : '后置'}`}
            
          </p>
          {retryCount > 0 && (
            <p className="text-xs text-yellow-600">
              {`正在重连... (${retryCount}/5)`}
            </p>
          )}
          
          {/* Debug Status Display */}
          <div className="text-xs space-y-1 mt-2 p-2 bg-gray-100 rounded">
            <p>调试状态:</p>
            <p>needsUserInteraction: {needsUserInteraction ? '🔴 TRUE' : '🟢 FALSE'}</p>
            <p>isStreaming: {isStreaming ? '✅ TRUE' : '❌ FALSE'}</p>
            <p>isConnected: {isConnected ? '✅ TRUE' : '❌ FALSE'}</p>
            <p>error: {error ? '❌ YES' : '✅ NO'}</p>
            <p>videoPaused: {videoRef.current?.paused ? '⏸️ TRUE' : '▶️ FALSE'}</p>
            <p>videoSrc: {videoRef.current?.srcObject ? '✅ YES' : '❌ NO'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}