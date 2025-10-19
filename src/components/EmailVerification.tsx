import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function EmailVerification({ userId }: { userId: string }) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const verify = useMutation(api.auth.verifyCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await verify({ userId, code });
      toast.success("Email verified successfully");
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Verify Your Email</h2>
      <p className="text-sm text-gray-600">
        Please enter the 6-digit code sent to your email
      </p>
      <Input
        type="text"
        pattern="\d{6}"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter verification code"
        required
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Verifying..." : "Verify Email"}
      </Button>
    </form>
  );
}
