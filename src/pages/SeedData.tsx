import { useState } from "react";
import { useMutation } from "convex/react";
import { Loader2, Database, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { api } from "@/convex/_generated/api";
import { Link } from "react-router-dom";

export default function SeedData() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const seedData = useMutation(api.seedPublic.runSeed);

  const handleSeed = async () => {
    setIsSeeding(true);
    setResult(null);
    try {
      await seedData();
      setResult("Demo data created successfully! Refresh the page to see the products.");
    } catch (error) {
      setResult("Demo data already exists or error occurred.");
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Database className="size-10 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Seed Demo Data</h1>
            <p className="text-sm text-muted-foreground">
              Initialize the database with sample data
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm space-y-2">
            <p className="font-medium">This will create:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>4 Categories (Electronics, Furniture, Industrial, Supplies)</li>
              <li>10 Products across categories</li>
              <li>1 Admin user</li>
              <li>4 Vendor users (3 verified, 1 unverified)</li>
              <li>2 Buyer users</li>
              <li>13 Pre-filled vendor quotations</li>
              <li>Sample analytics data</li>
            </ul>
          </div>

          <Button
            onClick={handleSeed}
            disabled={isSeeding || result !== null}
            className="w-full"
            size="lg"
          >
            {isSeeding ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Seeding Data...
              </>
            ) : result ? (
              <>
                <CheckCircle2 className="size-4 mr-2" />
                Data Seeded
              </>
            ) : (
              "Seed Demo Data"
            )}
          </Button>

          {result && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{result}</p>
            </div>
          )}

          <div className="pt-4 border-t space-y-2">
            <p className="text-sm font-medium">Demo User Credentials:</p>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p>🔑 <strong>Admin:</strong> admin@quickquote.com</p>
              <p>🏢 <strong>Vendor 1:</strong> vendor1@techsupply.com</p>
              <p>🏢 <strong>Vendor 2:</strong> vendor2@officepro.com</p>
              <p>🛒 <strong>Buyer 1:</strong> buyer1@construction.com</p>
            </div>
            <p className="text-xs text-muted-foreground italic mt-2">
              Note: Use Hercules Auth to sign in (auth handled automatically)
            </p>
          </div>

          <Link to="/">
            <Button variant="outline" className="w-full">
              Go to Home
            </Button>
          </Link>

          <Link to="/browse">
            <Button variant="outline" className="w-full">
              Browse Products
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}