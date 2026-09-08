import { create } from "zustand";
import { persist } from "zustand/middleware";

import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import type { ApiEnvelope, LoginResult, TokenPair, UserProfile } from "@/types/auth";

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (tokens: TokenPair) => void;
  setUser: (user: UserProfile) => void;
  clear: () => void;
}

const clearSession = () =>
  ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  }) as const;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post<ApiEnvelope<LoginResult>>("/api/auth/login", {
          email,
          password,
        });
        const { user, tokens } = data.data;
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        });
        logger.info(`User logged in: ${user.email}`);
      },

      logout: async () => {
        try {
          await api.post("/api/auth/logout");
        } catch (error) {
          logger.warn("Logout request failed — clearing session locally.", error);
        }
        set(clearSession());
      },

      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        }),

      setUser: (user) => set({ user }),

      clear: () => set(clearSession()),
    }),
    {
      name: "kura-crm-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<AuthState>;
        return {
          ...current,
          user: saved.user ?? null,
          accessToken: saved.accessToken ?? null,
          refreshToken: saved.refreshToken ?? null,
          isAuthenticated: Boolean(saved.accessToken),
        };
      },
    },
  ),
);
