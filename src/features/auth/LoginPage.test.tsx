import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/store/authStore";
import { renderWithProviders } from "@/test/utils";

import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("renders the sign-in form", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows validation errors for invalid input without calling login", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
  });

  it("normalizes the email and submits valid credentials", async () => {
    const login = vi.fn(async () => undefined);
    useAuthStore.setState({
      login,
      isAuthenticated: true,
      accessToken: null,
      refreshToken: null,
      user: null,
    });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "  Admin@Kura-CRM.com ");
    await user.type(screen.getByLabelText("Password"), "s3curePass!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith("admin@kura-crm.com", "s3curePass!");
  });
});
