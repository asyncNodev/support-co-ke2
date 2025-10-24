import { useEffect, useState } from "react";
import type { User } from "@/contexts/AuthContext.tsx";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Bell, CheckCircle, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function NotificationSettings() {
  const { user } = useAuth() as { user: User | null };
  const updatePreferences = useMutation(
    api.users.updateNotificationPreferences,
  );

  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setWhatsappEnabled(user.whatsappNotifications ?? false);
      setEmailEnabled(user.emailNotifications ?? false);
    }
  }, [user]);

  const handleToggle = async (type: "whatsapp" | "email", value: boolean) => {
    setSaving(true);
    try {
      if (type === "whatsapp") {
        setWhatsappEnabled(value);
        await updatePreferences({ whatsappNotifications: value });
      } else {
        setEmailEnabled(value);
        await updatePreferences({ emailNotifications: value });
      }
      toast.success("Notification preferences updated");
    } catch (error) {
      toast.error("Failed to update preferences");
      // Revert on error
      if (type === "whatsapp") {
        setWhatsappEnabled(!value);
      } else {
        setEmailEnabled(!value);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  const hasPhone = user.phone && user.phone.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="size-5" />
          <CardTitle>Notification Preferences</CardTitle>
        </div>
        <CardDescription>
          Choose how you want to receive notifications about your RFQs and
          quotations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* WhatsApp Notifications */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="size-4 text-green-600" />
              <Label htmlFor="whatsapp" className="text-base font-medium">
                WhatsApp Notifications
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {hasPhone
                ? `Receive instant notifications on WhatsApp (${user.phone})`
                : "Add your phone number in your profile to enable WhatsApp notifications"}
            </p>
            {whatsappEnabled && hasPhone && (
              <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                <CheckCircle className="size-3" />
                Active - You'll receive WhatsApp notifications
              </div>
            )}
          </div>
          <Switch
            id="whatsapp"
            checked={whatsappEnabled}
            onCheckedChange={(checked) => handleToggle("whatsapp", checked)}
            disabled={saving || !hasPhone}
          />
        </div>

        {/* Email Notifications */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="size-4 text-blue-600" />
              <Label htmlFor="email" className="text-base font-medium">
                Email Notifications
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email ({user.email})
            </p>
            {emailEnabled && (
              <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                <CheckCircle className="size-3" />
                Active - You'll receive email notifications
              </div>
            )}
          </div>
          <Switch
            id="email"
            checked={emailEnabled}
            onCheckedChange={(checked) => handleToggle("email", checked)}
            disabled={saving}
          />
        </div>

        {/* What you'll receive */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">You'll be notified about:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {user.role === "vendor" && (
              <>
                <li>• New RFQs matching your categories</li>
                <li>• When your quotation is chosen by a buyer</li>
                <li>• Important platform updates</li>
              </>
            )}
            {user.role === "buyer" && (
              <>
                <li>• New quotations received for your RFQs</li>
                <li>• Price comparisons and savings opportunities</li>
                <li>• Group buying opportunities</li>
                <li>• RFQ status updates</li>
              </>
            )}
            {user.role === "admin" && (
              <>
                <li>• New user registrations</li>
                <li>• Platform activity and alerts</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
