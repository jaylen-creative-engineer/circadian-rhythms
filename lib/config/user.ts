/**
 * Single-user deployments: set APP_USER_ID to your app_users.id so read-only API routes
 * (e.g. /display on a separate device) serve your data without a session cookie.
 */
export function getStaticAppUserId(): string | null {
  return process.env.APP_USER_ID ?? process.env.DEMO_USER_ID ?? null;
}

type ResolveUserIdOptions = {
  /** When false, only a signed-in session counts (for sync/calibration writes). */
  allowStatic?: boolean;
};

export async function resolveUserId(
  options: ResolveUserIdOptions = {}
): Promise<string | null> {
  const allowStatic = options.allowStatic ?? true;
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth/options");
  const session = await getServerSession(authOptions);

  if (session?.user?.id) return session.user.id;
  if (allowStatic) return getStaticAppUserId();
  return null;
}
