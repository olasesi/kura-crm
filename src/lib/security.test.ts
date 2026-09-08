import { describe, expect, it } from "vitest";

import { escapeHtml, isSafeUrl, maskToken, normalizeEmail } from "./security";

describe("escapeHtml", () => {
  it("escapes HTML metacharacters", () => {
    expect(escapeHtml(`<script>alert("x")&'y'</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;y&#39;&lt;/script&gt;",
    );
  });
});

describe("isSafeUrl", () => {
  it("allows http(s) urls", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("http://example.com")).toBe(true);
  });

  it("rejects javascript:, data: and malformed urls", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<svg>")).toBe(false);
    expect(isSafeUrl("http://")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases emails", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });
});

describe("maskToken", () => {
  it("masks long tokens and handles missing values", () => {
    expect(maskToken("abcdefghijklmnop")).toBe("abcd...mnop");
    expect(maskToken(undefined)).toBe("(none)");
  });
});
