import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth.ts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RatingDialogProps = {
  vendorId: Id<"users">;
  vendorName: string;
  rfqId: Id<"rfqs">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderValue?: number;
};

export default function RatingDialog({
  vendorId,
  vendorName,
  rfqId,
  open,
  onOpenChange,
  orderValue,
}: RatingDialogProps) {
  const { user } = useAuth() as { user: any };
  const [overallRating, setOverallRating] = useState(0);
  const [overallHover, setOverallHover] = useState(0);

  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryHover, setDeliveryHover] = useState(0);

  const [communicationRating, setCommunicationRating] = useState(0);
  const [communicationHover, setCommunicationHover] = useState(0);

  const [qualityRating, setQualityRating] = useState(0);
  const [qualityHover, setQualityHover] = useState(0);

  const [wouldRecommend, setWouldRecommend] = useState<boolean | undefined>(
    undefined,
  );
  const [review, setReview] = useState("");

  const submitRating = useMutation(api.ratings.submitRating);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    try {
      await submitRating({
        vendorId,
        rfqId,
        rating: overallRating,
        review: review.trim() || undefined,
        deliveryRating: deliveryRating || undefined,
        communicationRating: communicationRating || undefined,
        qualityRating: qualityRating || undefined,
        wouldRecommend,
        orderValue,
        userId: user._id,
      });
      toast.success("Thank you for your rating!");
      onOpenChange(false);
      // Reset form
      setOverallRating(0);
      setDeliveryRating(0);
      setCommunicationRating(0);
      setQualityRating(0);
      setWouldRecommend(undefined);
      setReview("");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to submit rating");
    }
  };

  const StarRating = ({
    rating,
    setRating,
    hover,
    setHover,
    label,
  }: {
    rating: number;
    setRating: (rating: number) => void;
    hover: number;
    setHover: (hover: number) => void;
    label: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`size-8 ${
                star <= (hover || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Your Experience with {vendorName}</DialogTitle>
          <DialogDescription>
            Help other hospitals make informed decisions by sharing your
            experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating */}
          <StarRating
            rating={overallRating}
            setRating={setOverallRating}
            hover={overallHover}
            setHover={setOverallHover}
            label="Overall Experience *"
          />

          {/* Specific Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StarRating
              rating={deliveryRating}
              setRating={setDeliveryRating}
              hover={deliveryHover}
              setHover={setDeliveryHover}
              label="Delivery Speed"
            />

            <StarRating
              rating={communicationRating}
              setRating={setCommunicationRating}
              hover={communicationHover}
              setHover={setCommunicationHover}
              label="Communication"
            />

            <StarRating
              rating={qualityRating}
              setRating={setQualityRating}
              hover={qualityHover}
              setHover={setQualityHover}
              label="Product Quality"
            />
          </div>

          {/* Would Recommend */}
          <div className="space-y-2">
            <Label>Would you recommend this vendor?</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={wouldRecommend === true ? "default" : "outline"}
                onClick={() => setWouldRecommend(true)}
                className="flex-1"
              >
                <ThumbsUp className="size-4 mr-2" />
                Yes
              </Button>
              <Button
                type="button"
                variant={wouldRecommend === false ? "destructive" : "outline"}
                onClick={() => setWouldRecommend(false)}
                className="flex-1"
              >
                <ThumbsDown className="size-4 mr-2" />
                No
              </Button>
            </div>
          </div>

          {/* Written Review */}
          <div className="space-y-2">
            <Label htmlFor="review">Share Your Experience (Optional)</Label>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell other hospitals about your experience with this vendor..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {review.length}/1000 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={overallRating === 0}>
            Submit Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
