import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM ?? "CloudMarc WC26 <onboarding@resend.dev>",
    }),
  ],
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/verify",
    error: "/signin",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      (session.user as { id: string; role?: string }).role = (
        user as { role?: string }
      ).role;
      return session;
    },
  },
});
