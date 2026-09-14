import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface DemoUser {
  name: string;
  email: string;
  role: string;
  initials: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: DemoUser | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateUser: (patch: Partial<DemoUser>) => void;
}

// ── Demo credentials (no real backend auth) ────────────────────────
const DEMO_EMAIL    = "demo@confiqra.app";
const DEMO_PASSWORD = "demo1234";
const SESSION_KEY   = "confiqra_demo_session";

const DEFAULT_USER: DemoUser = {
  name:     "Muthu Kutti",
  email:    DEMO_EMAIL,
  role:     "Configuration Analyst",
  initials: "MK",
};

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
  login: async () => ({ ok: false }),
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      // sessionStorage: clears when tab/window is closed — new session requires login
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as DemoUser;
        return { isAuthenticated: true, user: saved };
      }
    } catch {
      /* ignore corrupt storage */
    }
    return { isAuthenticated: false, user: null };
  });

  // Persist session in sessionStorage on change
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [state]);

  const login = useCallback(async (email: string, password: string) => {
    // Simulate a brief async round-trip for UX realism
    await new Promise<void>((r) => setTimeout(r, 600));

    if (
      email.trim().toLowerCase() === DEMO_EMAIL &&
      password === DEMO_PASSWORD
    ) {
      setState({ isAuthenticated: true, user: { ...DEFAULT_USER } });
      return { ok: true };
    }
    return { ok: false, error: "Invalid credentials. Use the demo account shown below." };
  }, []);

  const logout = useCallback(() => {
    setState({ isAuthenticated: false, user: null });
  }, []);

  const updateUser = useCallback((patch: Partial<DemoUser>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updated: DemoUser = {
        ...prev.user,
        ...patch,
        initials: patch.name ? deriveInitials(patch.name) : prev.user.initials,
      };
      return { ...prev, user: updated };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
