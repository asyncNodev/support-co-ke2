import { useAuth as useCustomAuth } from "@/contexts/AuthContext";

export function useAuth() {
  const auth = useCustomAuth();

  // Example: fetch the JWT token from localStorage or your auth context
  const fetchAccessToken = async ({
    forceRefreshToken,
  }: {
    forceRefreshToken: boolean;
  }): Promise<string | null> => {
    // You can implement token refresh logic here if needed
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    return token;
  };

  return {
    ...auth,
    fetchAccessToken,
  };
}

export function useUser() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}
