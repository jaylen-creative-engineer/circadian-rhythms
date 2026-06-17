/**
 * Canonical app origin for OAuth redirect URIs.
 * Must match NEXTAUTH_URL in Vercel (no trailing slash).
 */
export function getAppUrl(): string {
  const raw =
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (!raw) {
    throw new Error(
      "Missing NEXTAUTH_URL — set it to your production origin (e.g. https://your-app.vercel.app)"
    );
  }

  return raw.replace(/\/$/, "");
}

export function getWhoopOAuthRedirectUri(): string {
  return `${getAppUrl()}/api/auth/callback/whoop`;
}
