import { useCallback, useEffect, useMemo } from "react";
import { useAuth as useCustomAuth } from "@/contexts/AuthContext";

export function useAuth() {
  const auth = useCustomAuth();

  // Example: fetch the JWT token from localStorage or your auth context
  const fetchAccessToken = async ({
    forceRefreshToken,
  }: {
    forceRefreshToken: boolean;
  }) => {
    // You can implement token refresh logic here if needed
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    // return token;
    return null;
  };

  return {
    ...auth,
    fetchAccessToken,
  };
}

// export function useAuth() {
//   const auth = useCustomAuth();
//   const fetchAccessToken = useCallback(
//     async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
//       // Here you can do whatever transformation to get the ID Token
//       // or null
//       // Make sure to fetch a new token when `forceRefreshToken` is true
//       // return await getToken({ ignoreCache: forceRefreshToken });
//       return false;
//     },
//     // If `getToken` isn't correctly memoized
//     // remove it from this dependency array
//     [],
//   );
//   return useMemo(
//     () => ({
//       // Whether the auth provider is in a loading state
//       isLoading: isLoading,
//       // Whether the auth provider has the user signed in
//       isAuthenticated: isAuthenticated ?? false,
//       // The async function to fetch the ID token
//       fetchAccessToken,
//     }),
//     [isLoading, isAuthenticated, fetchAccessToken],
//   );
// }

type UseUserProps = {
  /**
   * Whether to automatically redirect to the login if the user is not authenticated
   */
  shouldRedirect?: boolean;
};

export function useUser({ shouldRedirect }: UseUserProps = {}) {
  const { user, isLoading, isAuthenticated, signinRedirect, registerRedirect } =
    useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && shouldRedirect) {
      signinRedirect();
    }
    // console.log("user.role:", user?.role);
    if (!user?.role) registerRedirect();
  }, [isLoading, isAuthenticated, shouldRedirect, signinRedirect]);

  return useMemo(() => {
    const id = user?._id;
    const name = user?.name;
    const email = user?.email;
    return {
      ...(user ?? {}),
      id,
      name,
      email,
      isAuthenticated,
      isLoading,
      // error,
    };
  }, [user, isAuthenticated, isLoading]);
}
