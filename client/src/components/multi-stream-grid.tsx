import { useState } from 'react';
import { LiveThumbnail } from '@/components/live-thumbnail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/translated-text';
import { Play, Grid, Maximize2, Users, X } from 'lucide-react';
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
  const [closedStreams, setClosedStreams] = useState<Set<string>>(new Set()); // 跟踪关闭的视频

  const currentConfig = GRID_CONFIGS.find(config => config.count === selectedGrid) || GRID_CONFIGS[1];
  
  // 获取所有可用的实时直播流（排除已关闭的流）
  const availableStreams = streams.filter(stream => 
    stream.status === 'live' && !closedStreams.has(stream.id)
  );
  
  // 获取更多真实直播源用于补充（包括其他状态的流，模拟未来有足够视频源的场景）
  const allPotentialStreams = streams.filter(stream => !closedStreams.has(stream.id));
  const liveStreams = availableStreams;
  
  // 性能保护机制
  const isLowPerformance = currentConfig.count >= 64; // 64分屏以上进入低性能模式
  const isUltraLowPerformance = currentConfig.count >= 128; // 128分屏以上进入超低性能模式（1fps动画）
  const enableWebSocketLimit = Math.min(currentConfig.count, 16); // 最多16个WebSocket连接
  
  // 智能填充网格：优先使用真实直播源，不足时补充演示内容
  const gridStreams = [];
  
  for (let i = 0; i < currentConfig.count; i++) {
    // 第一优先级：可用的实时直播流
    if (availableStreams[i]) {
      gridStreams.push({
        ...availableStreams[i],
        displayId: `${availableStreams[i].id}-${i}`,
        isRealStream: true
      });
    }
    // 第二优先级：循环使用现有实时直播流（模拟未来视频源足够多的场景）
    else if (availableStreams.length > 0) {
      const sourceStream = availableStreams[i % availableStreams.length];
      gridStreams.push({
        ...sourceStream,
        displayId: `${sourceStream.id}-cycle-${i}`,
        title: `${sourceStream.title} (补充源${Math.floor(i / availableStreams.length) + 1})`,
        isRealStream: true, // 仍然是真实直播源，只是循环使用
        isCycledStream: true // 标记为循环流
      });
    }
    // 第三优先级：MVP阶段的演示视频（视频源不足时的降级方案）
    else {
      gridStreams.push({
        id: `demo-${i}`,
        displayId: `demo-${i}`,
        title: `等待直播源 ${i + 1}`,
        description: 'MVP阶段演示内容，未来将是实时直播',
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
        updatedAt: new Date(),
        isRealStream: false,
        isDemoStream: true
      });
    }
  }

  const handleStreamClick = (stream: any) => {
    if (onStreamClick && stream.isRealStream) {
      // 真实直播源可以点击进入
      onStreamClick(stream.id);
    } else if (stream.isDemoStream) {
      // 演示流显示提示
      console.log('点击了MVP演示流，未来将是真实直播源');
    } else {
      console.log('点击了直播流');
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

  // 关闭视频流
  const handleCloseStream = (streamId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 防止触发视频点击事件
    console.log(`关闭视频流: ${streamId}`);
    setClosedStreams(prev => new Set([...Array.from(prev), streamId]));
  };

  // 重置关闭的流
  const handleResetClosedStreams = () => {
    console.log('重置所有关闭的视频流');
    setClosedStreams(new Set());
  };

  return (
    <div className="space-y-4">
      {/* 网格配置控制面板 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Grid className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">多屏直播墙</h3>
              <p className="text-sm text-blue-100">选择网格布局，同时观看多个直播</p>
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
        
        {/* 统计信息和性能提示 */}
        <div className="mt-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <span>实时直播源: {availableStreams.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <Grid className="w-3 h-3" />
              <span>网格: {currentConfig.cols} × {currentConfig.rows}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>总画面: {currentConfig.count}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>WebSocket连接: {Math.min(enableWebSocketLimit, availableStreams.length)}</span>
            </div>
            {closedStreams.size > 0 && (
              <div className="flex items-center gap-1">
                <span>已关闭: {closedStreams.size}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetClosedStreams}
                  className="ml-2 h-6 px-2 text-xs border-white/20 text-white hover:bg-white/10"
                >
                  恢复全部
                </Button>
              </div>
            )}
          </div>
          
          {/* 性能提示 */}
          {isLowPerformance && (
            <div className="text-xs text-orange-200 flex items-center gap-1">
              ⚡ 低性能模式已启用 {isUltraLowPerformance ? '(1fps动画)' : '(5fps动画)'}
            </div>
          )}
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
            className={`relative group cursor-pointer border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
              isUltraLowPerformance ? '' : 'transform transition-all duration-200 hover:scale-105 hover:z-10'
            }`}
            onClick={() => handleStreamClick(stream)}
          >
            {/* 关闭按钮 - 只在真实直播上显示，且屏幕数量不超过64 */}
            {stream.isRealStream && currentConfig.count <= 64 && (
              <Button
                size="sm"
                variant="outline"
                className="absolute top-1 right-1 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 border-0 text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleCloseStream(stream.id, e)}
                title="关闭此视频"
              >
                <X className="w-3 h-3" />
              </Button>
            )}

            {/* 实时画面或演示画面 */}
            {stream.isRealStream ? (
              <LiveThumbnail 
                streamId={stream.id} 
                className="w-full h-full aspect-video"
                showViewerCount={currentConfig.count <= 16} // 只在16分屏以下显示观看人数
                enableWebSocket={index < enableWebSocketLimit} // 限制WebSocket数量
                lowPerformance={isLowPerformance} // 启用低性能模式
              />
            ) : (
              /* MVP阶段演示画面 - 等待真实直播源 */
              <div className="w-full aspect-video bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 flex items-center justify-center text-white relative">
                <div className="text-center">
                  <Play className={`w-8 h-8 mx-auto mb-2 ${isLowPerformance ? '' : 'animate-pulse'}`} />
                  {currentConfig.count <= 32 && (
                    <div className="text-xs font-bold">等待直播源</div>
                  )}
                </div>
                
                {/* MVP 标识 - 只在小网格时显示 */}
                {currentConfig.count <= 32 && (
                  <Badge className="absolute top-1 left-1 bg-blue-500 text-white text-xs">
                    MVP
                  </Badge>
                )}
                
                {currentConfig.count <= 16 && (
                  <Badge className="absolute top-1 right-1 bg-black/50 text-white text-xs">
                    <Users className="w-2 h-2 mr-1" />
                    待上线
                  </Badge>
                )}
              </div>
            )}
            
            {/* 悬停信息 - 只在小网格时显示 */}
            {currentConfig.count <= 32 && !isUltraLowPerformance && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                <div className="text-xs font-medium truncate">{stream.title}</div>
                <div className="text-xs text-gray-300">${stream.price}</div>
              </div>
            )}
            
            {/* 播放按钮覆盖层 - 大网格时简化 */}
            {!isUltraLowPerformance && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`bg-white/90 rounded-full flex items-center justify-center ${
                  currentConfig.count <= 32 ? 'w-8 h-8 lg:w-12 lg:h-12' : 'w-4 h-4'
                }`}>
                  <Play className={`text-primary ml-0.5 ${
                    currentConfig.count <= 32 ? 'w-4 h-4 lg:w-6 lg:h-6' : 'w-2 h-2'
                  }`} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 底部提示 */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          📺 实时视频调度平台 • 
          直播源: {availableStreams.length} • 
          补充/演示: {currentConfig.count - availableStreams.length}
          {closedStreams.size > 0 && ` • 已关闭: ${closedStreams.size}`}
        </p>
        <p className="text-xs mt-1">
          💡 关闭不感兴趣的视频自动补充新源 • 未来将有无限实时直播源 • 当前MVP阶段视频源有限
        </p>
      </div>
    </div>
  );
}