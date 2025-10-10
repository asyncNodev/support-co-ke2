import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { AlertCircle, Building, Mail, Phone, User, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Array<{ productId: Id<"products">; quantity: number }>;
  expectedDeliveryTime: string;
  onSuccess: () => void;
};

export default function GuestRFQDialog({ open, onOpenChange, items, expectedDeliveryTime, onSuccess }: Props) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCompanyName, setGuestCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitGuestRFQ = useMutation(api.rfqs.submitGuestRFQ);

  const handleSubmit = async () => {
    if (!guestName || !guestEmail || !guestPhone || !guestCompanyName) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitGuestRFQ({
        items,
        expectedDeliveryTime,
        guestName,
        guestEmail,
        guestPhone,
        guestCompanyName,
      });

      toast.success(`RFQ submitted! ${result.matchedCount} quotations sent immediately.`);
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setGuestCompanyName("");
    } catch (error) {
      toast.error("Failed to submit RFQ: " + String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit RFQ as Guest</DialogTitle>
          <DialogDescription>
            Enter your information to submit an RFQ. Your details will be shared with vendors immediately.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Want to reach more vendors?</AlertTitle>
          <AlertDescription>
            Registered users get quotations from ALL vendors. Guest users only receive quotations from vendors who
            accept unregistered buyers. <strong>Register to maximize your responses!</strong>
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="guestName">
              <User className="inline h-4 w-4 mr-2" />
              Your Name
            </Label>
            <Input
              id="guestName"
              placeholder="John Doe"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestCompanyName">
              <Building className="inline h-4 w-4 mr-2" />
              Hospital / Company Name
            </Label>
            <Input
              id="guestCompanyName"
              placeholder="Nairobi General Hospital"
              value={guestCompanyName}
              onChange={(e) => setGuestCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestEmail">
              <Mail className="inline h-4 w-4 mr-2" />
              Email Address
            </Label>
            <Input
              id="guestEmail"
              type="email"
              placeholder="john@hospital.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestPhone">
              <Phone className="inline h-4 w-4 mr-2" />
              Phone Number
            </Label>
            <Input
              id="guestPhone"
              type="tel"
              placeholder="+254 700 000 000"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
              window.location.href = "/register";
            }}
            disabled={isSubmitting}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Register Instead
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Guest RFQ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
