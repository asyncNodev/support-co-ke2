import { Shield, CheckCircle2, Star, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type VerificationLevel = "none" | "email" | "business" | "full";

interface TrustBadgeProps {
  verificationLevel?: VerificationLevel;
  trustScore?: number;
  className?: string;
}

export function TrustBadge({ verificationLevel = "none", trustScore, className }: TrustBadgeProps) {
  if (verificationLevel === "none" && !trustScore) return null;

  const getBadgeConfig = () => {
    if (verificationLevel === "full") {
      return {
        icon: <Award className="size-3" />,
        label: "Fully Verified",
        variant: "default" as const,
        color: "bg-green-600",
      };
    } else if (verificationLevel === "business") {
      return {
        icon: <Shield className="size-3" />,
        label: "Business Verified",
        variant: "secondary" as const,
        color: "bg-blue-600",
      };
    } else if (verificationLevel === "email") {
      return {
        icon: <CheckCircle2 className="size-3" />,
        label: "Email Verified",
        variant: "outline" as const,
        color: "bg-gray-600",
      };
    }
    return null;
  };

  const config = getBadgeConfig();
  if (!config) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className={className}>
          {config.icon}
          <span className="ml-1">{config.label}</span>
          {trustScore !== undefined && trustScore >= 80 && (
            <Star className="size-3 ml-1 fill-current" />
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p className="font-semibold">{config.label}</p>
          {trustScore !== undefined && (
            <p className="text-muted-foreground">Trust Score: {trustScore}/100</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
