import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";

import { ProtectedRoute } from "./ProtectedRoute";

const setup = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <p>Secret content</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to the login page", () => {
    useAuthStore.setState({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
    });
    setup();
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: {
        id: "1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@kura-crm.com",
        role: "admin",
      },
    });

    setup();
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });
});
