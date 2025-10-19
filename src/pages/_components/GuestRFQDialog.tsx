import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type GuestRFQDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Array<{ productId: Id<"products">; quantity: number }>;
  expectedDeliveryTime: string;
  onSuccess: () => void;
};

export default function GuestRFQDialog({
  open,
  onOpenChange,
  items,
  expectedDeliveryTime,
  onSuccess,
}: GuestRFQDialogProps) {
  const submitGuestRFQ = useMutation(api.rfqs.submitGuestRFQ);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    guestName: "",
    guestCompanyName: "",
    guestPhone: "",
    guestEmail: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guestName || !formData.guestCompanyName || !formData.guestPhone || !formData.guestEmail) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitGuestRFQ({
        items,
        expectedDeliveryTime,
        ...formData,
      });
      
      toast.success("RFQ submitted successfully! Vendors will contact you soon.");
      setFormData({
        guestName: "",
        guestCompanyName: "",
        guestPhone: "",
        guestEmail: "",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error("Failed to submit RFQ. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit RFQ as Guest</DialogTitle>
          <DialogDescription>
            Please provide your contact information so vendors can send you quotations.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> To reach more vendors and track your quotations, we recommend{" "}
            <a href="/register" className="underline font-medium">
              creating an account
            </a>
            . Guest RFQs may receive fewer responses.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guestName">Your Name *</Label>
            <Input
              id="guestName"
              value={formData.guestName}
              onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestCompanyName">Hospital / Company Name *</Label>
            <Input
              id="guestCompanyName"
              value={formData.guestCompanyName}
              onChange={(e) => setFormData({ ...formData, guestCompanyName: e.target.value })}
              placeholder="Nairobi General Hospital"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestPhone">Phone Number *</Label>
            <Input
              id="guestPhone"
              type="tel"
              value={formData.guestPhone}
              onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
              placeholder="+254 712 345 678"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestEmail">Email Address *</Label>
            <Input
              id="guestEmail"
              type="email"
              value={formData.guestEmail}
              onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
              placeholder="john@hospital.co.ke"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit RFQ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
