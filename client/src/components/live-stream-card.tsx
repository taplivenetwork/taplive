import { useState } from "react";
import { Play, Users, MapPin, Clock, Heart, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export function LiveStreamCard({ stream, onJoin, onAccept, onCancel, onDelete, isPending = false, showActions = true, isMyOrder = false }: LiveStreamCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  
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

  const handleCardClick = (e: React.MouseEvent) => {

    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    

    window.location.href = `/stream/${stream.id}?mode=viewer`;
  };

<<<<<<< HEAD
  // Simulate viewer count based on stream data
  const viewerCount = stream.status === 'live' ? Math.floor(Math.random() * 1000) + 50 : 0;
=======
  // Get viewer count from stream data or use random for demo
  const viewerCount = stream.status === 'live' ? (stream as any).viewerCount || Math.floor(Math.random() * 1000) + 50 : 0;
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
  
  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer glass-card card-hover hover:scale-105"
      data-testid={`stream-card-${stream.id}`}
      onClick={handleCardClick}
    >
      {/* Video Thumbnail/Preview */}
<<<<<<< HEAD
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 overflow-hidden">
=======
      <div className="relative aspect-video bg-gradient-to-br from-orange-400 via-red-500 to-green-400 overflow-hidden">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
        {stream.status === 'live' ? (
          <LiveThumbnail 
            streamId={stream.id} 
            className="w-full h-full"
            showViewerCount={false} 
          />
        ) : (
<<<<<<< HEAD
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20" />
=======
          <div className="w-full h-full bg-gradient-to-br from-orange-400 via-red-500 to-green-400" />
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
        )}
        {/* Live indicator for active streams */}
        {stream.status === 'live' && (
          <Badge className="absolute top-3 left-3 bg-red-500 text-white animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full mr-2" />
            LIVE
          </Badge>
        )}
        
        {/* Pending indicator */}
        {isPending && (
          <Badge className="absolute top-3 left-3 bg-orange-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        )}

        {/* Delete button for live streams - positioned at top-right corner */}
        {stream.status === 'live' && onDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 w-7 h-7 bg-red-500/90 hover:bg-red-600 text-white border border-white/20 shadow-lg opacity-80 hover:opacity-100 transition-all z-10"
            onClick={handleDelete}
            data-testid={`button-delete-stream-${stream.id}`}
            title="Delete this live stream"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Viewer count for live streams */}
        {stream.status === 'live' && (
          <Badge className={`absolute top-3 ${onDelete ? 'right-12' : 'right-3'} bg-black/70 text-white`}>
            <Users className="w-3 h-3 mr-1" />
            {viewerCount}
          </Badge>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-primary ml-1" />
          </div>
        </div>

        {/* Category badge */}
        <Badge 
          variant="secondary" 
          className="absolute bottom-3 left-3 bg-white/90 text-black"
        >
          {stream.category || 'General'}
        </Badge>

        {/* Quick actions */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8 bg-white/90 hover:bg-white text-black"
            onClick={handleLike}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8 bg-white/90 hover:bg-white text-black"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stream Info */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title and Price */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-foreground line-clamp-2 flex-1">
              {stream.title}
            </h3>
            <div className="text-right flex-shrink-0">
<<<<<<< HEAD
              <div className="text-lg font-bold text-primary">
                ${stream.price}
              </div>
              {stream.status === 'live' && (
                <div className="text-xs text-green-600">
=======
              <div className="text-xl font-bold text-primary">
                ${stream.price}
              </div>
              {stream.status === 'live' && (
                <div className="text-base text-green-600">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
                  Live Now
                </div>
              )}
            </div>
          </div>

          {/* Description */}
<<<<<<< HEAD
          <p className="text-sm text-muted-foreground line-clamp-2">
=======
          <p className="text-base text-muted-foreground line-clamp-2">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
            {stream.description}
          </p>

          {/* Location */}
<<<<<<< HEAD
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
=======
          <div className="flex items-center gap-2 text-base text-muted-foreground">
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">{stream.address}</span>
          </div>

          {/* Status and Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Badge 
              variant={stream.status === 'live' ? 'default' : 'secondary'}
              className={
                stream.status === 'live' ? 'bg-green-500 text-white' :
                stream.status === 'pending' ? 'bg-orange-500 text-white' :
                stream.status === 'cancelled' ? 'bg-red-500 text-white' :
                'bg-gray-500 text-white'
              }
            >
              {stream.status === 'live' ? 'Live Now' :
               stream.status === 'pending' ? 'Scheduled' :
               stream.status === 'accepted' ? 'Connected' :
               stream.status === 'cancelled' ? 'Cancel' :
               'Available'}
            </Badge>

            <div className="flex gap-2">
              {/* Cancel button for my orders */}
              {isMyOrder && stream.status !== 'live' && stream.status !== 'done' && stream.status !== 'cancelled' && onCancel && (
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(stream.id);
                  }}
                  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                  data-testid={`button-cancel-order-${stream.id}`}
                >
                  Cancel
                </Button>
              )}

              {/* Main action button */}
              {showActions && stream.status !== 'cancelled' && (
                <Button 
                  size="sm"
                  onClick={handleAction}
                  className={isPending ? 'bg-primary hover:bg-primary/90' : 'bg-green-600 hover:bg-green-700'}
                  data-testid={`button-${isPending ? 'accept' : 'join'}-stream-${stream.id}`}
                >
                  {isPending ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Live Now
                    </>
                  ) : stream.status === 'live' ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Watch Stream
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      View
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}