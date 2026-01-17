import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendLoginEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://reddichat.manishsingh.tech",
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Send login notification email after social sign-in
      if (ctx.path.startsWith("/sign-in/social") || ctx.path.startsWith("/callback")) {
        const newSession = ctx.context.newSession;
        if (newSession?.user?.email && newSession?.user?.name) {
          sendLoginEmail(newSession.user.email, newSession.user.name).catch(console.error);
        }
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
