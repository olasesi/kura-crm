import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { renderWithProviders } from "@/test/utils";

import { DashboardPage } from "./DashboardPage";

interface ApiModule {
  api: { get: Mock; post: Mock };
}

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const apiMock = api as unknown as ApiModule["api"];

describe("DashboardPage", () => {
  it("shows account details from the auth store", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: "a",
      refreshToken: "r",
      user: {
        id: "1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@kura-crm.com",
        role: "admin",
      },
    });
    apiMock.get.mockResolvedValue({
      data: { success: true, status: "healthy", uptime: 1, checks: { database: "connected" } },
    });

    renderWithProviders(<DashboardPage />, { route: "/dashboard" });

    expect(await screen.findByText("ada@kura-crm.com")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("surfaces backend health once the query resolves", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: "a",
      refreshToken: "r",
      user: null,
    });
    apiMock.get.mockResolvedValue({
      data: {
        success: true,
        status: "healthy",
        uptime: 1,
        checks: { database: "connected", redis: "connected" },
      },
    });

    renderWithProviders(<DashboardPage />, { route: "/dashboard" });

    expect(await screen.findByText("healthy")).toBeInTheDocument();
    expect(screen.getAllByText("connected")).toHaveLength(2);
  });

  it("shows an error message when the API is unreachable", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: "a",
      refreshToken: "r",
      user: null,
    });
    apiMock.get.mockRejectedValue(new Error("Network Error"));

    renderWithProviders(<DashboardPage />, { route: "/dashboard" });

    expect(
      await screen.findByText(/Unable to reach the backend/, {}, { timeout: 20_000 }),
    ).toBeInTheDocument();
  });

  it("signs out when the logout button is pressed", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: "a",
      refreshToken: "r",
      user: {
        id: "1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@kura-crm.com",
        role: "admin",
      },
    });
    apiMock.get.mockResolvedValue({
      data: { success: true, status: "degraded", uptime: 1, checks: {} },
    });
    apiMock.post.mockResolvedValue({ data: { success: true } });

    renderWithProviders(<DashboardPage />, { route: "/dashboard" });

    fireEvent.click(screen.getByText("Sign out").closest("button") as HTMLButtonElement);

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
    expect(apiMock.post).toHaveBeenCalledWith("/api/auth/logout");
  });
});
