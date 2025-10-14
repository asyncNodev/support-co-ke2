import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Calendar, TrendingUp, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type GroupBuy = {
  _id: Id<"groupBuys">;
  title: string;
  description?: string;
  product: {
    name: string;
    image?: string;
  } | null;
  participantCount: number;
  currentQuantity: number;
  targetQuantity: number;
  progress: number;
  daysLeft: number;
  minimumParticipants: number;
  expectedSavings?: number;
  deadline: number;
};

type GroupBuyCardProps = {
  groupBuy: GroupBuy;
  onJoin?: () => void;
};

export default function GroupBuyCard({ groupBuy, onJoin }: GroupBuyCardProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isJoining, setIsJoining] = useState(false);
  const joinGroupBuy = useMutation(api.groupBuys.joinGroupBuy);

  const handleJoin = async () => {
    if (quantity < 1) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setIsJoining(true);
    try {
      await joinGroupBuy({
        groupBuyId: groupBuy._id,
        quantity,
      });
      toast.success("Successfully joined group buy!");
      setOpen(false);
      onJoin?.();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to join group buy");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const savingsPercentage = groupBuy.expectedSavings || 15;
  const potentialSavings = savingsPercentage;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="size-5" />
              {groupBuy.product?.name || "Unknown Product"}
            </CardTitle>
            <CardDescription className="mt-1">{groupBuy.title}</CardDescription>
          </div>
          {groupBuy.product?.image && (
            <img
              src={groupBuy.product.image}
              alt={groupBuy.product.name}
              className="size-16 rounded-lg object-cover"
            />
          )}
        </div>
        {groupBuy.description && (
          <p className="text-sm text-muted-foreground mt-2">{groupBuy.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {groupBuy.currentQuantity} / {groupBuy.targetQuantity} units
            </span>
          </div>
          <Progress value={Math.min(groupBuy.progress, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {groupBuy.progress >= 100 ? "Target reached!" : `${Math.round(groupBuy.progress)}% of target`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Participants</p>
              <p className="text-sm font-semibold">{groupBuy.participantCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Time Left</p>
              <p className="text-sm font-semibold">
                {groupBuy.daysLeft === 0 ? "Today" : `${groupBuy.daysLeft} days`}
              </p>
            </div>
          </div>
        </div>

        {/* Savings Badge */}
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                Potential Savings
              </p>
              <p className="text-sm font-bold text-green-700 dark:text-green-300">
                Save up to {potentialSavings}% on bulk pricing
              </p>
            </div>
          </div>
        </div>

        {/* Requirements */}
        {groupBuy.participantCount < groupBuy.minimumParticipants && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="size-4 mt-0.5" />
            <p>
              Needs {groupBuy.minimumParticipants - groupBuy.participantCount} more{" "}
              {groupBuy.minimumParticipants - groupBuy.participantCount === 1 ? "participant" : "participants"}{" "}
              to activate
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              Join Group Buy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Group Buy</DialogTitle>
              <DialogDescription>
                Join {groupBuy.participantCount} other{" "}
                {groupBuy.participantCount === 1 ? "hospital" : "hospitals"} and save up to{" "}
                {potentialSavings}% on bulk pricing
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  placeholder="Enter quantity"
                />
                <p className="text-xs text-muted-foreground">
                  How many units do you need?
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current total:</span>
                  <span className="font-semibold">{groupBuy.currentQuantity} units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>After you join:</span>
                  <span className="font-semibold">{groupBuy.currentQuantity + quantity} units</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Estimated savings:</span>
                  <span className="font-bold">{potentialSavings}%</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleJoin} disabled={isJoining}>
                {isJoining ? "Joining..." : "Join Group Buy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
