import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserRatingProps {
  rating: number;
  totalRatings: number;
  completedOrders?: number;
  trustScore?: number;
  className?: string;
  showDetails?: boolean;
}

export function UserRating({ 
  rating, 
  totalRatings, 
  completedOrders, 
  trustScore, 
  className,
  showDetails = false 
}: UserRatingProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star 
            key={i} 
            className="w-4 h-4 fill-yellow-400 text-yellow-400" 
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <Star className="w-4 h-4 text-gray-300 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star 
            key={i} 
            className="w-4 h-4 text-gray-300" 
          />
        );
      }
    }
    return stars;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-green-500";
    if (rating >= 3.5) return "text-yellow-600";
    if (rating >= 3.0) return "text-orange-500";
    return "text-red-500";
  };

  const getTrustLevel = (trustScore: number) => {
    if (trustScore >= 4.5) return { label: "Highly Trusted", color: "bg-green-500/20 text-green-600" };
    if (trustScore >= 4.0) return { label: "Trusted", color: "bg-green-500/20 text-green-600" };
    if (trustScore >= 3.5) return { label: "Reliable", color: "bg-yellow-500/20 text-yellow-600" };
    if (trustScore >= 3.0) return { label: "Developing", color: "bg-orange-500/20 text-orange-600" };
    return { label: "New User", color: "bg-gray-500/20 text-gray-600" };
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {renderStars(rating)}
      </div>
      
      <span className={cn("font-medium", getRatingColor(rating))}>
        {rating.toFixed(1)}
      </span>
      
      {totalRatings > 0 && (
        <span className="text-sm text-muted-foreground">
          ({totalRatings} reviews)
        </span>
      )}

      {showDetails && (
        <div className="flex items-center gap-2 ml-2">
          {completedOrders !== undefined && (
            <Badge variant="outline" className="text-xs">
              {completedOrders} completed
            </Badge>
          )}
          
          {trustScore !== undefined && (
            <Badge 
              className={cn("text-xs", getTrustLevel(trustScore).color)}
            >
              {getTrustLevel(trustScore).label}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}