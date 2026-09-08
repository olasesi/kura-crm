import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { useAuthStore } from "@/store/authStore";
import type { ApiEnvelope, TokenPair } from "@/types/auth";

export type { ApiEnvelope, TokenPair } from "@/types/auth";

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const refreshTokens = async (): Promise<string | null> => {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    return null;
  }
  try {
    const { data } = await axios.post<ApiEnvelope<TokenPair>>("/api/auth/refresh", {
      refreshToken,
    });
    setTokens(data.data);
    return data.data.accessToken;
  } catch (error) {
    logger.warn("Token refresh failed — clearing session.", error);
    await logout();
    return null;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!original || error.response?.status !== 401 || original._retry) {
      if (!error.response) {
        logger.error("Network error:", error.message);
      }
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (token) {
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            void resolve(api(original));
          } else {
            reject(error);
          }
        });
      });
    }

    isRefreshing = true;
    const token = await refreshTokens();
    pendingQueue.forEach((callback) => callback(token));
    pendingQueue = [];
    isRefreshing = false;

    if (token) {
      original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
      return api(original);
    }

    return Promise.reject(error);
  },
);

interface ErrorBody {
  error?: string;
  message?: string;
}

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ErrorBody | undefined;
    if (error.response?.status === 401) {
      return "Your session has expired. Please sign in again.";
    }
    return body?.message ?? body?.error ?? error.message ?? "An unexpected error occurred.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
};
