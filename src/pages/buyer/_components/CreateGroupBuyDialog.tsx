import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CreateGroupBuyDialogProps = {
  productId: Id<"products">;
  productName: string;
  onCreated?: () => void;
  trigger?: React.ReactNode;
};

export default function CreateGroupBuyDialog({
  productId,
  productName,
  onCreated,
  trigger,
}: CreateGroupBuyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: `Group Buy: ${productName}`,
    description: "",
    targetQuantity: 10,
    initialQuantity: 1,
    minimumParticipants: 3,
    daysUntilDeadline: 14,
  });

  const createGroupBuy = useMutation(api.groupBuys.createGroupBuy);

  // TODO: Replace this with your actual user context/hook
  // For example, useAuth() or useUser() depending on your app
  // Here is a placeholder:
  const userId = undefined as Id<"users"> | undefined; // <-- Replace with actual user id

  const handleCreate = async () => {
    if (formData.initialQuantity < 1) {
      toast.error("Initial quantity must be at least 1");
      return;
    }

    if (formData.targetQuantity < formData.initialQuantity) {
      toast.error("Target quantity must be greater than initial quantity");
      return;
    }

    if (formData.minimumParticipants < 2) {
      toast.error("Minimum participants must be at least 2");
      return;
    }

    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    setIsCreating(true);
    try {
      const deadline =
        Date.now() + formData.daysUntilDeadline * 24 * 60 * 60 * 1000;

      await createGroupBuy({
        userId,
        productId,
        title: formData.title,
        description: formData.description || undefined,
        targetQuantity: formData.targetQuantity,
        initialQuantity: formData.initialQuantity,
        minimumParticipants: formData.minimumParticipants,
        deadline,
      });

      toast.success("Group buy created successfully!");
      setOpen(false);
      setFormData({
        title: `Group Buy: ${productName}`,
        description: "",
        targetQuantity: 10,
        initialQuantity: 1,
        minimumParticipants: 3,
        daysUntilDeadline: 14,
      });
      onCreated?.();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create group buy");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="size-4 mr-2" />
            Start Group Buy
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Group Buy</DialogTitle>
          <DialogDescription>
            Invite other hospitals to join and save money through bulk
            purchasing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Group Buy: Hospital Beds"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Looking for high-quality hospital beds for expansion project..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialQuantity">Your Quantity</Label>
              <Input
                id="initialQuantity"
                type="number"
                min="1"
                value={formData.initialQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    initialQuantity: parseInt(e.target.value) || 1,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Units you need</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetQuantity">Target Quantity</Label>
              <Input
                id="targetQuantity"
                type="number"
                min={formData.initialQuantity}
                value={formData.targetQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetQuantity: parseInt(e.target.value) || 10,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Total goal</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minimumParticipants">Min. Participants</Label>
              <Input
                id="minimumParticipants"
                type="number"
                min="2"
                value={formData.minimumParticipants}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumParticipants: parseInt(e.target.value) || 3,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Required to activate
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="daysUntilDeadline">Deadline (days)</Label>
              <Input
                id="daysUntilDeadline"
                type="number"
                min="1"
                max="90"
                value={formData.daysUntilDeadline}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    daysUntilDeadline: parseInt(e.target.value) || 14,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Days from now</p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How Group Buying Works
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Other hospitals join your group buy</li>
              <li>• Vendors offer better prices for bulk orders</li>
              <li>• Everyone saves money together</li>
              <li>• Each hospital orders and pays separately</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Group Buy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
