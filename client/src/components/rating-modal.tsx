import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TranslatedText } from "./translated-text";
import { cn } from "@/lib/utils";
import type { Order } from "@shared/schema";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  reviewType: 'creator_to_provider' | 'provider_to_creator';
  revieweeId: string;
  revieweeName: string;
}

export function RatingModal({ 
  open, 
  onOpenChange, 
  order, 
  reviewType, 
  revieweeId, 
  revieweeName 
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRatingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit rating');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${revieweeId}`] });
      onOpenChange(false);
      setRating(0);
      setComment("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    createRatingMutation.mutate({
      orderId: order.id,
      revieweeId,
      rating,
      comment: comment.trim() || undefined,
      reviewType,
      reviewerId: "temp-current-user-id", // This would come from auth context
    });
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          <Star
            className={cn(
              "w-8 h-8 transition-colors cursor-pointer",
              (hoveredRating >= i || rating >= i)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            )}
          />
        </button>
      );
    }
    return stars;
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <TranslatedText>Rate Your Experience</TranslatedText>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-foreground">{order.title}</h4>
            <p className="text-sm text-muted-foreground">
              <TranslatedText>Rating</TranslatedText>: {revieweeName}
            </p>
          </div>

          {/* Star Rating */}
          <div className="space-y-3">
            <div className="text-center">
              <div className="flex justify-center gap-1 mb-2">
                {renderStars()}
              </div>
              {rating > 0 && (
                <p className="text-sm font-medium text-muted-foreground">
                  <TranslatedText>{getRatingText(rating)}</TranslatedText>
                </p>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              <TranslatedText>Share your experience (optional)</TranslatedText>
            </label>
            <Textarea
              placeholder={`How was your experience with ${revieweeName}?`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              data-testid="textarea-rating-comment"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-rating"
            >
              <TranslatedText>Cancel</TranslatedText>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || createRatingMutation.isPending}
              className="flex-1"
              data-testid="button-submit-rating"
            >
              {createRatingMutation.isPending ? (
                <TranslatedText>Submitting...</TranslatedText>
              ) : (
                <TranslatedText>Submit Rating</TranslatedText>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}