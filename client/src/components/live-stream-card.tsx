import { useState, useMemo } from "react";
import { Play, Users, MapPin, Clock, Heart, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { T } from "@/components/T";
import { LiveThumbnail } from "@/components/live-thumbnail";
import type { Order } from "@shared/schema";

interface LiveStreamCardProps {
  stream: Order;
  onJoin?: (streamId: string) => void;
  onAccept?: (streamId: string) => void;
  onCancel?: (streamId: string) => void;
  onDelete?: (streamId: string) => void;
  isPending?: boolean;
  showActions?: boolean;
  isMyOrder?: boolean;
}

// Total number of placeholder images (update this when you add more images)
const TOTAL_PLACEHOLDER_IMAGES = 5;

export function LiveStreamCard({ stream, onJoin, onAccept, onCancel, onDelete, isPending = false, showActions = true, isMyOrder = false }: LiveStreamCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  
  // Get a random placeholder image that stays consistent for this stream instance
  const placeholderImage = useMemo(() => {
    // Use stream.id to generate a consistent random number for each stream
    const hash = stream.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const imageNumber = (hash % TOTAL_PLACEHOLDER_IMAGES) + 1;
    const imagePath = `/stream-placeholders/stream-${imageNumber}.jpg`;
    console.log(`Stream ${stream.id}: Using placeholder image ${imagePath}`);
    return imagePath;
  }, [stream.id]);
  
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement share functionality
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(stream.id);
    }
  };

  const handleAction = () => {
    if (isPending && onAccept) {
      onAccept(stream.id);
    } else if (onJoin) {
      onJoin(stream.id);
    } else {
      // Navigate to live stream page in viewer mode
      window.location.href = `/stream/${stream.id}?mode=viewer`;
    }
  };

  // 点击卡片任意位置进入观看
  const handleCardClick = (e: React.MouseEvent) => {
    // 避免按钮点击冲突
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // 直接进入观看模式
    window.location.href = `/stream/${stream.id}?mode=viewer`;
  };

  // Simulate viewer count based on stream data
  
  return (
    <Card 
      className="group overflow-hidden hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl hover:scale-[1.02]"
      data-testid={`stream-card-${stream.id}`}
      onClick={handleCardClick}
    >
      {/* Video Thumbnail/Preview */}
      <div className="relative aspect-video overflow-hidden bg-gray-900">
        {/* Show placeholder image for all streams */}
        <img 
          src={placeholderImage} 
          alt={stream.title}
          className="w-full h-full object-cover"
          onLoad={() => console.log(`Image loaded successfully: ${placeholderImage}`)}
          onError={(e) => {
            console.error(`Failed to load image: ${placeholderImage}`);
            console.error('Image element:', e.target);
          }}
        />
        
        {/* Live indicator for active streams - Enhanced
        {stream.status === 'live' && (
          <Badge className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1.5 text-sm font-bold shadow-lg shadow-red-500/50 animate-pulse border-2 border-white/30">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping" />
            <span className="ml-3">LIVE</span>
          </Badge>
        )} */}
        
        {/* Pending indicator */}
        {isPending && (
          <Badge className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-3 py-1.5 shadow-lg border-2 border-white/30">
            <Clock className="w-3 h-3 mr-1" />
            <T category="main_content" k="Scheduled" />
          </Badge>
        )}

        {/* Delete button - Top right with modern design */}
        {stream.status === 'live' && onDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-red-600 text-white border-2 border-white/20 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-10"
            onClick={handleDelete}
            data-testid={`button-delete-stream-${stream.id}`}
            title="Delete this live stream"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Viewer count - Enhanced with gradient
        {stream.status === 'live' && (
          <Badge className={`absolute top-4 ${onDelete ? 'right-16' : 'right-4'} bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 shadow-lg border-2 border-white/30 backdrop-blur-sm`}>
            <Users className="w-3 h-3 mr-1.5" />
            <span className="font-bold">{viewerCount}</span>
          </Badge>
        )} */}

        {/* Play button overlay - Enhanced */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-white/50 transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-10 h-10 text-purple-600 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Category badge - Modern pill design */}
        <Badge 
          variant="secondary" 
          className="absolute bottom-4 left-4 bg-white/95 text-gray-900 px-4 py-1.5 font-semibold shadow-lg backdrop-blur-sm border-0"
        >
          {stream.category || 'General'}
        </Badge>

        {/* Quick actions - Enhanced */}
        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <Button
            size="icon"
            variant="ghost"
            className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-gray-900 shadow-lg backdrop-blur-sm"
            onClick={handleLike}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-gray-900 shadow-lg backdrop-blur-sm"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stream Info - Enhanced spacing and typography */}
      <CardContent className="p-5 bg-gradient-to-br from-card to-card/50">
        <div className="space-y-4">
          {/* Title and Price */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-bold text-lg text-foreground line-clamp-2 flex-1 leading-tight">
              {stream.title}
            </h3>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ${stream.price}
              </div>
              {stream.status === 'live' && (
                <div className="text-xs font-semibold text-green-600 mt-1">
                  <T category="main_content" k="Live Now" />
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {stream.description}
          </p>

          {/* Location - Enhanced with better contrast */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
            <MapPin className="w-4 h-4 flex-shrink-0 text-purple-600" />
            <span className="line-clamp-1 font-medium">{stream.address}</span>
          </div>

          {/* Action Buttons - Full width, modern design */}
          <div className="flex flex-col gap-3 pt-2">
            {/* Main action button - Full width with gradient */}
            {showActions && stream.status !== 'cancelled' && (
              <Button 
                size="lg"
                onClick={handleAction}
                className={
                  isPending 
                    ? 'w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg shadow-purple-500/30 border-0' 
                    : stream.status === 'live'
                    ? 'w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/30 border-0'
                    : 'w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg shadow-purple-500/30 border-0'
                }
                data-testid={`button-${isPending ? 'accept' : 'join'}-stream-${stream.id}`}
              >
                {isPending ? (
                  <>
                    <Play className="w-5 h-5 mr-2" fill="currentColor" />
                    <span className="text-base">Accept & Go Live</span>
                  </>
                ) : stream.status === 'live' ? (
                  <>
                    <Play className="w-5 h-5 mr-2" fill="currentColor" />
                    <span className="text-base">Watch Stream</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" fill="currentColor" />
                    <span className="text-base">View Details</span>
                  </>
                )}
              </Button>
            )}

            {/* Bottom row: Status badge and Cancel button */}
            <div className="flex items-center justify-between">
              <Badge 
                variant={stream.status === 'live' ? 'default' : 'secondary'}
                className={
                  stream.status === 'live' ? 'bg-green-500/90 text-white px-3 py-1 font-semibold border-0' :
                  stream.status === 'pending' ? 'bg-orange-500/90 text-white px-3 py-1 font-semibold border-0' :
                  stream.status === 'cancelled' ? 'bg-red-500/90 text-white px-3 py-1 font-semibold border-0' :
                  'bg-gray-500/90 text-white px-3 py-1 font-semibold border-0'
                }
              >
                {stream.status === 'live' ? <T category="main_content" k="Live Now" /> :
                 stream.status === 'pending' ? <T category="main_content" k="Scheduled" /> :
                 stream.status === 'accepted' ? <T category="main_content" k="Connected" /> :
                 stream.status === 'cancelled' ? <T category="forms_buttons" k="Cancel" /> :
                 <T category="forms_buttons" k="Available" />}
              </Badge>

              {/* Cancel button */}
              {isMyOrder && stream.status !== 'live' && stream.status !== 'done' && stream.status !== 'cancelled' && onCancel && (
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(stream.id);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
                  data-testid={`button-cancel-order-${stream.id}`}
                >
                  <X className="w-4 h-4 mr-1" />
                  <T category="forms_buttons" k="Cancel" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}