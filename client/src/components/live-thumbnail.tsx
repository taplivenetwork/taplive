import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { TranslatedText } from '@/components/translated-text';

interface LiveThumbnailProps {
  streamId: string;
  className?: string;
  showViewerCount?: boolean;
  enableWebSocket?: boolean; // 控制是否启用WebSocket
  lowPerformance?: boolean;  // 低性能模式
}

export function LiveThumbnail({ 
  streamId, 
  className = "", 
  showViewerCount = true, 
  enableWebSocket = true,
  lowPerformance = false 
}: LiveThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(Math.floor(Math.random() * 500) + 50);

  useEffect(() => {
    let animationFrame: number;
    let animationInterval: NodeJS.Timeout | null = null;
    
    const connectWebSocket = () => {
      // 只在启用WebSocket且不是低性能模式时才连接
      if (!enableWebSocket || lowPerformance) return;
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log(`📡 Live thumbnail connected to stream ${streamId}`);
        setIsConnected(true);
        
        // 发送预览请求
        wsRef.current?.send(JSON.stringify({
          type: 'request-preview',
          streamId: streamId
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'preview-frame' && data.streamId === streamId) {
            // 接收到实时帧数据，更新画面
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video && canvas && data.frameData) {
              const ctx = canvas.getContext('2d');
              const img = new Image();
              img.onload = () => {
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
              };
              img.src = `data:image/jpeg;base64,${data.frameData}`;
            }
          }
        } catch (error) {
          console.error('Error handling preview data:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        // 低性能模式下不重连
        if (!lowPerformance) {
          setTimeout(connectWebSocket, 3000);
        }
      };
      
      wsRef.current.onerror = () => {
        console.error(`❌ Thumbnail WebSocket error for stream ${streamId}`);
        setIsConnected(false);
      };
    };

    // 模拟实时画面效果
    const simulatePreview = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // 创建动态渐变背景模拟直播
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      const hue = (Date.now() / 50) % 360;
      gradient.addColorStop(0, `hsl(${hue}, 60%, 40%)`);
      gradient.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 60%, 50%)`);
      gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 60%, 40%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 添加脉动效果
      const pulse = Math.sin(Date.now() / 500) * 0.1 + 0.9;
      ctx.globalAlpha = pulse;
      
      // 添加"LIVE"文字
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('LIVE', canvas.width / 2, canvas.height / 2);
      
      ctx.globalAlpha = 1;
    };

    // 根据性能模式选择动画方式
    if (lowPerformance) {
      // 低性能模式：使用定时器，大幅降低帧率
      const frameRate = enableWebSocket ? 200 : 1000; // 有WebSocket时5fps，否则1fps（1秒一帧）
      animationInterval = setInterval(simulatePreview, frameRate);
    } else {
      // 正常模式：使用requestAnimationFrame (60fps)
      const animate = () => {
        simulatePreview();
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
    }
    
    // 尝试连接WebSocket（仅在非低性能模式下）
    if (!lowPerformance) {
      connectWebSocket();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (animationInterval) {
        clearInterval(animationInterval);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [streamId]);

  // 更新观看人数
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 10) - 5);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={320}
        height={180}
        className="w-full h-full object-cover rounded-lg"
      />
      
      {/* LIVE 指示器 */}
      <Badge className="absolute top-2 left-2 bg-red-500 text-white animate-pulse">
        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-ping" />
        <TranslatedText>LIVE</TranslatedText>
      </Badge>
      
      {/* 观看人数 */}
      {showViewerCount && (
        <Badge className="absolute top-2 right-2 bg-black/70 text-white">
          <Users className="w-3 h-3 mr-1" />
          {viewerCount}
        </Badge>
      )}
      
      {/* 连接状态指示器 */}
      {!isConnected && (
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse" 
             title="Connecting to live stream..." />
      )}
      
      {/* 隐藏的视频元素用于WebRTC */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
      />
    </div>
  );
}