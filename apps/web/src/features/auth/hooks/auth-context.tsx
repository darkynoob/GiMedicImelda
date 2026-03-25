import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, loginRequest } from '../api/auth.service';
import type {
  AuthLoginResponse,
  CurrentUserResponse,
} from '../../../shared/types/contracts';

const STORAGE_KEY = 'gimedic.session';

interface AuthSession {
  accessToken: string;
  user: CurrentUserResponse;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  isBootstrapping: boolean;
  login: (input: LoginInput) => Promise<AuthLoginResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    readStoredSession(),
  );
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const storedSession = readStoredSession();

    if (!storedSession) {
      setIsBootstrapping(false);
      return;
    }

    void fetchCurrentUser(storedSession.accessToken)
      .then((user) => {
        const nextSession = {
          accessToken: storedSession.accessToken,
          user,
        };
        setSession(nextSession);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      })
      .catch(() => {
        setSession(null);
        window.localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isBootstrapping,
      async login(input) {
        const response = await loginRequest(input);
        const nextSession = {
          accessToken: response.accessToken,
          user: response.user,
        };
        setSession(nextSession);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
        return response;
      },
      logout() {
        setSession(null);
        window.localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [isBootstrapping, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
