import { useState } from 'react';
import { LiveThumbnail } from '@/components/live-thumbnail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/translated-text';
import { Play, Grid, Maximize2, Users } from 'lucide-react';
import type { Order } from '@shared/schema';

interface MultiStreamGridProps {
  streams: Order[];
  onStreamClick?: (streamId: string) => void;
}

const GRID_CONFIGS = [
  { count: 1, cols: 1, rows: 1, name: '单屏' },
  { count: 4, cols: 2, rows: 2, name: '四分屏' },
  { count: 8, cols: 4, rows: 2, name: '8分屏' }, 
  { count: 16, cols: 4, rows: 4, name: '16分屏' },
  { count: 32, cols: 8, rows: 4, name: '32分屏' },
  { count: 64, cols: 8, rows: 8, name: '64分屏' },
  { count: 128, cols: 16, rows: 8, name: '128分屏' },
  { count: 256, cols: 16, rows: 16, name: '256分屏' },
];

export function MultiStreamGrid({ streams, onStreamClick }: MultiStreamGridProps) {
  const [selectedGrid, setSelectedGrid] = useState(4); // 默认4分屏
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentConfig = GRID_CONFIGS.find(config => config.count === selectedGrid) || GRID_CONFIGS[1];
  
  // 获取当前直播流
  const liveStreams = streams.filter(stream => stream.status === 'live');
  
  // 生成足够的流来填满网格（复制现有流或创建模拟流）
  const gridStreams = [];
  for (let i = 0; i < currentConfig.count; i++) {
    if (liveStreams[i % liveStreams.length]) {
      gridStreams.push({
        ...liveStreams[i % liveStreams.length],
        // 为重复流添加唯一标识
        displayId: `${liveStreams[i % liveStreams.length].id}-${i}`
      });
    } else {
      // 创建模拟流用于演示
      gridStreams.push({
        id: `demo-${i}`,
        displayId: `demo-${i}`,
        title: `演示直播 ${i + 1}`,
        description: '精彩内容正在直播中...',
        price: '15.99',
        status: 'live' as const,
        category: 'entertainment',
        address: '全球在线',
        latitude: 0,
        longitude: 0,
        type: 'single' as const,
        creatorId: 'demo',
        providerId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  const handleStreamClick = (stream: any) => {
    if (onStreamClick && liveStreams.find(s => s.id === stream.id)) {
      // 只有真实直播才能点击进入
      onStreamClick(stream.id);
    } else {
      // 演示流显示提示
      console.log('点击了演示流，真实环境中这里会有实际直播');
    }
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 网格配置控制面板 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Grid className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">震撼多屏直播墙</h3>
              <p className="text-sm text-blue-100">选择网格布局，体验极致视觉冲击</p>
            </div>
          </div>
          
          {/* 网格选择按钮 */}
          <div className="flex flex-wrap gap-2">
            {GRID_CONFIGS.map((config) => (
              <Button
                key={config.count}
                size="sm"
                variant={selectedGrid === config.count ? 'secondary' : 'outline'}
                onClick={() => setSelectedGrid(config.count)}
                className={selectedGrid === config.count ? 
                  'bg-white text-blue-600 hover:bg-white/90' : 
                  'border-white/20 text-white hover:bg-white/10'
                }
              >
                {config.name}
              </Button>
            ))}
          </div>
          
          {/* 全屏按钮 */}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            {isFullscreen ? '退出全屏' : '全屏模式'}
          </Button>
        </div>
        
        {/* 统计信息 */}
        <div className="mt-3 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <span>真实直播: {liveStreams.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Grid className="w-3 h-3" />
            <span>网格: {currentConfig.cols} × {currentConfig.rows}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>总画面: {currentConfig.count}</span>
          </div>
        </div>
      </div>

      {/* 多屏网格 */}
      <div className={`
        grid gap-1 lg:gap-2 w-full
        ${isFullscreen ? 'h-screen p-2' : ''}
      `}
      style={{
        gridTemplateColumns: `repeat(${currentConfig.cols}, 1fr)`,
        gridTemplateRows: `repeat(${currentConfig.rows}, 1fr)`
      }}>
        {gridStreams.map((stream, index) => (
          <div
            key={stream.displayId}
            className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105 hover:z-10 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            onClick={() => handleStreamClick(stream)}
          >
            {/* 实时画面或演示画面 */}
            {liveStreams.find(s => s.id === stream.id) ? (
              <LiveThumbnail 
                streamId={stream.id} 
                className="w-full h-full aspect-video"
                showViewerCount={selectedGrid <= 16} // 只在16分屏以下显示观看人数
              />
            ) : (
              /* 演示画面 */
              <div className="w-full aspect-video bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center text-white relative">
                <div className="text-center">
                  <Play className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                  <div className="text-xs font-bold">演示直播</div>
                </div>
                
                {/* DEMO 标识 */}
                <Badge className="absolute top-1 left-1 bg-orange-500 text-white text-xs">
                  DEMO
                </Badge>
                
                {selectedGrid <= 16 && (
                  <Badge className="absolute top-1 right-1 bg-black/50 text-white text-xs">
                    <Users className="w-2 h-2 mr-1" />
                    {Math.floor(Math.random() * 200) + 10}
                  </Badge>
                )}
              </div>
            )}
            
            {/* 悬停信息 */}
            {selectedGrid <= 32 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                <div className="text-xs font-medium truncate">{stream.title}</div>
                <div className="text-xs text-gray-300">${stream.price}</div>
              </div>
            )}
            
            {/* 播放按钮覆盖层 */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-white/90 rounded-full flex items-center justify-center">
                <Play className="w-4 h-4 lg:w-6 lg:h-6 text-primary ml-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 底部提示 */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          🚀 为ETH全球黑客松打造的震撼多屏体验 • 
          真实直播: {liveStreams.length} • 
          演示画面: {currentConfig.count - liveStreams.length}
        </p>
        <p className="text-xs mt-1">
          💡 点击任意画面进入观看模式 • 支持最大{GRID_CONFIGS[GRID_CONFIGS.length - 1].count}分屏显示
        </p>
      </div>
    </div>
  );
}