import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, User, XCircle } from "lucide-react";
import { toast } from "sonner";

type ApprovalWorkflowDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfqId: Id<"rfqs">;
  rfqItems: Array<{
    _id: Id<"rfqItems">;
    productId: Id<"products">;
    quantity: number;
    product?: {
      name: string;
    };
  }>;
};

export default function ApprovalWorkflowDialog({
  open,
  onOpenChange,
  rfqId,
  rfqItems,
}: ApprovalWorkflowDialogProps) {
  const [estimatedValue, setEstimatedValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const approvers = useQuery(api.approvals.getOrganizationApprovers, {});
  const approvalHistory = useQuery(api.approvals.getApprovalHistory, { rfqId });
  const submitForApproval = useMutation(api.approvals.submitForApproval);

  const handleSubmit = async () => {
    if (!estimatedValue || parseFloat(estimatedValue) <= 0) {
      toast.error("Please enter a valid estimated value");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitForApproval({
        rfqId,
        estimatedValue: parseFloat(estimatedValue),
      });
      toast.success("RFQ submitted for approval");
      onOpenChange(false);
      setEstimatedValue("");
    } catch (error) {
      toast.error("Failed to submit for approval");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalQuantity = rfqItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit RFQ for Approval</DialogTitle>
          <DialogDescription>
            This RFQ requires approval before being sent to vendors. Enter the estimated total value
            and it will be routed to the appropriate approvers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* RFQ Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">RFQ Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Items:</span> {rfqItems.length} products
              </div>
              <div className="text-sm">
                <span className="font-medium">Total Quantity:</span> {totalQuantity} units
              </div>
              <div className="space-y-1 mt-3">
                {rfqItems.map((item) => (
                  <div key={item._id} className="text-sm flex justify-between">
                    <span>{item.product?.name || "Unknown Product"}</span>
                    <span className="text-muted-foreground">Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Estimated Value */}
          <div className="space-y-2">
            <Label htmlFor="estimatedValue">
              Estimated Total Value (KES) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="estimatedValue"
              type="number"
              placeholder="e.g. 500000"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              min="0"
              step="1000"
            />
            <p className="text-xs text-muted-foreground">
              Enter your best estimate of the total cost for budgeting purposes
            </p>
          </div>

          {/* Approval Chain */}
          {approvers && approvers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approval Chain</CardTitle>
                <CardDescription>
                  This RFQ will be sent to the following approvers in order:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {approvers.map((approver, index) => (
                    <div key={approver._id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-full bg-muted text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{approver.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {approver.organizationRole?.replace(/_/g, " ")}
                        </div>
                      </div>
                      {approver.canApproveUpTo && (
                        <Badge variant="secondary" className="text-xs">
                          Up to KES {approver.canApproveUpTo.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval History (if any) */}
          {approvalHistory && approvalHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approval History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {approvalHistory.map((history) => (
                    <div key={history._id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="mt-1">
                        {history.status === "approved" ? (
                          <CheckCircle2 className="size-5 text-green-600" />
                        ) : history.status === "rejected" ? (
                          <XCircle className="size-5 text-destructive" />
                        ) : (
                          <Clock className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{history.approver?.name}</span>
                          <Badge
                            variant={
                              history.status === "approved"
                                ? "default"
                                : history.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {history.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Level {history.approverLevel} •{" "}
                          {history.respondedAt
                            ? new Date(history.respondedAt).toLocaleString()
                            : "Pending"}
                        </div>
                        {history.comments && (
                          <div className="text-sm mt-2 p-2 bg-muted rounded">
                            {history.comments}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {approvers && approvers.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <User className="size-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No approvers configured in your organization.</p>
                  <p className="text-xs mt-1">Contact your admin to set up approval workflow.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !estimatedValue || !approvers || approvers.length === 0}
          >
            {isSubmitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
