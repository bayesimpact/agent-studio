import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';

export function useAuth() {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      getAccessTokenSilently()
        .then(token => setAccessToken(token))
        .catch(console.error);
    }
  }, [isAuthenticated, isLoading, getAccessTokenSilently]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading
  };
}
