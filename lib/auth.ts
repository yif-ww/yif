import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, bearer } from "better-auth/plugins";
import { prisma } from "./prisma";
import { sendPasswordReset } from "./send-email";

/**
 * Resolve the canonical site URL.
 * In production, BETTER_AUTH_URL MUST be set to the deployed origin
 * (e.g. https://www.yifww.org). NEXT_PUBLIC_APP_URL is accepted as a fallback.
 */
const siteUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
  "http://localhost:3000";

const extraOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const trustedOrigins = Array.from(
  new Set(
    [
      siteUrl,
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      "http://localhost:3000",
      ...extraOrigins,
    ].filter((v): v is string => Boolean(v)),
  ),
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: siteUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordReset({
        recipientName: user.name ?? "",
        recipientEmail: user.email,
        resetUrl: url,
      });
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
  },
  trustedOrigins,
  // `bearer` lets the mobile app sign in with the same account and then send
  // the session as an `Authorization: Bearer` header. Sign-in responses carry
  // the token in a `set-auth-token` header. Web sessions still use cookies.
  plugins: [admin(), bearer()],
  // Throttle guessing of passwords. Stored in the database so the limit holds
  // across every server instance. Better Auth identifies callers by the
  // x-forwarded-for header, which the hosting platform sets.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 120,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 300, max: 3 },
      "/reset-password": { window: 300, max: 5 },
    },
  },
});
