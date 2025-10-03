import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Loader2, Database, User } from "lucide-react";
import { toast } from "sonner";

export default function SeedData() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const runSeed = useMutation(api.seedPublic.runSeed);
  const createBuyer = useMutation(api.createTestUser.createVerifiedBuyer);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      const result = await runSeed();
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to seed data");
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateBuyer = async () => {
    try {
      setIsCreatingUser(true);
      const result = await createBuyer({ 
        email: "m.ali270884@gmail.com",
        name: "M. Ali"
      });
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to create user");
      console.error(error);
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-2xl">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-6">
            <Database className="size-16 text-primary" />
            <h1 className="text-3xl font-bold">Database Management</h1>
            <p className="text-center text-muted-foreground">
              Load demo data or create test users for the medical supplies platform
            </p>

            <div className="flex flex-col gap-4 w-full">
              <Button
                onClick={handleSeed}
                disabled={isSeeding}
                size="lg"
                className="w-full"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Seeding Data...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 size-5" />
                    Seed Demo Data
                  </>
                )}
              </Button>

              <Button
                onClick={handleCreateBuyer}
                disabled={isCreatingUser}
                size="lg"
                variant="outline"
                className="w-full"
              >
                {isCreatingUser ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <User className="mr-2 size-5" />
                    Create Verified Buyer (m.ali270884@gmail.com)
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 text-sm text-muted-foreground text-center">
              <p>Seed data includes:</p>
              <ul className="list-disc list-inside mt-2">
                <li>40+ Medical products</li>
                <li>6 Categories</li>
                <li>3 Verified vendors</li>
                <li>Pre-filled quotations</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}