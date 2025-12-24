import { api } from "@/external/api";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

export function useInitApi() {
  const { isAuthenticated, isLoading, getAccessTokenSilently, } = useAuth0();
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      getAccessTokenSilently()
        .then(token => api.setAccessToken(token))
        .catch(console.error);
    }
  }, [isAuthenticated, isLoading, getAccessTokenSilently]);
}
