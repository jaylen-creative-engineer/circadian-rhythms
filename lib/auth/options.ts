import type { NextAuthOptions } from "next-auth";
import { createServiceClient } from "../supabase/server";
import { exchangeWhoopCode, getWhoopUserProfile } from "../whoop/client";

const WHOOP_SCOPES = [
  "read:profile",
  "read:sleep",
  "read:recovery",
  "read:cycles",
  "read:body_measurement",
  "offline",
].join(" ");

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "whoop",
      name: "WHOOP",
      type: "oauth",
      authorization: {
        url: "https://api.prod.whoop.com/oauth/oauth2/auth",
        params: {
          scope: WHOOP_SCOPES,
        },
      },
      token: {
        async request({ params }) {
          const tokens = await exchangeWhoopCode(params.code as string);
          return { tokens: { ...tokens, expires_at: Date.now() + tokens.expires_in * 1000 } };
        },
      },
      userinfo: {
        async request({ tokens }) {
          const profile = await getWhoopUserProfile(tokens.access_token as string);
          const supabase = createServiceClient();

          const { data: existing } = await supabase
            .from("user_integrations")
            .select("user_id")
            .eq("provider", "whoop")
            .eq("whoop_user_id", profile.user_id)
            .maybeSingle();

          const userId =
            existing?.user_id ?? process.env.APP_USER_ID ?? crypto.randomUUID();
          const name =
            [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "WHOOP User";

          return {
            id: userId,
            name,
            whoopUserId: profile.user_id,
          };
        },
      },
      clientId: process.env.WHOOP_CLIENT_ID,
      clientSecret: process.env.WHOOP_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.id as string,
          name: (profile.name as string) ?? "WHOOP User",
          whoopUserId: (profile as { whoopUserId?: number }).whoopUserId,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        token.userId = user.id;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
    async signIn({ account, user, profile }) {
      if (account?.provider === "whoop" && account.access_token && account.refresh_token) {
        const supabase = createServiceClient();
        const expiresAt = account.expires_at
          ? new Date(account.expires_at * 1000)
          : new Date(Date.now() + 3600 * 1000);

        const whoopUserId =
          (profile as { whoopUserId?: number } | undefined)?.whoopUserId ??
          (await getWhoopUserProfile(account.access_token)).user_id;

        await supabase.from("user_integrations").upsert(
          {
            user_id: user.id,
            provider: "whoop",
            whoop_user_id: whoopUserId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: expiresAt.toISOString(),
          },
          { onConflict: "user_id,provider" }
        );
      }
      return true;
    },
  },
  pages: {
    signIn: "/dashboard/settings",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
