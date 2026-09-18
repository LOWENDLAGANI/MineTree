/**
 * Validates that a redirect target is a safe, relative, internal path.
 * Blocks open-redirect vectors like "//evil.com", "https://evil.com",
 * "/\\evil.com", and protocol-relative URLs.
 */
export function safeInternalPath(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  const value = raw.trim();

  // Must start with a single "/" and must not start with "//" or "/\\".
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  // No control characters, no backslashes, no "://" anywhere.
  if (/[\s\\]/.test(value) || value.includes("://")) {
    return fallback;
  }
  // Cap length to keep it sane.
  if (value.length > 512) return fallback;

  return value;
}
