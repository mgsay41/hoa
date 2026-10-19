import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        // Single-admin system: only ADMIN_EMAIL may ever get an account
        before: async (user) => {
          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
          if (!adminEmail || user.email.toLowerCase() !== adminEmail) return false;
        },
      },
    },
  },
});

export type Auth = typeof auth;
