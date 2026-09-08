import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { LoginResult } from "@/types/auth";

const sampleUser = {
  id: "1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@kura-crm.com",
  role: "admin",
};

const loginResult: LoginResult = {
  user: sampleUser,
  tokens: { accessToken: "access-1", refreshToken: "refresh-1" },
};

interface ApiModule {
  api: { get: Mock; post: Mock };
}

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const apiMock = api as unknown as ApiModule["api"];

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    apiMock.post.mockReset();
  });

  it("persists tokens and user after login", async () => {
    apiMock.post.mockResolvedValue({ data: { success: true, data: loginResult } });

    await useAuthStore.getState().login("ada@kura-crm.com", "s3curePass!");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe("access-1");
    expect(state.refreshToken).toBe("refresh-1");
    expect(state.user?.email).toBe("ada@kura-crm.com");
    expect(apiMock.post).toHaveBeenCalledWith("/api/auth/login", {
      email: "ada@kura-crm.com",
      password: "s3curePass!",
    });
  });

  it("rejects with the API error when login fails", async () => {
    apiMock.post.mockRejectedValue(new Error("Invalid credentials."));

    await expect(useAuthStore.getState().login("ada@kura-crm.com", "wrong")).rejects.toThrow(
      "Invalid credentials.",
    );
  });

  it("clears the session on logout even if the API call fails", async () => {
    apiMock.post.mockRejectedValue(new Error("offline"));
    useAuthStore.setState({
      user: sampleUser,
      accessToken: "access-1",
      refreshToken: "refresh-1",
      isAuthenticated: true,
    });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it("rotates tokens via setTokens", () => {
    useAuthStore.getState().setTokens({ accessToken: "new-access", refreshToken: "new-refresh" });
    expect(useAuthStore.getState().accessToken).toBe("new-access");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
