import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth() as any;
  const { signup } = auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signup(email, password, name);
      toast.success("Signed up successfully");
      window.location.href = "/register";
    } catch (err: any) {
      console.log(err);
      setError("Invalid email or password");
      toast.error("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8"
    >
      <h2 className="text-2xl font-semibold text-center mb-6">
        Sign up for an account
      </h2>

      <div className="space-y-4">
        <Button
          type="button"
          // onClick={handleGoogle}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition"
          aria-label="Continue with Google"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M21.8 10.23h-9.1v3.54h5.2c-.22 1.32-1.02 2.44-2.18 3.18v2.64h3.54c2.07-1.9 3.26-4.72 3.26-8.36 0-.56-.05-1.1-.16-1.63z"
              fill="#4285F4"
            />
            <path
              d="M12.7 21.7c2.97 0 5.47-1 7.29-2.7l-3.54-2.64c-.98.66-2.22 1.04-3.75 1.04-2.88 0-5.32-1.94-6.19-4.54H2.8v2.86c1.8 3.57 5.7 6 9.9 6z"
              fill="#34A853"
            />
            <path
              d="M6.5 13.86a6.03 6.03 0 010-3.72V7.28H2.8a10.99 10.99 0 000 9.44l3.7-2.86z"
              fill="#FBBC05"
            />
            <path
              d="M12.7 6.28c1.62 0 3.08.56 4.23 1.66l3.17-3.17C18.17 2.2 15.67 1.2 12.7 1.2 8.49 1.2 4.59 3.63 2.8 7.2l3.7 2.94c.87-2.6 3.31-4.86 6.2-4.86z"
              fill="#EA4335"
            />
          </svg>
          <span className="font-medium">Continue with Google</span>
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">or</span>
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-200"
          >
            Name
          </label>
          <Input
            id="name"
            type="text"
            // placeholder="you@example.com"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-200"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            // placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-200"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            // placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <span>
              <svg
                className="inline mr-2 h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Signing up...
            </span>
          ) : (
            "Sign Up"
          )}
        </Button>
      </div>
    </form>
  );
}
