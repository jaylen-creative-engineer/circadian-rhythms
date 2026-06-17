import type { NextAuthOptions } from "next-auth";
import { getWhoopOAuthRedirectUri } from "./url";
import {
  parseTokenExpiry,
  persistWhoopIntegration,
  resolveAppUserId,
} from "../whoop/integration";
import { exchangeWhoopCode, getWhoopUserProfile } from "../whoop/client";
import { syncWhoopForUser } from "../whoop/sync";

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
          redirect_uri: getWhoopOAuthRedirectUri(),
        },
      },
      token: {
        async request({ params }) {
          const tokens = await exchangeWhoopCode(
            params.code as string,
            getWhoopOAuthRedirectUri()
          );
          return {
            tokens: {
              ...tokens,
              expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
            },
          };
        },
      },
      userinfo: {
        async request({ tokens }) {
          const profile = await getWhoopUserProfile(tokens.access_token as string);
          const userId =
            (await resolveAppUserId(profile.user_id)) ??
            process.env.APP_USER_ID ??
            crypto.randomUUID();
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
    async jwt({ token, account, user, profile }) {
      if (account?.provider === "whoop" && account.access_token && account.refresh_token && user) {
        const whoopUserId =
          (profile as { whoopUserId?: number } | undefined)?.whoopUserId ??
          (await getWhoopUserProfile(account.access_token)).user_id;

        token.userId = await persistWhoopIntegration({
          userId: user.id,
          whoopUserId,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: parseTokenExpiry(account.expires_at),
          displayName: user.name ?? "WHOOP User",
        });
      } else if (user) {
        token.userId = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId ?? token.sub) as string;
      }
      return session;
    },
    async signIn({ account, user, profile }) {
      if (account?.provider === "whoop" && account.access_token && account.refresh_token) {
        const whoopUserId =
          (profile as { whoopUserId?: number } | undefined)?.whoopUserId ??
          (await getWhoopUserProfile(account.access_token)).user_id;

        const appUserId = await persistWhoopIntegration({
          userId: user.id,
          whoopUserId,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: parseTokenExpiry(account.expires_at),
          displayName: user.name ?? "WHOOP User",
        });

        void syncWhoopForUser(appUserId).catch((err) => {
          console.error(`Initial WHOOP sync failed for ${appUserId}:`, err);
        });
      }
      return true;
    },
  },
  pages: {
    signIn: "/dashboard/settings",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
