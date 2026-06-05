import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const normalizedEmail = String(credentials.email).trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (!user?.password) return null;
        const valid = await bcrypt.compare(String(credentials.password), user.password);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { id: string; role?: string; name?: string | null }).role =
        token.role as string;
      session.user.name = token.name as string | null | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
});
