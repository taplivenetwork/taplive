import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserRating } from "@/components/user-rating";
import { MapPin, Wifi, Smartphone, Clock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProviderRanking } from "@shared/dispatch";

interface ProviderRankingProps {
  ranking: ProviderRanking;
  className?: string;
  showDetails?: boolean;
}

export function ProviderRankingCard({ ranking, className, showDetails = false }: ProviderRankingProps) {
  const { user, dispatchScore, factors, rank } = ranking;

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
    if (rank === 2) return "bg-gray-400/20 text-gray-600 border-gray-400/30";
    if (rank === 3) return "bg-amber-600/20 text-amber-700 border-amber-600/30";
    return "bg-blue-500/20 text-blue-600 border-blue-500/30";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card className={cn("p-4 space-y-3", className)} data-testid={`provider-ranking-${user.id}`}>
      {/* Header with rank and basic info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={cn("text-xs font-bold", getRankBadgeColor(rank))} data-testid="provider-rank">
            #{rank}
          </Badge>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-foreground">{user.name}</div>
              <UserRating 
                rating={parseFloat(user.rating || '0')} 
                totalRatings={user.totalRatings || 0}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className={cn("text-lg font-bold", getScoreColor(dispatchScore))} data-testid="dispatch-score">
            {dispatchScore.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">
            Dispatch Score
          </div>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1" data-testid="distance">
          <MapPin className="w-4 h-4" />
          <span>{factors.distance.toFixed(1)}km</span>
        </div>
        
        <div className="flex items-center gap-1" data-testid="network-speed">
          <Wifi className="w-4 h-4" />
          <span>{user.networkSpeed}Mbps</span>
        </div>
        
        <div className="flex items-center gap-1" data-testid="device-performance">
          <Smartphone className="w-4 h-4" />
          <span>{user.devicePerformance}/100</span>
        </div>
        
        <div className="flex items-center gap-1" data-testid="response-time">
          <Clock className="w-4 h-4" />
          <span>{user.responseTime}min</span>
        </div>
      </div>

      {/* Detailed breakdown if requested */}
      {showDetails && (
        <div className="space-y-3 pt-3 border-t border-border">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Score Breakdown
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Distance (35%)
              </span>
              <span className="font-medium">{factors.distanceScore.toFixed(1)}/100</span>
            </div>
            <Progress value={factors.distanceScore} className="h-1" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Trust Score (25%)
              </span>
              <span className="font-medium">{factors.trustScore.toFixed(1)}/100</span>
            </div>
            <Progress value={factors.trustScore} className="h-1" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Network Speed (20%)
              </span>
              <span className="font-medium">{factors.networkScore.toFixed(1)}/100</span>
            </div>
            <Progress value={factors.networkScore} className="h-1" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Device Performance (10%)
              </span>
              <span className="font-medium">{factors.deviceScore.toFixed(1)}/100</span>
            </div>
            <Progress value={factors.deviceScore} className="h-1" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Response Time (10%)
              </span>
              <span className="font-medium">{factors.responseScore.toFixed(1)}/100</span>
            </div>
            <Progress value={factors.responseScore} className="h-1" />
          </div>
        </div>
      )}
    </Card>
  );
}