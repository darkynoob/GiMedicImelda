import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  fetchCurrentUser,
  loginRequest,
  refreshSessionRequest,
} from '../api/auth.service';
import type {
  AuthLoginResponse,
  CurrentUserResponse,
} from '../../../shared/types/contracts';

const STORAGE_KEY = 'gimedic.session';
const REFRESH_MARGIN_MS = 60_000;

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: CurrentUserResponse;
  accessTokenExpiresAt: number;
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

function decodeJwtPayload(token: string) {
  const tokenParts = token.split('.');

  if (tokenParts.length < 2) {
    throw new Error('Token JWT inválido');
  }

  const payloadSegment = tokenParts[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(tokenParts[1].length / 4) * 4, '=');

  const payload = JSON.parse(window.atob(payloadSegment)) as { exp?: number };
  return payload;
}

function getAccessTokenExpiresAt(token: string) {
  const payload = decodeJwtPayload(token);

  if (!payload.exp) {
    throw new Error('El token no incluye expiración');
  }

  return payload.exp * 1000;
}

function buildSession(response: AuthLoginResponse): AuthSession {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user: response.user,
    accessTokenExpiresAt: getAccessTokenExpiresAt(response.accessToken),
  };
}

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

function persistSession(session: AuthSession | null) {
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    readStoredSession(),
  );
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const refreshTimerRef = useRef<number | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const logout = () => {
    clearRefreshTimer();
    setSession(null);
    persistSession(null);
  };

  const refreshSession = async (refreshToken: string) => {
    const response = await refreshSessionRequest(refreshToken);
    const refreshedSession = buildSession(response);
    const currentUser = await fetchCurrentUser(refreshedSession.accessToken);
    const nextSession = {
      ...refreshedSession,
      user: currentUser,
    };

    setSession(nextSession);
    persistSession(nextSession);
    return nextSession;
  };

  useEffect(() => {
    const storedSession = readStoredSession();

    if (!storedSession) {
      setIsBootstrapping(false);
      return;
    }

    const now = Date.now();
    const shouldRefreshImmediately =
      storedSession.accessTokenExpiresAt - now <= REFRESH_MARGIN_MS;

    const bootstrap = async () => {
      try {
        if (shouldRefreshImmediately) {
          await refreshSession(storedSession.refreshToken);
        } else {
          const user = await fetchCurrentUser(storedSession.accessToken);
          const nextSession = {
            ...storedSession,
            user,
          };
          setSession(nextSession);
          persistSession(nextSession);
        }
      } catch {
        logout();
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    clearRefreshTimer();

    if (!session) {
      return;
    }

    const delay = Math.max(
      session.accessTokenExpiresAt - Date.now() - REFRESH_MARGIN_MS,
      5_000,
    );

    refreshTimerRef.current = window.setTimeout(() => {
      void refreshSession(session.refreshToken).catch(() => {
        logout();
      });
    }, delay);

    return () => {
      clearRefreshTimer();
    };
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isBootstrapping,
      async login(input) {
        const response = await loginRequest(input);
        const nextSession = buildSession(response);
        setSession(nextSession);
        persistSession(nextSession);
        return response;
      },
      logout,
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
