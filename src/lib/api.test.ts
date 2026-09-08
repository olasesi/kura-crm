import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { getApiErrorMessage } from "./api";

describe("getApiErrorMessage", () => {
  it("returns the API message from the response body", () => {
    const error = new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 400,
      data: { message: "Invalid credentials." },
    } as never);
    expect(getApiErrorMessage(error)).toBe("Invalid credentials.");
  });

  it("falls back to the error field", () => {
    const error = new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 422,
      data: { error: "Duplicate entry." },
    } as never);
    expect(getApiErrorMessage(error)).toBe("Duplicate entry.");
  });

  it("returns a session-expired message for 401 responses", () => {
    const error = new AxiosError("Unauthorized", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 401,
      data: {},
    } as never);
    expect(getApiErrorMessage(error)).toMatch(/expired/i);
  });

  it("handles network errors without a response", () => {
    const error = new AxiosError("Network Error");
    expect(getApiErrorMessage(error)).toBe("Network Error");
  });

  it("handles generic errors and unknown values", () => {
    expect(getApiErrorMessage(new Error("boom"))).toBe("boom");
    expect(getApiErrorMessage("junk")).toBe("An unexpected error occurred.");
  });
});
