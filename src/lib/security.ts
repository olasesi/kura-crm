const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export const escapeHtml = (input: string): string =>
  input.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);

export const isSafeUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const base = typeof window !== "undefined" ? window.location.href : "http://localhost/";
    const parsed = new URL(url, base);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const maskToken = (token: string | undefined): string => {
  if (!token || token.length < 10) return "(none)";
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
};
